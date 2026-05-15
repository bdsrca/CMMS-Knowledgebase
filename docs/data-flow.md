# Data Flow

## Ingest Flow

1. An admin creates or selects a KB source.
2. The admin saves a document with title, raw text, language, and optional metadata.
3. The document API validates the request and writes the document under the current tenant.
4. The API creates a `PENDING` ingest job.
5. The worker claims the job and moves it to `PROCESSING`.
6. The runner reads active documents for the source.
7. Existing chunks for each document are deleted.
8. Raw text is split into overlapping chunks.
9. Chunks are embedded in batches.
10. Chunk rows are written with metadata and optional vector embeddings.
11. The job is marked `COMPLETED` with stats, or `FAILED` with error details.

## Ask/Search Flow

1. A user asks a question from the assistant panel or search endpoint.
2. The API resolves tenant access and derives role/UI filters.
3. Retrieval runs full-text search and vector search in parallel.
4. Results are merged with reciprocal rank fusion.
5. The ask layer builds numbered context from the top hits.
6. The AI runtime returns structured JSON containing answer, confidence, and next actions.
7. Citations are extracted from `[doc:n]` references.
8. The API returns answer, confidence, citations, next actions, and hits.
9. A query log is written after the response.

## Self-Learning Loop

The system does not silently rewrite policy or invent new SOPs. Instead, it creates a feedback loop:

- Low-confidence questions reveal weak content coverage.
- Empty retrievals reveal missing documents or poor source labels.
- Frequent queries reveal training needs.
- Citation patterns reveal which documents are most operationally useful.
- Ingest job failures reveal source or embedding pipeline issues.

Those signals can guide admins to improve source documents, review stale procedures, and refresh system-default packs.

## Diagram

See [../diagrams/data-flow.mmd](../diagrams/data-flow.mmd).
