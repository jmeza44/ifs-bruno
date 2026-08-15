import { fuzzyMatch } from '@/lib/fuzzy-search';
import type { IfsProjection } from '@/lib/types';

export function distinctSorted(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => v !== null))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export type ProjectionRanking = {
  items: IfsProjection[];
  /** Fuzzy match ranges per projection, keyed by ProjectionName (absent = no active search). */
  rangesByName: Map<string, [number, number][]>;
};

export function rankProjections(items: IfsProjection[], searchTerm: string): ProjectionRanking {
  const term = searchTerm.trim();
  const rangesByName = new Map<string, [number, number][]>();
  if (!term) return { items, rangesByName };

  const scored: { projection: IfsProjection; ranges: [number, number][]; score: number }[] = [];
  for (const projection of items) {
    const match = fuzzyMatch(term, projection.ProjectionName);
    if (match) scored.push({ projection, ranges: match.ranges, score: match.score });
  }
  scored.sort((a, b) => b.score - a.score);

  for (const { projection, ranges } of scored) {
    rangesByName.set(projection.ProjectionName, ranges);
  }
  return { items: scored.map((s) => s.projection), rangesByName };
}
