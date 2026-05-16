import { chunkText } from './chunkText.js';
import { reciprocalRankFusion } from './rankFusion.js';

const SYNONYMS = new Map([
  ['noisy', ['noise', 'sound', 'vibration', 'compressor']],
  ['inventory', ['stock', 'part', 'parts', 'issue', 'reservation']],
  ['approval', ['approve', 'approved', 'authorization']],
  ['reindex', ['index', 'embedding', 'chunks', 'job']],
  ['lockout', ['safety', 'guard', 'pinch', 'inspection']]
]);

const STOPWORDS = new Set(['a','an','the','and','or','but','when','what','why','how','do','does','did','i','we','to','from','after','before','with','without','is','are','be','should','can','could','this','that','it','not','at','on','in','of','for']);

export function tokenize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(token => token && !STOPWORDS.has(token));
}

export function buildKnowledgeIndex(documents, options = {}) {
  const maxChars = options.maxChars ?? 320;
  const overlapChars = options.overlapChars ?? 40;
  const chunks = [];

  for (const doc of documents) {
    for (const chunk of chunkText(doc.text, { maxChars, overlapChars })) {
      chunks.push({
        chunkId: `${doc.id}_${chunk.ordinal}`,
        documentId: doc.id,
        documentTitle: doc.title,
        sourceName: doc.sourceName,
        tenantId: doc.tenantId,
        roles: doc.roles,
        ordinal: chunk.ordinal,
        content: chunk.content
      });
    }
  }

  return chunks;
}

function roleCanRead(chunk, role) {
  return chunk.roles.includes(role) || chunk.roles.includes('all');
}

function fullTextScore(queryTokens, chunk) {
  const contentTokens = new Set(tokenize(chunk.content));
  let score = 0;
  for (const token of queryTokens) {
    if (contentTokens.has(token)) score += 2;
  }
  return score;
}

function semanticScore(queryTokens, chunk) {
  const content = chunk.content.toLowerCase();
  let score = 0;
  for (const token of queryTokens) {
    const related = SYNONYMS.get(token) ?? [];
    for (const word of related) {
      if (content.includes(word)) score += 1.4;
    }
  }
  return score;
}

export function retrieveKnowledge({ query, tenantId, role, chunks, topK = 5 }) {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return [];

  const visibleChunks = chunks.filter(chunk => chunk.tenantId === tenantId && roleCanRead(chunk, role));

  const fullTextHits = visibleChunks
    .map(chunk => ({ ...chunk, score: fullTextScore(queryTokens, chunk), matchType: 'full_text' }))
    .filter(hit => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  const semanticHits = visibleChunks
    .map(chunk => ({ ...chunk, score: semanticScore(queryTokens, chunk), matchType: 'semantic' }))
    .filter(hit => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return reciprocalRankFusion([fullTextHits, semanticHits], { limit: topK });
}
