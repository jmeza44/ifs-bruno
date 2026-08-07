import type { IfsProjection } from '@/lib/types';

export function distinctSorted(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => v !== null))].sort((a, b) =>
    a.localeCompare(b),
  );
}

const RANK_EXACT = 0;
const RANK_STARTS_WITH = 1;
const RANK_CONTAINS = 2;

function rankProjectionMatch(name: string, term: string): number {
  const lowerName = name.toLowerCase();
  if (lowerName === term) return RANK_EXACT;
  if (lowerName.startsWith(term)) return RANK_STARTS_WITH;
  return RANK_CONTAINS;
}

export function sortByRelevance(items: IfsProjection[], searchTerm: string): IfsProjection[] {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return items;

  return [...items].sort((a, b) => {
    const rankDiff =
      rankProjectionMatch(a.ProjectionName, term) - rankProjectionMatch(b.ProjectionName, term);
    if (rankDiff !== 0) return rankDiff;
    return a.ProjectionName.localeCompare(b.ProjectionName);
  });
}

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
