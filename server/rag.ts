import { DocumentChunk, DocumentItem } from '../shared/types.ts';

export function createOverlappingChunks(
  documentId: string,
  text: string,
  chunkSize = 450,
  overlap = 75
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  if (!text || text.trim().length === 0) return chunks;

  const clean = text.replace(/\r\n/g, '\n');
  let start = 0;
  let index = 0;

  while (start < clean.length) {
    let end = start + chunkSize;

    // Try to break at a natural sentence or newline boundary if possible
    if (end < clean.length) {
      const boundaryIndex = clean.lastIndexOf('\n', end);
      const periodIndex = clean.lastIndexOf('. ', end);
      const chosenBoundary = Math.max(boundaryIndex, periodIndex);

      if (chosenBoundary > start + chunkSize / 2) {
        end = chosenBoundary + 1;
      }
    } else {
      end = clean.length;
    }

    const chunkContent = clean.substring(start, end).trim();
    if (chunkContent.length > 0) {
      chunks.push({
        id: `chk_${documentId}_${index}`,
        documentId,
        chunkIndex: index,
        content: chunkContent,
        charStart: start,
        charEnd: end,
      });
      index++;
    }

    if (end >= clean.length) break;
    start = Math.max(start + 1, end - overlap);
  }

  return chunks;
}

export function searchDocumentChunks(
  chunks: DocumentChunk[],
  query: string,
  topK = 3
): DocumentChunk[] {
  if (!query || chunks.length === 0) return [];

  const queryTerms = query
    .toLowerCase()
    .replace(/[^\w\s\u00C0-\u017F]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 2);

  if (queryTerms.length === 0) {
    return chunks.slice(0, topK);
  }

  const scoredChunks = chunks.map(chunk => {
    const contentLower = chunk.content.toLowerCase();
    let score = 0;

    for (const term of queryTerms) {
      // Frequency match
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = contentLower.match(regex);
      if (matches) {
        score += matches.length * 3;
      } else if (contentLower.includes(term)) {
        score += 1;
      }
    }

    return {
      ...chunk,
      score,
    };
  });

  scoredChunks.sort((a, b) => (b.score || 0) - (a.score || 0));
  return scoredChunks.filter(c => (c.score || 0) > 0).slice(0, topK);
}
