# Code Examples

These snippets are short, public-safe examples of the knowledge-base behavior described in the
README. They are intentionally sanitized: tenant IDs, user IDs, production URLs, private source
names, credentials, and raw operational documents are not included.

## Snippet 1: Document Intake Queues Reindex Automatically

### What it does

Saves tenant-scoped documents and queues reindexing when `autoReindex` is enabled. External IDs
support repeat imports and system-default refreshes without creating duplicate documents.

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

### Behavior

The important pattern is not the specific ORM call. It is the coupling of managed document save,
versioning, cache invalidation, and explicit reindex scheduling inside one tenant-scoped
workflow.

## Snippet 2: Ingest Jobs Are Claimed Before Processing

### What it does

Claims a tenant-scoped ingest job before processing begins. Only jobs in `PENDING` or `FAILED`
state can move into `PROCESSING`.

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

### Behavior

The state transition happens before chunking or embedding begins. That makes retries observable
and prevents a worker from processing a job it does not own.

## Snippet 3: Reindex Rebuilds Chunks and Embeddings

### What it does

Rebuilds searchable chunks from the latest document text and generates embeddings in batches.
Overlap keeps nearby procedure steps available across chunk boundaries.

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

### Behavior

The old chunks are removed before replacement chunks are written. That keeps retrieval from
mixing stale and current document versions.

## Snippet 4: Hybrid Retrieval Combines Full-Text and Vector Search

### What it does

Runs full-text search and vector search in parallel, then combines results with reciprocal rank
fusion before evidence is sent to the answer layer.

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

### Behavior

Full-text search is useful for exact asset names, status labels, and CMMS terms. Vector search
helps when a user phrases the question differently from the approved document.

## Snippet 5: Query Logs Avoid Raw Chunk Text

### What it does

Stores query metadata, filter context, timing, retrieved chunk IDs, and citation IDs. Raw
retrieved chunk content is not copied into the query log.

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

### Behavior

The query text and metadata can still help diagnose poor answers. The privacy boundary is that
retrieved SOP/manual content is referenced by ID instead of copied into logs.
