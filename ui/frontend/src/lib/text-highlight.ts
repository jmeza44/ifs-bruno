export type TextSegment = { text: string; matched: boolean };

/** Splits `text` into segments around each [start, end) range in `ranges`, sorted and merged. */
export function splitByRanges(text: string, ranges: [number, number][]): TextSegment[] {
  if (ranges.length === 0) return [{ text, matched: false }];

  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const [start, end] of sorted) {
    if (start > cursor) segments.push({ text: text.slice(cursor, start), matched: false });
    segments.push({ text: text.slice(start, end), matched: true });
    cursor = end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), matched: false });
  return segments;
}

/** Splits `text` around the first case-insensitive occurrence of `searchTerm`. */
export function splitByMatch(text: string, searchTerm: string): TextSegment[] {
  const term = searchTerm.trim();
  if (!term) return [{ text, matched: false }];

  const matchIndex = text.toLowerCase().indexOf(term.toLowerCase());
  if (matchIndex === -1) return [{ text, matched: false }];

  const segments: TextSegment[] = [];
  if (matchIndex > 0) {
    segments.push({ text: text.slice(0, matchIndex), matched: false });
  }
  segments.push({ text: text.slice(matchIndex, matchIndex + term.length), matched: true });
  const afterIndex = matchIndex + term.length;
  if (afterIndex < text.length) {
    segments.push({ text: text.slice(afterIndex), matched: false });
  }
  return segments;
}
