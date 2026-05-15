# Selected Code Walkthrough

These snippets are short, public-safe examples adapted from the implementation. They are intentionally sanitized: tenant IDs, user IDs, production URLs, private source names, credentials, and raw operational documents are not included.

## Snippet 1: Document Save and Reindex Queue

### Problem

Admins need to add or update SOPs, FAQs, manuals, and help content without remembering a separate indexing command. If document save and indexing are disconnected, the assistant can answer from stale content.

### Decision

Save the document through a tenant-scoped API path, invalidate list caches, and queue a reindex job when `autoReindex` is enabled.

### Code

```ts
const docs = rows.map(normalizeDoc).filter(Boolean);
if (!docs.length) {
  throw new AppError({
    status: 400,
    code: "BAD_REQUEST",
    message: "Each document requires title and rawText.",
  });
}

for (const doc of docs) {
  const saved = doc.externalId
    ? await db.kbDocument.upsert({
        where: {
          tenantId_sourceId_externalId: {
            tenantId,
            sourceId,
            externalId: doc.externalId,
          },
        },
        create: { tenantId, sourceId, ...doc, version: 1 },
        update: { ...doc, version: { increment: 1 } },
      })
    : await db.kbDocument.create({
        data: { tenantId, sourceId, ...doc, version: 1 },
      });

  savedDocuments.push(saved);
}

invalidateKbSourcesCache(tenantId);
invalidateKbDocumentsCache(tenantId);

if (autoReindex) {
  const jobId = await createKbIngestJob({
    tenantId,
    sourceId,
    createdByUserId,
    mode: "full",
  });

  queuePostResponseWork(() => runKbIngestJob({ tenantId, jobId }));
}
```

### Impact

The admin workflow stays simple, while the backend keeps indexing work explicit and observable. External IDs support repeat imports and system-default refreshes without creating duplicate documents.

## Snippet 2: Background Job Claiming

### Problem

Reindexing is long-running work. It can fail, be retried, or be triggered while another job is active. The system needs a safe way to claim work before processing.

### Decision

Only claim a job when it belongs to the current tenant and is in a claimable state such as `PENDING` or `FAILED`.

### Code

```ts
export async function claimKbIngestJob(
  jobId: string,
  tenantId: string
): Promise<boolean> {
  const rows = await db.query`
    UPDATE "KbIngestJob"
    SET status = 'PROCESSING',
        "startedAt" = NOW(),
        "completedAt" = NULL,
        error = NULL,
        "updatedAt" = NOW()
    WHERE id = ${jobId}
      AND "tenantId" = ${tenantId}
      AND status IN ('PENDING', 'FAILED')
    RETURNING id
  `;

  return rows.length > 0;
}
```

### Impact

The claim step reduces duplicate processing and protects tenant boundaries. It also gives the UI meaningful job states that admins can monitor and retry.

## Snippet 3: Chunking and Embedding

### Problem

Long maintenance documents cannot be embedded or retrieved as one large text blob. SOPs need to be split into searchable units while preserving context around boundaries.

### Decision

Rebuild chunks from the current document text, use overlap between chunks, and generate embeddings in batches.

### Code

```ts
await db.execute`
  DELETE FROM "KbChunk"
  WHERE "tenantId" = ${tenantId}
    AND "documentId" = ${documentId}
`;

const chunks = splitIntoChunks(rawText, {
  chunkChars: 500,
  overlapChars: 50,
});

const vectors = await embedChunksInBatches(
  chunks.map((chunk) => chunk.content),
  100
);

for (const [index, chunk] of chunks.entries()) {
  await insertKbChunk({
    tenantId,
    documentId,
    ordinal: chunk.ordinal,
    content: chunk.content,
    tokenCount: chunk.tokenCount,
    embedding: vectors[index] ?? null,
    metadata,
  });
}
```

### Impact

The searchable state stays aligned with the latest source document. Batching keeps embedding calls predictable, and overlap improves retrieval quality for multi-step procedures.

## Snippet 4: Hybrid Retrieval

### Problem

Maintenance users do not always ask questions using the same words that appear in the SOP. Some questions need exact matching, while others need semantic matching.

### Decision

Run full-text search and vector search in parallel, then combine results with rank fusion before sending evidence to the answer layer.

### Code

```ts
export async function retrieveKbHits(input: {
  tenantId: string;
  query: string;
  filters?: KbQueryFilters;
  topK?: number;
}) {
  const query = normalizeText(input.query);
  const topK = clampTopK(input.topK);
  if (!query) return [];

  const [ftsHits, vectorHits] = await Promise.all([
    searchByFullText({
      tenantId: input.tenantId,
      query,
      topK,
      filters: input.filters,
    }),
    searchByVector({
      tenantId: input.tenantId,
      query,
      topK,
      filters: input.filters,
    }),
  ]);

  return reciprocalRankFusion(ftsHits, vectorHits, topK);
}
```

### Impact

The assistant can find exact operational terms and semantically related guidance. Running both branches in parallel keeps retrieval responsive.

## Snippet 5: Query Logging Without Raw SOP Text

### Problem

The team needs observability for answer quality, latency, confidence, and citation behavior, but logs should not become another storage location for private SOP text.

### Decision

Store query metadata, filter context, timing, retrieved chunk IDs, and citation IDs. Do not store raw retrieved chunk content in the query log.

### Code

```ts
await db.kbQueryLog.create({
  data: {
    tenantId,
    userId,
    route,
    query,
    latencyMs,
    confidence,
    filtersJson: {
      ...filters,
      _metrics: {
        topScore,
        avgScore,
        hitCount: hits.length,
      },
    },
    retrievedChunkIds: hits.map((hit) => hit.chunkId),
    answerCitationsJson: citations.map((citation) => ({
      index: citation.index,
      chunkId: citation.chunkId,
      documentId: citation.documentId,
      score: citation.score,
    })),
  },
});
```

### Impact

The system can review answer quality and identify missing content without duplicating private maintenance documents into analytics logs.
