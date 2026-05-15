# Future Improvements

## File Uploads and Parsing

Add secure upload support for PDF, DOCX, CSV, and HTML sources. Parsing should produce normalized text plus metadata while preserving source references for citations.

## Incremental Reindex

Use checksums to skip unchanged documents and chunk-level hashes to avoid re-embedding unchanged chunks.

## Durable Queue

Move ingest execution to a durable queue if volume grows. The current job model already creates a clean boundary for this change.

## Evaluation Dashboard

Promote golden question runs into an admin dashboard that shows pass rate, citation quality, low-confidence topics, and missing coverage.

## Content Governance

Add review cadence, owner, expiration date, and approval status to sources and documents. This would help teams avoid stale SOPs.

## Role-Specific Knowledge Views

Expand metadata filters so content can be targeted to admins, technicians, supervisors, planners, or inventory teams.

## Better Multilingual Handling

Add language-aware chunking and retrieval tuning for bilingual maintenance teams.

## Human Feedback

Let users mark answers as helpful, stale, incomplete, or unsafe. Feed that signal into content review rather than allowing the AI to change source content automatically.
