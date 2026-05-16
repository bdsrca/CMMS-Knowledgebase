# Knowledge Governance

## Why governance belongs in the product

A CMMS/EAM knowledge base is not only a search index. It is a managed operational memory.

A good answer depends on the quality of the source document. That means the product needs basic governance controls.

## Source fields worth modeling

| Field | Why it matters |
| --- | --- |
| Source type | Distinguishes SOPs, manuals, help articles, PM rules, and inventory guidance |
| Owner | Gives stale or low-quality content a responsible person |
| Review cadence | Prevents old instructions from quietly staying active forever |
| Visibility | Keeps admin-only or safety-sensitive content scoped to the right users |
| Status | Allows draft, active, paused, archived, or restricted sources |
| Default-pack flag | Separates system-provided help from tenant-authored procedures |
| Language | Supports bilingual teams and language-aware retrieval |
| Metadata | Enables filtering by asset class, site, department, vendor, or procedure type |

## Document lifecycle

A practical lifecycle:

1. Draft
2. Approved
3. Indexed
4. Used in answers
5. Reviewed through query feedback
6. Updated or archived

## Review signals

The system can surface simple review signals:

- document is past review due date;
- repeated low-confidence answers cite this document;
- users ask questions this source does not answer;
- the source has no active documents;
- ingest job failed;
- citations point to an old version;
- document owner is missing.

## Safe learning loop

The system can learn from usage without letting the model rewrite procedures.

Recommended loop:

1. collect quality signals;
2. show them to an admin or document owner;
3. update source content through normal review;
4. reindex;
5. re-run golden questions.

This keeps the human source-of-truth boundary intact.
