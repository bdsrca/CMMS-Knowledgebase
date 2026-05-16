# Architecture

## Purpose

The knowledge-base feature turns maintenance knowledge into a controlled retrieval layer for CMMS/EAM.

The goal is not only to answer questions. The goal is to answer questions with source governance, tenant isolation, role-aware access, cited evidence, visible background work, and quality feedback.

![Architecture](../assets/kb-hero-architecture.svg)

## Main components

### Knowledge Base settings UI

The admin UI owns source setup, document intake, document browsing, source browsing, and job monitoring.

Useful UI behaviors:

- Load sources and recent jobs together.
- Load documents when a source is selected.
- Queue reindexing after document save when configured.
- Show `PENDING`, `PROCESSING`, `COMPLETED`, and `FAILED` job states.
- Show status, document count, version, language, visibility, and review cadence.

### Source and document APIs

Source and document APIs sit behind tenant checks and role checks.

The UI does not write directly to persistence. That keeps validation, permissions, request IDs, versioning, and errors in one controlled path.

### Ingest job store

The job store is a small state machine:

```text
PENDING -> PROCESSING -> COMPLETED
PENDING -> PROCESSING -> FAILED
FAILED  -> PROCESSING -> COMPLETED
```

A worker can claim a job only when the tenant matches and the job is in a claimable state.

### Ingest runner

The runner rebuilds searchable state from source truth:

1. read active documents;
2. delete old chunks for the document;
3. split text into overlapping chunks;
4. generate embeddings in batches;
5. write chunk rows with metadata;
6. mark job completed or failed.

### Retrieval layer

The retrieval layer runs two branches:

- full-text search for exact CMMS terms, equipment names, status labels, and procedure names;
- semantic search for related language and paraphrased user questions.

The results are merged with rank fusion.

### Ask layer

The ask layer builds a context block from retrieved chunks. The assistant is instructed to answer from that evidence. The response includes answer text, confidence, citations, next actions, and retrieved hits.

### Query log

The query log stores metadata, not private retrieved document text.

Good log fields:

- tenant ID reference;
- user role;
- route or page context;
- query text;
- latency;
- filters;
- confidence;
- retrieved chunk IDs;
- citation IDs;
- fallback reason.

Avoid storing raw SOP chunks in logs.

## Why this architecture matters

CMMS/EAM knowledge changes over time. Some content is tenant-specific. Some content is role-specific. Some answers are safety-sensitive. Some indexing jobs fail.

Separating source management, ingest, retrieval, answer generation, and observability makes the feature easier to reason about and safer to evolve.
