export function reciprocalRankFusion(resultLists, options = {}) {
  const limit = Number.isFinite(options.limit) ? options.limit : 5;
  const k = Number.isFinite(options.k) ? options.k : 60;
  const byId = new Map();

  for (const list of resultLists) {
    for (let rank = 0; rank < list.length; rank += 1) {
      const hit = list[rank];
      const existing = byId.get(hit.chunkId) ?? { ...hit, fusedScore: 0, matchedBy: [] };
      existing.fusedScore += 1 / (k + rank + 1);
      if (hit.matchType && !existing.matchedBy.includes(hit.matchType)) {
        existing.matchedBy.push(hit.matchType);
      }
      existing.score = Math.max(existing.score ?? 0, hit.score ?? 0);
      byId.set(hit.chunkId, existing);
    }
  }

  return [...byId.values()]
    .sort((a, b) => b.fusedScore - a.fusedScore || b.score - a.score)
    .slice(0, limit);
}
