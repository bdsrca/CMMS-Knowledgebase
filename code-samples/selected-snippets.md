# Selected Code Walkthrough

These snippets are public-safe examples adapted to explain the design. They do not expose private routes, credentials, tenant IDs, production URLs, or raw operational documents.

## Snippet 1: document save queues reindex

### Problem

Admins need to add or update SOPs without remembering a separate indexing command.

### Decision

Save the document through a tenant-scoped API path, increment version when needed, and queue a reindex job when `autoReindex` is enabled.

```ts
async function saveKbDocument(input: SaveDocumentInput, actor: Actor) {
  assertCanManageSource(actor, input.tenantId, input.sourceId);

  const document = await upsertDocument({
    tenantId: input.tenantId,
    sourceId: input.sourceId,
    externalId: input.externalId,
    title: input.title,
    rawText: input.rawText,
    language: input.language ?? "en",
    visibility: input.visibility ?? "all_roles"
  });

  if (input.autoReindex) {
    const job = await createIngestJob({
      tenantId: input.tenantId,
      sourceId: input.sourceId,
      createdByUserId: actor.id,
      mode: "full"
    });

    queuePostResponseWork(() => runIngestJob(job.id));
  }

  return document;
}
```

### Impact

The UI remains simple, source content stays versioned, and indexing work is visible.

## Snippet 2: worker claims a job before processing

### Problem

Reindexing can be retried or triggered more than once.

### Decision

Only claim a job when tenant and state match.

```ts
async function claimIngestJob(jobId: string, tenantId: string) {
  const rows = await db.query(`
    update KbIngestJob
       set status = 'PROCESSING', startedAt = now(), error = null
     where id = $1
       and tenantId = $2
       and status in ('PENDING', 'FAILED')
     returning id
  `, [jobId, tenantId]);

  return rows.length === 1;
}
```

### Impact

The system avoids duplicate work and protects tenant boundaries.

## Snippet 3: chunking with overlap

```ts
const chunks = splitIntoChunks(document.rawText, {
  maxChars: 500,
  overlapChars: 50
});
```

Overlap helps preserve context across SOP step boundaries.

## Snippet 4: hybrid retrieval

```ts
const [keywordHits, semanticHits] = await Promise.all([
  searchByFullText({ tenantId, query, filters, topK }),
  searchByVector({ tenantId, query, filters, topK })
]);

const hits = reciprocalRankFusion([keywordHits, semanticHits], { limit: topK });
```

Full-text search catches exact CMMS terms. Semantic search catches paraphrased questions.

## Snippet 5: cited answer package

```ts
return {
  answer,
  confidence,
  citations: hits.slice(0, 3).map((hit, index) => ({
    index: index + 1,
    documentTitle: hit.documentTitle,
    chunkId: hit.chunkId,
    score: hit.score
  })),
  nextActions,
  retrievedHits: hits,
  fallbackReason: confidence < 0.45 ? "weak_evidence" : null
};
```

The answer can be inspected because citations map back to retrieved chunks.

## Snippet 6: privacy-conscious query log

```ts
await db.kbQueryLog.create({
  data: {
    tenantId,
    userId,
    route,
    query,
    latencyMs,
    confidence,
    filtersJson: filters,
    retrievedChunkIds: hits.map(hit => hit.chunkId),
    answerCitationsJson: citations.map(citation => ({
      chunkId: citation.chunkId,
      documentTitle: citation.documentTitle,
      score: citation.score
    }))
  }
});
```

The log references evidence by ID. It does not copy raw retrieved SOP text into the log.
