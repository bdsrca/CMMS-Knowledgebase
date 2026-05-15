# Design Decisions

## Decision 1: Treat Knowledge as Tenant-Scoped Data

The system stores tenant ID on sources, documents, chunks, jobs, and query logs. This is the right default for a CMMS because maintenance procedures, equipment names, policies, and settings are often tenant-specific.

Risk reduced: cross-tenant data leakage and irrelevant answers.

## Decision 2: Keep Admin Writes Behind API Routes

Source creation, document creation, system-default refresh, and reindexing are handled by API routes with access checks. The UI does not write directly to persistence.

Risk reduced: accidental bypass of tenant access, role checks, request IDs, validation, and error handling.

## Decision 3: Queue Reindexing as a Job

Embedding work can be slow, provider-dependent, and failure-prone. A job model makes the work observable and retryable.

Risk reduced: slow admin requests, hidden failures, and unclear ingest state.

## Decision 4: Rebuild Chunks from Raw Text

Reindexing deletes existing chunks for a document and rebuilds from the current raw text. This keeps the searchable state aligned with the source document.

Risk reduced: stale chunks, duplicate chunks, and confusing old answers after a document update.

## Decision 5: Use Hybrid Retrieval

Full-text search and vector search solve different problems. The system runs both and fuses results.

Risk reduced: missed matches caused by either exact-word mismatch or embedding-only ambiguity.

## Decision 6: Require Citations and Confidence

The answer model includes citations and confidence rather than returning only prose. This gives users a way to inspect why the assistant answered the way it did.

Risk reduced: over-trust in AI answers and unsupported operational advice.

## Decision 7: Log Metadata, Not Raw Chunk Text

The query log stores identifiers and metrics instead of copying retrieved chunk content into the log table.

Risk reduced: privacy footprint, storage duplication, and accidental exposure through analytics.

## Decision 8: Provide Deterministic Next Actions

The assistant can suggest actions such as opening work orders, inventory, PM, equipment, or KB settings based on route and query context.

Risk reduced: generic answers that do not help users move to the next operational step.
