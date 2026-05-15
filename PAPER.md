# A Tenant-Aware Knowledge Base for AI-Assisted CMMS Workflows

## Abstract

This paper describes a knowledge-base implementation for a modern CMMS system. The feature lets administrators register knowledge sources, add SOPs and support documents, run asynchronous reindex jobs, and expose the resulting knowledge to search and AI-assisted answers.

The central design goal is trust. Maintenance teams need answers that are grounded in approved documents, scoped to the right tenant, visible to the right role, and traceable through citations. A generic chatbot cannot provide that on its own. The system therefore separates source management, document ingestion, background indexing, hybrid retrieval, grounded answer generation, and query logging.

The resulting architecture demonstrates how a CMMS can move from static help content to a self-improving knowledge layer while keeping humans in control of source content and operational decisions.

## 1. Context

CMMS users ask practical questions:

- How should I start using the AI helper?
- Why does export take time?
- Who can change settings?
- How do I reindex the knowledge base?
- When should I use waiting parts?
- Why did inventory not change after approval?

These questions are not only help-center questions. They sit inside daily maintenance operations. The answer may depend on SOPs, role permissions, PM rules, inventory behavior, settings, or current page context.

The knowledge-base feature addresses this by turning approved maintenance documents into a searchable and answerable knowledge layer.

## 2. Problem

Maintenance knowledge is often scattered across manuals, SOP files, onboarding guides, admin notes, and informal process memory. When users cannot find trusted guidance quickly, they either interrupt another person or make a decision with incomplete context.

AI can help, but only if the system controls where answers come from. Without source governance, citations, and tenant isolation, AI answers can become risky. They may sound confident while using stale content, wrong tenant data, or unsupported assumptions.

The engineering challenge is to make the knowledge base useful without turning it into an uncontrolled automation path.

## 3. Design

The system uses five design principles.

### 3.1 Tenant Isolation

Every source, document, chunk, job, and query log belongs to a tenant. This keeps one organization's maintenance procedures separate from another organization's knowledge.

### 3.2 Admin-Controlled Sources

Admins register sources and manage documents. The source list gives them visibility into source type, status, document count, system-default packs, and updated timestamps.

### 3.3 Asynchronous Indexing

Document saves can queue a reindex job. The UI receives a job ID quickly while the backend performs chunking and embedding work in the background.

### 3.4 Hybrid Retrieval

The retrieval layer uses both full-text search and vector search. Full-text search catches exact operational terms. Vector search catches semantic matches. Rank fusion combines the two.

### 3.5 Grounded Answers

The answer layer builds context only from retrieved chunks. The output includes answer text, confidence, citations, retrieved hits, and next actions. If evidence is weak or the AI runtime is unavailable, the system uses explicit fallback behavior.

## 4. Implementation

The admin UI has four main panels:

- KB Sources: create sources, refresh the list, and refresh default help content.
- Document Intake: paste SOP, FAQ, or manual text into a selected source.
- Source List and Documents: inspect current source and document state.
- Ingest Jobs: monitor processing, completed, or failed reindex jobs.

The backend is organized around clear modules:

- Source and document APIs validate tenant access and admin roles.
- The job store creates and manages ingest-job state.
- The ingest runner rebuilds chunks and embeddings.
- The chunking module splits raw text into overlapping chunks.
- The retrieval module combines full-text and vector hits.
- The ask module produces grounded answers with citations.
- The query-log module records performance and evidence identifiers.

This separation makes the feature easier to evolve. For example, a future durable queue can replace the current worker path without changing the document API or assistant response model.

## 5. Data Model

The data model separates stable source content from derived searchable content.

`KbSource` represents a collection such as Maintenance SOPs, System Default Help, PM guidance, or inventory rules.

`KbDocument` stores the source document, version, language, metadata, and raw text.

`KbChunk` stores searchable slices of document text, chunk order, metadata, and optional vector embeddings.

`KbIngestJob` stores reindex state, retry count, errors, timestamps, and stats.

`KbQueryLog` stores route, filters, latency, confidence, retrieved chunk IDs, and citation IDs.

This model keeps source truth, generated retrieval artifacts, background processing, and observability separate.

## 6. Why It Matters

The feature gives a CMMS three important capabilities.

First, it makes help and SOP content operational. Knowledge is no longer just a static document library; it can answer questions inside the workflow.

Second, it gives AI a controlled evidence base. The assistant is useful because it retrieves approved content and cites where the answer came from.

Third, it creates a self-improvement loop. Query logs and low-confidence answers reveal which documents are missing, stale, or unclear. Admins can improve the source content and reindex.

## 7. Tradeoffs

The design intentionally favors trust over maximum automation.

Reindex jobs add operational complexity, but they make long-running work visible and retryable.

Hybrid retrieval is more complex than keyword search, but it improves answer quality when users phrase questions differently from SOP text.

Citations and confidence make answer generation stricter, but they help users decide whether to rely on an answer.

Query logging adds another persistence path, but limiting logs to metrics and IDs reduces privacy risk.

## 8. Future Work

Future improvements should focus on durability, governance, and measurement:

- Add file parsing for PDFs and office documents.
- Move ingest execution to a durable queue.
- Add document review cadence and owner metadata.
- Add stale content alerts.
- Add low-confidence answer review workflows.
- Add evaluation dashboards based on golden questions.
- Add chunk-level diffing to avoid re-embedding unchanged content.

## 9. Conclusion

This knowledge-base implementation shows how AI can be added to a CMMS in a practical and controlled way. The strongest idea is not that AI can answer questions. The stronger idea is that a CMMS can make its operational knowledge structured, searchable, cited, tenant-aware, and continuously improvable.

That is the foundation for a safer AI-assisted maintenance platform.
