# Architecture

## Purpose

The Knowledge Base feature turns maintenance knowledge into a controlled retrieval layer for a CMMS. The design goal is not only to answer questions. It is to answer questions with tenant isolation, admin control, observable ingest jobs, and cited evidence.

## Main Components

### Knowledge Base Settings UI

The admin UI owns source setup, document intake, source browsing, document browsing, and job monitoring. It gives administrators a place to refresh system defaults, add manual content, and trigger reindexing without touching backend scripts.

Key behavior:

- Loads sources and jobs together.
- Loads documents when a source is selected.
- Queues reindexing automatically when a document is saved.
- Polls jobs only while one is active.
- Displays status, document count, version, language, and updated timestamps.

### Source and Document APIs

The source and document APIs sit behind tenant access checks and admin role checks. They prevent the UI from bypassing business rules and keep source/document writes scoped to the current tenant.

The document API supports two write modes:

- Create a new document when no external ID is present.
- Upsert and increment version when an external ID is present.

That second mode matters for system-default content and repeat imports, where a stable external ID lets the system update known documents safely.

### Ingest Job Store

The job store provides a small state machine:

```text
PENDING -> PROCESSING -> COMPLETED
PENDING -> PROCESSING -> FAILED
FAILED  -> PROCESSING -> COMPLETED
```

The store uses scoped updates so a job can only be claimed when it belongs to the tenant and is in a claimable state. This reduces duplicate work and makes retry behavior explicit.

### Ingest Runner

The runner rebuilds chunks for active documents in a source. It deletes existing chunks for a document, splits raw text into overlapping chunks, embeds the chunk text in batches, and writes chunk rows with metadata and embedding fields.

This makes reindexing deterministic: the searchable representation of a document is rebuilt from the current raw text.

### Retrieval Layer

The retrieval layer runs two search paths in parallel:

- Full-text search for direct operational language, titles, and exact terms.
- Vector search for semantic matches across SOP wording variations.

Results are merged with reciprocal rank fusion. The merged result keeps the top hits while preserving whether a hit came from full-text search, vector search, or both.

### Ask Layer

The ask layer turns retrieved chunks into a grounded response. It builds a context block, asks the AI runtime for a JSON response, extracts citations, computes confidence, and merges deterministic next actions.

If the AI runtime is unavailable, the system still returns retrieved evidence with a lower-confidence fallback instead of failing the workflow.

### Query Log

The query log is intentionally narrow. It stores route, filters, latency, confidence, retrieved chunk IDs, and citation IDs. It avoids raw chunk text so observability does not become a second copy of private knowledge content.

## Component Diagram

See [../diagrams/architecture.mmd](../diagrams/architecture.mmd).

## Why This Architecture Matters

This architecture separates source management, ingest processing, retrieval, answer generation, and observability. That separation reduces risk because each layer can be tested and evolved independently.

It also reflects the operational reality of CMMS software: knowledge changes over time, source content may be tenant-specific, answers need evidence, and background work must be visible to admins.
