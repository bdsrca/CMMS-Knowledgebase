# Data Flow

## Ingest flow

1. Admin creates or selects a knowledge source.
2. Admin saves a document with title, raw text, language, visibility, and metadata.
3. API validates tenant access and role permissions.
4. API creates or updates the document.
5. API creates a `PENDING` reindex job.
6. Worker claims the job and moves it to `PROCESSING`.
7. Runner reads active documents for the source.
8. Runner deletes old chunks for each document.
9. Runner splits raw text into overlapping chunks.
10. Runner generates embeddings in batches.
11. Runner writes searchable chunk rows.
12. Job is marked `COMPLETED` with stats or `FAILED` with error details.

![Ingest flow](../assets/ingest-pipeline.svg)

## Ask/search flow

1. User asks a question from the current page or helper panel.
2. API resolves tenant, role, and UI context.
3. Retrieval applies tenant and role filters.
4. Full-text and semantic search run in parallel.
5. Rank fusion merges results.
6. Answer layer builds a grounded context block.
7. AI runtime returns structured answer, confidence, citations, and next actions.
8. API maps citations back to chunks and documents.
9. Query log is written after response.

![Hybrid retrieval](../assets/hybrid-retrieval.svg)

## Feedback flow

The system does not silently rewrite source documents.

Instead, it creates improvement signals:

- low-confidence answers;
- no-result searches;
- repeated questions;
- stale citations;
- sources due for review;
- failed ingest jobs;
- documents with low citation usage;
- high-latency retrieval calls.

Admins and content owners use those signals to improve documents and reindex.

![Knowledge lifecycle](../assets/knowledge-lifecycle.svg)
