import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EndpointListFilters } from '@/components/workspace/endpoint/endpoint-list-filters';
import { EndpointVirtualizedList } from '@/components/workspace/endpoint/endpoint-virtualized-list';
import { ENDPOINT_TIERS, HTTP_METHODS, sortByTier, type HttpMethod } from '@/lib/endpoint-search';
import { fuzzyMatch } from '@/lib/fuzzy-search';
import type { EndpointListEntry, EndpointTier } from '@/lib/types';

export type ScoredEndpointEntry = EndpointListEntry & { matchRanges?: [number, number][] };

export type { EndpointListEntry };

export type EndpointListPanelProps = {
  entries: EndpointListEntry[];
  selected: Set<string>;
  alreadyInCollection?: Set<string>;
  activeId?: string;
  onToggleSelected: (id: string) => void;
  onViewDetail: (entry: EndpointListEntry) => void;
  onChangeProjection?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
};

export function EndpointListPanel({
  entries,
  selected,
  alreadyInCollection,
  activeId,
  onToggleSelected,
  onViewDetail,
  onChangeProjection,
  onSave,
  isSaving,
}: EndpointListPanelProps) {
  const [search, setSearch] = useState('');
  const [activeMethods, setActiveMethods] = useState<Set<HttpMethod>>(new Set(HTTP_METHODS));
  const [activeTiers, setActiveTiers] = useState<Set<EndpointTier>>(new Set(ENDPOINT_TIERS));

  const filtered = useMemo(() => {
    const term = search.trim();
    const byFilters = entries.filter((entry) => {
      if (!activeMethods.has(entry.method.toUpperCase() as HttpMethod)) return false;
      if (!activeTiers.has(entry.tier)) return false;
      return true;
    });

    if (!term) return sortByTier(byFilters) as ScoredEndpointEntry[];

    const termLower = term.toLowerCase();
    const fuzzyMatched: { entry: ScoredEndpointEntry; score: number }[] = [];
    const fallbackMatched: ScoredEndpointEntry[] = [];

    for (const entry of byFilters) {
      const match = fuzzyMatch(term, entry.path);
      if (match) {
        fuzzyMatched.push({ entry: { ...entry, matchRanges: match.ranges }, score: match.score });
        continue;
      }
      if (
        (entry.summary ?? '').toLowerCase().includes(termLower) ||
        (entry.operationId ?? '').toLowerCase().includes(termLower)
      ) {
        fallbackMatched.push(entry);
      }
    }

    fuzzyMatched.sort((a, b) => b.score - a.score);
    fallbackMatched.sort((a, b) => a.path.localeCompare(b.path));

    return [...fuzzyMatched.map((m) => m.entry), ...fallbackMatched];
  }, [entries, search, activeMethods, activeTiers]);

  function handleClearFilters() {
    setSearch('');
    setActiveMethods(new Set(HTTP_METHODS));
    setActiveTiers(new Set(ENDPOINT_TIERS));
  }

  return (
    <div className="flex h-full flex-col gap-1 overflow-y-hidden rounded-none border border-border bg-card">
      <EndpointListFilters
        search={search}
        onSearchChange={setSearch}
        activeMethods={activeMethods}
        onActiveMethodsChange={setActiveMethods}
        activeTiers={activeTiers}
        onActiveTiersChange={setActiveTiers}
        onChangeProjection={onChangeProjection}
      />

      <EndpointVirtualizedList
        entries={filtered}
        searchTerm={search}
        selected={selected}
        alreadyInCollection={alreadyInCollection}
        activeId={activeId}
        onToggleSelected={onToggleSelected}
        onViewDetail={onViewDetail}
        hasUnfilteredEntries={entries.length > 0}
        onClearFilters={handleClearFilters}
      />

      {/* footer: counters + save action */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-1.5 py-1 text-xs text-muted-foreground">
        <span>
          {filtered.length}/{entries.length} shown
        </span>
        {onSave && (
          <Button size="xs" disabled={selected.size === 0 || isSaving} onClick={onSave}>
            {isSaving
              ? 'Saving...'
              : `Save ${selected.size > 0 ? `(${selected.size})` : ''}`.trim()}
          </Button>
        )}
        <span>{selected.size} selected</span>
      </div>
    </div>
  );
}
