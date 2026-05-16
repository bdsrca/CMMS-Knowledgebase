import assert from 'node:assert/strict';
import { chunkText } from '../src/chunkText.js';
import { reciprocalRankFusion } from '../src/rankFusion.js';
import { sampleDocuments } from '../src/sampleData.js';
import { buildKnowledgeIndex, retrieveKnowledge } from '../src/retrieveKnowledge.js';
import { buildAnswerPackage } from '../src/buildAnswerPackage.js';

const chunks = chunkText('abcdef ghijkl mnopqr stuvwx yz', { maxChars: 12, overlapChars: 3 });
assert.ok(chunks.length >= 3, 'chunking should create multiple chunks');
assert.ok(chunks[1].start < chunks[0].end, 'chunks should overlap');

const fused = reciprocalRankFusion([
  [{ chunkId: 'a', score: 3, matchType: 'full_text' }, { chunkId: 'b', score: 2, matchType: 'full_text' }],
  [{ chunkId: 'b', score: 5, matchType: 'semantic' }, { chunkId: 'c', score: 1, matchType: 'semantic' }]
], { limit: 3 });
assert.equal(fused[0].chunkId, 'b', 'rank fusion should reward hits found by both branches');

const index = buildKnowledgeIndex(sampleDocuments);
const hits = retrieveKnowledge({
  query: 'Why did inventory not change after approval?',
  tenantId: 'tenant_demo',
  role: 'planner',
  chunks: index,
  topK: 5
});
assert.ok(hits.length > 0, 'retrieval should return hits');
assert.ok(hits.every(hit => hit.tenantId === 'tenant_demo'), 'retrieval should enforce tenant boundary');
assert.ok(hits.some(hit => hit.documentTitle.includes('Inventory')), 'retrieval should find inventory rules');

const noCrossTenant = retrieveKnowledge({
  query: 'private procedure',
  tenantId: 'tenant_demo',
  role: 'admin',
  chunks: index,
  topK: 5
});
assert.ok(!noCrossTenant.some(hit => hit.documentTitle.includes('Other Tenant')), 'other tenant content must not leak');

const answer = buildAnswerPackage({ query: 'Why did inventory not change after approval?', hits });
assert.ok(answer.citations.length > 0, 'answer should include citations');
assert.ok(answer.confidence > 0.4, 'answer should have useful confidence when evidence exists');

const empty = buildAnswerPackage({ query: 'unknown topic', hits: [] });
assert.equal(empty.fallbackReason, 'no_evidence', 'empty evidence should produce safe fallback');

console.log('All tests passed.');
