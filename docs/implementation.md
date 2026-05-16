# Implementation Notes

## Source management

A source represents a logical collection of knowledge. Examples:

- System Help
- Maintenance SOPs
- Safety Procedures
- PM Rules
- Inventory Guidance
- Equipment Manuals
- Vendor Troubleshooting Notes

Each source should have tenant scope, type, status, visibility, owner, review cadence, document count, and timestamps.

## Document intake

A document belongs to a source. A practical document model includes:

- title;
- raw text;
- language;
- external ID for repeat imports;
- checksum;
- metadata;
- visibility;
- version;
- status;
- review owner;
- review due date.

The intake flow should validate that title and text exist. It should also check that the user can write to the selected source.

## Reindex jobs

Reindex jobs decouple document writes from expensive processing.

Why it matters:

- document saves stay fast;
- embedding work can be retried;
- admins can see status;
- failed jobs do not disappear;
- future durable queues can replace the local runner without changing the document API.

## Chunking

The sample implementation uses character-based chunking for clarity. In production, chunking can become smarter:

- preserve headings;
- keep numbered SOP steps together;
- split by table rows when needed;
- treat troubleshooting trees differently from normal prose;
- tune overlap by document type.

The important rule is that chunks are derived from source documents and can be rebuilt.

## Embeddings

Embeddings should be generated in batches. Store provider, model, dimension, and created timestamp with the vector. This makes future migrations easier.

## Retrieval

Retrieval should apply filters before answer generation:

- tenant;
- role;
- source status;
- document visibility;
- language;
- page context;
- source type.

Hybrid retrieval is useful because CMMS users often mix exact labels with informal descriptions.

## Answer generation

The answer layer should return a structured object:

```json
{
  "answer": "...",
  "confidence": 0.82,
  "citations": [
    { "sourceTitle": "Inventory Issue Rules", "chunkId": "chunk_123" }
  ],
  "nextActions": [
    { "label": "Open work order parts", "route": "/work-orders/:id/parts" }
  ],
  "fallbackReason": null
}
```

If evidence is weak, return a safe fallback and show the top retrieved hits. Do not invent procedure.

## Observability

Track enough to improve the system:

- empty retrievals;
- low-confidence answers;
- frequently asked questions;
- stale citations;
- slow retrieval;
- failed ingest jobs;
- sources with no owner;
- sources past review due date.

Do not log raw retrieved SOP text unless the organization has explicitly designed and approved that privacy model.
