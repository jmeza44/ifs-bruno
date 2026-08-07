import { useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { EndpointListRow } from '@/components/workspace/endpoint/endpoint-list-row';
import type { EndpointListEntry } from '@/lib/types';

export type EndpointVirtualizedListProps = {
  entries: EndpointListEntry[];
  searchTerm: string;
  selected: Set<string>;
  alreadyInCollection?: Set<string>;
  activeId?: string;
  onToggleSelected: (id: string) => void;
  onViewDetail: (entry: EndpointListEntry) => void;
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

  if (entries.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
        No endpoints match.
      </div>
    );
  }

  return (
    <div ref={handleScrollElementRef} className="scroll-discreet flex-1 overflow-y-auto p-1.5 pt-1">
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const entry = entries[virtualItem.index];
          if (!entry) {
            return null;
          }
          return (
            <div
              key={entry.id}
              ref={virtualizer.measureElement}
              data-index={virtualItem.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <EndpointListRow
                entry={entry}
                searchTerm={searchTerm}
                isSelected={selected.has(entry.id)}
                isLocked={alreadyInCollection?.has(entry.id) ?? false}
                isActive={entry.id === activeId}
                onToggleSelected={onToggleSelected}
                onViewDetail={onViewDetail}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
