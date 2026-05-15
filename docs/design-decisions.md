# Configuration Notes

This document summarizes the main configuration and implementation choices used by the
knowledge-base workflow.

## Tenant-Scoped Data

Sources, documents, chunks, jobs, and query logs all carry tenant context.

That is the safe default for a CMMS because maintenance procedures, equipment names, policies,
and settings are often tenant-specific.

## API-Controlled Admin Writes

Source creation, document creation, system-default refresh, and reindexing run through API
routes with access checks.

The UI does not write directly to persistence. This keeps tenant access, role checks, request
IDs, validation, and error handling in one controlled path.

## Reindex Jobs

Embedding work can be slow, provider-dependent, and failure-prone.

The job model makes ingest work visible and retryable. Admin screens can show states such as
`PENDING`, `PROCESSING`, `COMPLETED`, and `FAILED` instead of hiding indexing behind a save
button.

## Chunk Rebuilds

Reindexing deletes existing chunks for a document and rebuilds from the current raw text.

This keeps searchable state aligned with the source document and avoids stale chunks after a
document update.

## Hybrid Retrieval

Full-text search and vector search solve different matching problems.

Full-text search handles exact CMMS terms, labels, and asset names. Vector search helps when a
user phrases the question differently from the approved document. Rank fusion combines both
result sets before evidence is sent to the answer layer.

## Citations and Confidence

Answers include citations and confidence instead of returning only prose.

This gives users a way to inspect the source material behind an answer before acting on
operational guidance.

## Metadata-Oriented Query Logs

The query log stores identifiers, timing, confidence, filters, and citation metadata.

Raw retrieved chunk text is not copied into the log table. This keeps logs useful for review
without creating another store of private SOP or manual content.

## Deterministic Next Actions

The assistant can suggest actions such as opening work orders, inventory, PM, equipment, or KB
settings based on route and query context.

Those actions keep answers connected to the operational workflow instead of leaving users with a
generic text response.
