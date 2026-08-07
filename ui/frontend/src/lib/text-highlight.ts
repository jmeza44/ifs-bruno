export type TextSegment = { text: string; matched: boolean };

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
