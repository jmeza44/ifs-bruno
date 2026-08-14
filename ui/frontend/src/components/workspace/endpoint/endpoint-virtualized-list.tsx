import { useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ENDPOINT_ROW_GRID_COLUMNS,
  EndpointListRow,
} from '@/components/workspace/endpoint/endpoint-list-row';
import { cn } from '@/lib/utils';
import type { EndpointListEntry } from '@/lib/types';

export type EndpointVirtualizedListProps = {
  entries: EndpointListEntry[];
  searchTerm: string;
  selected: Set<string>;
  alreadyInCollection?: Set<string>;
  activeId?: string;
  onToggleSelected: (id: string) => void;
  onViewDetail: (entry: EndpointListEntry) => void;
  hasUnfilteredEntries?: boolean;
  onClearFilters?: () => void;
};

const ENDPOINT_ROW_ESTIMATED_HEIGHT = 30;

export function EndpointVirtualizedList({
  entries,
  searchTerm,
  selected,
  alreadyInCollection,
  activeId,
  onToggleSelected,
  onViewDetail,
  hasUnfilteredEntries = false,
  onClearFilters,
}: EndpointVirtualizedListProps) {
  const scrollElementRef = useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => ENDPOINT_ROW_ESTIMATED_HEIGHT,
    overscan: 15,
  });

  const handleScrollElementRef = useCallback(
    (element: HTMLDivElement | null) => {
      scrollElementRef.current = element;
      if (element) {
        virtualizer.measure();
      }
    },
    [virtualizer],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();

      const currentIndex = activeId ? entries.findIndex((entry) => entry.id === activeId) : -1;
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex =
        currentIndex === -1
          ? delta === 1
            ? 0
            : entries.length - 1
          : Math.min(Math.max(currentIndex + delta, 0), entries.length - 1);

      const nextEntry = entries[nextIndex];
      if (!nextEntry) return;

      virtualizer.scrollToIndex(nextIndex, { align: 'auto' });
      onViewDetail(nextEntry);
      return;
    }

    if (event.key === ' ' || event.key === 'Enter') {
      if (!activeId || (alreadyInCollection?.has(activeId) ?? false)) return;
      event.preventDefault();
      onToggleSelected(activeId);
    }
  };

  if (entries.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        {hasUnfilteredEntries ? (
          <>
            <span>No endpoints match your filters.</span>
            {onClearFilters && (
              <button
                type="button"
                className="text-foreground underline underline-offset-2 hover:no-underline"
                onClick={onClearFilters}
              >
                Clear filters
              </button>
            )}
          </>
        ) : (
          <span>No endpoints available yet.</span>
        )}
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
      : 0;

  return (
    <div
      ref={handleScrollElementRef}
      role="listbox"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="w-full scroll-discreet flex-1 overflow-x-hidden overflow-y-auto p-1.5 pt-1 outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
    >
      {/* Rows render in normal flow (not position:absolute) so the grid can size
          the checkbox/method columns from their real rendered content via subgrid. */}
      <div
        className={cn('grid w-full', ENDPOINT_ROW_GRID_COLUMNS)}
        style={{ paddingTop, paddingBottom }}
      >
        {virtualItems.map((virtualItem) => {
          const entry = entries[virtualItem.index];
          if (!entry) {
            return null;
          }
          return (
            <EndpointListRow
              key={entry.id}
              ref={virtualizer.measureElement}
              data-index={virtualItem.index}
              entry={entry}
              searchTerm={searchTerm}
              isSelected={selected.has(entry.id)}
              isLocked={alreadyInCollection?.has(entry.id) ?? false}
              isActive={entry.id === activeId}
              onToggleSelected={onToggleSelected}
              onViewDetail={onViewDetail}
            />
          );
        })}
      </div>
    </div>
  );
}
