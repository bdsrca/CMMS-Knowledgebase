# Future Improvements

## File parsing

Add secure upload and parsing for PDF, DOCX, CSV, HTML, and vendor manual formats.

Parsing should produce normalized text plus source references that can be used in citations.

## Incremental reindex

Use document checksums and chunk hashes to avoid re-embedding unchanged text.

## Durable queue

Move ingest execution to a durable queue when volume grows. The current job model already creates a clean boundary for this.

## Evaluation dashboard

Promote golden-question runs into an admin dashboard with:

- pass rate;
- citation quality;
- no-result queries;
- low-confidence topics;
- stale documents;
- source coverage gaps.

## Content governance

Add owner, review cadence, approval status, and stale-content warnings to sources and documents.

## Role-specific knowledge views

Expand metadata filters so documents can be targeted to admins, technicians, supervisors, planners, inventory teams, contractors, or site-specific groups.

## Multilingual support

Add language-aware chunking and retrieval tuning for bilingual maintenance teams.

## Human feedback

Let users mark answers as helpful, stale, incomplete, or unsafe. Feed those signals into content review instead of allowing the AI to rewrite source content automatically.

## Deeper CMMS/EAM integration

Connect answers to safe next actions:

- open work order;
- open equipment history;
- open PM template;
- open inventory issue log;
- open source document;
- create content review task.
