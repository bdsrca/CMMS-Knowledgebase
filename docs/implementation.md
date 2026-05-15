# Implementation

## Source Management

Sources represent logical collections of knowledge such as SOPs, manuals, system-default help, PM guidance, inventory policies, or work-order rules. Each source belongs to one tenant and has a name, type, status, config JSON, document count, and timestamps.

The source list API returns a dashboard-ready model rather than exposing raw database rows. The UI uses that model to render active badges, system-default badges, document counts, and reindex actions.

## Document Intake

Documents are stored under sources. Each document includes title, raw text, optional language, optional external ID, optional checksum, metadata, version, and status.

The intake path validates that title and text exist. It then writes the document and can automatically queue a full reindex. This keeps the admin workflow simple: paste the SOP or FAQ, save it, and the system creates the background work needed to make it searchable.

## Ingest Jobs

Ingest jobs decouple document writes from expensive processing. The API returns a job ID immediately, while the runner can execute after response finalization or through a worker endpoint.

The job store normalizes status rows for the UI, clamps list limits, and caches short-lived list responses. Jobs include retry count, error text, timestamps, and stats JSON so admins can see what happened.

## Chunking and Embeddings

The ingest runner splits raw document text into overlapping chunks. In the observed implementation, reindexing uses 500-character chunks with 50 characters of overlap for the rebuild path. Overlap helps preserve context near boundaries, which matters for SOP steps and troubleshooting guidance.

Embeddings are generated in batches. Batching reduces provider round trips and keeps ingest throughput more predictable. Chunks are persisted with ordinal order, token estimate, metadata, provider, model, dimension, and updated timestamp.

## Retrieval

The retrieval path clamps `topK`, normalizes query text, applies tenant and filter constraints, and runs full-text and vector branches in parallel.

Full-text search is useful for exact terms like equipment codes, "waiting parts", "PM", "settings", or "export". Vector search is useful when users ask semantically similar questions with different wording. Rank fusion combines both so the answer layer receives a stronger evidence set.

## Answer Generation

The ask path uses retrieved chunks as the only evidence source. It builds context with numbered documents, asks for JSON output, extracts `[doc:n]` references, and returns citations mapped to retrieved chunks.

The result includes:

- Answer text.
- Confidence.
- Citations.
- Retrieved hits.
- Next actions.

This response model is ready for an assistant panel because it has both explanation and UI actions.

## Observability

Search and ask routes write query logs after the response. Logs include latency, filters, confidence, retrieved chunk IDs, and citation IDs. The logging path is non-blocking and failure-tolerant.

This is useful for later self-learning loops: low-confidence questions, empty retrievals, and repeated unanswered topics can become signals for content review.
