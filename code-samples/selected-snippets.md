# Selected Code Snippets

## Snippet 1: Document Intake Queues Reindex Automatically

### Why this matters

Saving a knowledge document should not require an admin to remember a second indexing step. The API writes the document, invalidates cached list data, then queues an ingest job when `autoReindex` is enabled.

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
        where: { tenantId_sourceId_externalId: { tenantId, sourceId, externalId: doc.externalId } },
        create: { tenantId, sourceId, ...doc, version: 1 },
        update: { ...doc, version: { increment: 1 } },
      })
    : await db.kbDocument.create({ data: { tenantId, sourceId, ...doc, version: 1 } });

  savedDocuments.push(saved);
}

invalidateKbSourcesCache(tenantId);
invalidateKbDocumentsCache(tenantId);

if (autoReindex) {
  const jobId = await createKbIngestJob({ tenantId, sourceId, createdByUserId, mode: "full" });
  queuePostResponseWork(() => runKbIngestJob({ tenantId, jobId }));
}
```

### Design Notes

This approach keeps the admin workflow simple while preserving a reliable background-processing boundary. External IDs support repeat imports and system-default refreshes without creating duplicate documents.

Risk reduced: stale search results, duplicate KB records, and slow document-save requests.

## Snippet 2: Ingest Jobs Are Claimed Before Processing

### Why this matters

Background work must be observable and safe to retry. A job should only run when it belongs to the current tenant and is in a claimable state.

### Code

```ts
export async function claimKbIngestJob(jobId: string, tenantId: string): Promise<boolean> {
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

### Design Notes

The claim step acts like a small concurrency guard. It prevents a completed job from being processed again and prevents work from crossing tenant boundaries.

Risk reduced: duplicate ingest runs, confusing job state, and cross-tenant processing mistakes.

## Snippet 3: Reindex Rebuilds Chunks and Embeddings

### Why this matters

The searchable representation of a document should match the latest raw text. Rebuilding chunks during reindex keeps retrieval aligned with the current document version.

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

### Design Notes

The delete-and-rebuild model is easy to reason about for a full reindex. Batching embeddings improves throughput while keeping provider calls bounded.

Risk reduced: stale chunks, inconsistent embeddings, and excessive embedding requests.

## Snippet 4: Hybrid Retrieval Combines Full-Text and Vector Search

### Why this matters

Maintenance questions mix exact terms and fuzzy descriptions. A user might ask for "waiting parts escalation" or "why did inventory not change after approval?" Hybrid retrieval improves recall across both styles.

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
    searchByFullText({ tenantId: input.tenantId, query, topK, filters: input.filters }),
    searchByVector({ tenantId: input.tenantId, query, topK, filters: input.filters }),
  ]);

  return reciprocalRankFusion(ftsHits, vectorHits, topK);
}
```

### Design Notes

Running both branches in parallel keeps latency lower than sequential search. Rank fusion avoids hard-coding one search method as always superior.

Risk reduced: missed answers caused by wording mismatch or embedding-only ambiguity.

## Snippet 5: Query Logs Avoid Raw Chunk Text

### Why this matters

Observability is useful, but logs should not become another place where private SOP text is copied. The query log stores metrics and identifiers, not raw chunk contents.

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

### Design Notes

This gives the team enough information to analyze quality and latency without duplicating sensitive document text.

Risk reduced: privacy exposure, log bloat, and accidental leakage through analytics.
