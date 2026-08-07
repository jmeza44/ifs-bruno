import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EndpointListFilters } from '@/components/workspace/endpoint/endpoint-list-filters';
import { EndpointVirtualizedList } from '@/components/workspace/endpoint/endpoint-virtualized-list';
import { HTTP_METHODS, sortByRelevance, type HttpMethod } from '@/lib/endpoint-search';
import type { EndpointListEntry } from '@/lib/types';

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

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matched = entries.filter((entry) => {
      if (!activeMethods.has(entry.method.toUpperCase() as HttpMethod)) return false;
      if (!term) return true;
      return (
        entry.path.toLowerCase().includes(term) ||
        (entry.summary ?? '').toLowerCase().includes(term) ||
        (entry.operationId ?? '').toLowerCase().includes(term)
      );
    });
    return sortByRelevance(matched, search);
  }, [entries, search, activeMethods]);

  return (
    <div className="flex h-full flex-col gap-1 overflow-hidden rounded-none border border-border bg-card">
      <EndpointListFilters
        search={search}
        onSearchChange={setSearch}
        activeMethods={activeMethods}
        onActiveMethodsChange={setActiveMethods}
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
