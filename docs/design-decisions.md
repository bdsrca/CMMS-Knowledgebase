# Design Decisions

## 1. Treat knowledge as managed content, not prompt context

A maintenance knowledge base should have sources, documents, owners, versions, review status, and audit trails.

Prompt-only content is hard to govern. Managed content can be reviewed, searched, cited, and reindexed.

## 2. Reindex asynchronously

Embedding and chunking can be slow. Running this work inline makes the UI feel unreliable. A visible job model gives users status and gives engineers a clean retry boundary.

## 3. Use both keyword and semantic retrieval

Full-text search is good for exact terms such as `waiting parts`, `PM`, `WO`, `approval`, and asset names.

Semantic retrieval is good when users ask the same thing in different words.

The two branches cover different failure modes, so rank fusion is a practical middle ground.

## 4. Require citations

Citations are the difference between a helpful CMMS assistant and a risky black box.

The user should be able to inspect the source document before acting on the answer.

## 5. Keep logs useful but narrow

Logs should support improvement without duplicating sensitive content.

Store query metadata, hit IDs, citation IDs, latency, filters, and confidence. Avoid raw retrieved SOP text.

## 6. Keep operational writes guarded

A knowledge-base answer can suggest the next page or action. It should not silently update work orders, reserve parts, change PM templates, or rewrite policy.

Human review stays important, especially for safety-sensitive and compliance-sensitive work.

## 7. Make review cadence visible

A stale SOP can be worse than no SOP. Sources and documents should have owner and review cadence fields so admins can maintain quality over time.
