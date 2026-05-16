export function chunkText(text, options = {}) {
  const maxChars = Number.isFinite(options.maxChars) ? options.maxChars : 360;
  const overlapChars = Number.isFinite(options.overlapChars) ? options.overlapChars : 60;

  if (typeof text !== 'string') {
    throw new TypeError('text must be a string');
  }
  if (maxChars <= 0) {
    throw new RangeError('maxChars must be positive');
  }
  if (overlapChars < 0 || overlapChars >= maxChars) {
    throw new RangeError('overlapChars must be non-negative and smaller than maxChars');
  }

  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const chunks = [];
  let start = 0;
  let ordinal = 0;

  while (start < normalized.length) {
    const end = Math.min(start + maxChars, normalized.length);
    const content = normalized.slice(start, end).trim();
    if (content) {
      chunks.push({ ordinal, content, start, end, tokenEstimate: Math.ceil(content.length / 4) });
      ordinal += 1;
    }
    if (end >= normalized.length) break;
    start = end - overlapChars;
  }

  return chunks;
}
