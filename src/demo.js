import { sampleDocuments } from './sampleData.js';
import { buildKnowledgeIndex, retrieveKnowledge } from './retrieveKnowledge.js';
import { buildAnswerPackage } from './buildAnswerPackage.js';

const chunks = buildKnowledgeIndex(sampleDocuments);
const query = process.argv.slice(2).join(' ') || 'Why did inventory not change after approval?';

const hits = retrieveKnowledge({
  query,
  tenantId: 'tenant_demo',
  role: 'planner',
  chunks,
  topK: 5
});

const answerPackage = buildAnswerPackage({ query, hits });

console.log(JSON.stringify({ query, answerPackage }, null, 2));
