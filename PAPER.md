# A Tenant-Aware Knowledge Base for Next-Generation CMMS/EAM

## Abstract

This paper describes a knowledge-base pattern for modern CMMS/EAM software. The system lets administrators register knowledge sources, add approved maintenance documents, run asynchronous indexing jobs, and expose the resulting knowledge to cited AI-assisted answers.

The main design goal is trust. Maintenance teams do not only need fluent answers. They need answers that are grounded in approved content, scoped to the right tenant, visible to the right role, and traceable through citations.

The architecture separates source management, document ingestion, background indexing, hybrid retrieval, answer packaging, and query logging. That separation keeps the system practical: each layer can be tested, monitored, and improved without turning the assistant into an uncontrolled automation path.

## 1. Context

CMMS/EAM users ask concrete questions:

- How do I reindex the knowledge base?
- Why did inventory not change after approval?
- When should I use waiting-parts status?
- Which SOP applies when a compressor is noisy?
- Who is allowed to change settings?
- What does this alarm mean in the current work-order context?

These are not casual help-center questions. They sit inside daily maintenance work. A wrong answer can waste technician time, hide a safety step, consume the wrong part, or point a user to stale policy.

The knowledge-base feature turns approved maintenance documents into a controlled answer layer. It is designed for the working reality of CMMS/EAM systems: multiple tenants, role permissions, operational procedures, background jobs, data freshness, and safety-sensitive guidance.

## 2. Problem

Maintenance knowledge is usually scattered across manuals, SOP files, onboarding notes, PM templates, inventory rules, training decks, admin settings, and the memory of experienced staff.

When users cannot find trusted guidance quickly, they do one of three things:

1. interrupt another person;
2. make a decision with incomplete context;
3. ask an AI assistant that may answer without enough evidence.

The third option is attractive but risky. AI is useful only when the system controls where the answer comes from. Without source governance, citations, and tenant isolation, the answer can sound confident while relying on stale documents, wrong-tenant data, or unsupported assumptions.

## 3. Design principles

### 3.1 Tenant isolation

Sources, documents, chunks, ingest jobs, and query logs all belong to a tenant. Retrieval applies tenant scope before answer generation. This prevents knowledge from one organization from appearing in another organization's answer.

### 3.2 Admin-controlled source truth

Admins create sources and manage documents. The assistant does not invent procedures or silently rewrite SOPs. Source content remains owned by people and approved business processes.

### 3.3 Visible ingest work

Document indexing is asynchronous. Saving a document can queue a job with visible states such as `PENDING`, `PROCESSING`, `COMPLETED`, and `FAILED`. This gives admins a way to see whether knowledge is searchable yet.

### 3.4 Hybrid retrieval

Maintenance language is messy. Users use abbreviations, asset names, status labels, and informal phrases. Full-text search catches exact terms. Semantic search catches similar meaning. Rank fusion combines both results before answer generation.

### 3.5 Cited answers

The assistant returns answer text, confidence, citations, next actions, and retrieved hits. The citation is not decoration. It is the trust mechanism that lets a user inspect the source before acting.

### 3.6 Privacy-conscious logs

Logs are useful for improving the system, but they should not become another copy of private documents. The query log stores timing, filters, confidence, retrieved chunk IDs, and citation IDs. It avoids raw retrieved SOP text.

## 4. System model

The system is built around a small set of concepts.

| Concept | Purpose |
| --- | --- |
| `KbSource` | A managed collection such as Maintenance SOPs, System Help, PM Rules, or Inventory Guidance |
| `KbDocument` | The source text, title, language, metadata, version, status, and review information |
| `KbChunk` | A searchable slice of a document, optionally with an embedding |
| `KbIngestJob` | A visible background job that rebuilds chunks and embeddings |
| `KbQueryLog` | A metadata-oriented record of question, route, filters, latency, confidence, retrieved IDs, and citations |
| `AnswerPackage` | The user-facing response: answer, confidence, citations, next actions, and evidence |

The important separation is between source truth and derived retrieval artifacts. Documents are source truth. Chunks and embeddings are rebuildable artifacts. Query logs are quality signals, not source content.

## 5. Workflow

### 5.1 Ingest flow

1. An admin creates or selects a source.
2. The admin saves a document with title, language, visibility, metadata, and raw text.
3. The document API validates tenant and role access.
4. A reindex job is created.
5. A worker claims the job.
6. Active documents are normalized and split into overlapping chunks.
7. Embeddings are generated in batches.
8. Old chunks are replaced by current chunks.
9. The job is marked completed or failed with stats.

![Ingest pipeline](assets/ingest-pipeline.svg)

### 5.2 Ask flow

1. A user asks a question from the current page or helper panel.
2. The system resolves tenant, role, and UI context.
3. Retrieval runs keyword and semantic branches.
4. Rank fusion merges the result lists.
5. The answer layer builds context only from retrieved chunks.
6. The assistant returns a structured answer package.
7. The system maps citations back to source documents.
8. A query log is written after the response.

![Hybrid retrieval](assets/hybrid-retrieval.svg)

## 6. Real-world maintenance examples

### Example 1: inventory did not change after approval

A planner approves a work order and expects inventory to decrease. The answer should not guess. It should retrieve the inventory rule and explain that stock changes when a part issue is posted or when a configured consumption rule fires. It should cite the rule and link the user to the work-order parts tab or inventory issue log.

### Example 2: noisy compressor

A technician reports abnormal compressor noise. The assistant should retrieve the triage SOP, recent PM guidance, and safety procedure. It should avoid making a shutdown decision on its own. It can recommend checks, show citations, and escalate if safety thresholds or abnormal vibration are mentioned.

### Example 3: drone inspection defect

A grid or facility inspection system flags a defect. A knowledge base can map the defect code to repair procedure, risk classification, required parts, and inspection evidence. The AI answer should be grounded in the defect procedure, not only in the image label.

### Example 4: rail fleet maintenance

Rail assets are safety-critical. A cited answer can help technicians find the right checklist or O&M procedure, but final action should remain under approved workflow and human review.

## 7. China manufacturing context

The phrase `中国智造` is often used to describe the shift from scale manufacturing to intelligent, connected, data-driven manufacturing. The official policy name is `中国制造2025`.

For CMMS/EAM product design, the important point is practical: intelligent manufacturing creates more connected assets and more operational knowledge. Factories, rail systems, grids, process plants, smart buildings, and industrial internet platforms all produce documents, signals, procedures, inspection outputs, and asset history that maintenance teams need to use safely.

This repository maps public industrial examples to knowledge-base design needs:

- Midea Building Technologies shows how equipment manufacturing, service diagnostics, energy use, and smart O&M recommendations can connect.
- SANY shows the relationship between intelligent factories, heavy equipment, field service, and telematics.
- State Grid shows how inspection data can become maintenance action.
- CRRC shows why lifecycle O&M and safety-critical procedures need traceability.
- Huawei and COSMOPlat show the infrastructure side: connected factories, industrial networks, digital twins, and scenario platforms.
- Sinopec and Baowu/Baosteel show asset-intensive process and steel environments where reliability, safety, and inspection knowledge matter.

These examples are used as context only. They do not imply that any named company uses this implementation.

![China manufacturing context](assets/china-manufacturing-to-kb-map.svg)

## 8. Evaluation model

A knowledge-base assistant should be evaluated like an operational feature, not like a writing demo.

Useful checks include:

| Check | Question |
| --- | --- |
| Retrieval coverage | Did the system find the right source documents? |
| Citation precision | Do the cited chunks support the answer? |
| Answer restraint | Does the answer avoid unsupported instructions? |
| Tenant safety | Can cross-tenant content appear? |
| Role safety | Can a technician see admin-only knowledge? |
| Freshness | Are stale documents flagged for review? |
| Latency | Does the workflow feel usable in the UI? |
| Fallback behavior | Does weak evidence produce a safe fallback instead of a confident guess? |

![Retrieval quality scorecard](assets/retrieval-quality-scorecard.svg)

## 9. Tradeoffs

The design favors trust over maximum automation.

- Reindex jobs add operational complexity, but they make slow work visible and retryable.
- Hybrid retrieval is more complex than keyword search, but maintenance questions often need both exact terms and semantic matching.
- Citations and confidence make the response stricter, but they help users decide whether to rely on the answer.
- Metadata-oriented logs limit analytics detail, but they avoid duplicating private SOP text.
- Human-owned source truth slows automatic learning, but it prevents the assistant from silently changing operational policy.

## 10. Future work

The next improvements would be:

- secure file parsing for PDF, DOCX, CSV, and HTML sources;
- chunk-level diffing so unchanged content is not re-embedded;
- durable queue support for higher-volume indexing;
- source owner and review cadence enforcement;
- low-confidence and no-result dashboards;
- golden-question evaluation runs;
- multilingual retrieval tuning;
- role-specific source visibility;
- feedback buttons for stale, incomplete, or unsafe answers;
- integration with work-order, equipment, PM, inventory, and audit pages.

## 11. Conclusion

The strongest idea in this project is not that AI can answer questions. The stronger idea is that a CMMS/EAM system can make its operational knowledge structured, searchable, cited, tenant-aware, and continuously improvable.

That is a practical foundation for safer AI-assisted maintenance software.
