import type { EndpointListEntry } from '@/lib/types';

const RANK_EXACT = 0;
const RANK_STARTS_WITH = 1;
const RANK_CONTAINS = 2;

function rankEndpointMatch(path: string, term: string): number {
  const lowerPath = path.toLowerCase();
  if (lowerPath === term) return RANK_EXACT;
  if (lowerPath.startsWith(term)) return RANK_STARTS_WITH;
  return RANK_CONTAINS;
}

export function sortByRelevance(
  entries: EndpointListEntry[],
  searchTerm: string,
): EndpointListEntry[] {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return entries;

  return [...entries].sort((a, b) => {
    const rankDiff = rankEndpointMatch(a.path, term) - rankEndpointMatch(b.path, term);
    if (rankDiff !== 0) return rankDiff;
    return a.path.localeCompare(b.path);
  });
}
