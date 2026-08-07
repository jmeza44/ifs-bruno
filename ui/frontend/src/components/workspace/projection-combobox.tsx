import { useCallback, useRef } from 'react';
import { Combobox as ComboboxNamespace } from '@base-ui/react/combobox';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Badge } from '@/components/ui/badge';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { splitByMatch } from '@/lib/projection-search';
import type { IfsProjection } from '@/lib/types';

export type ProjectionComboboxProps = {
  items: IfsProjection[];
  selected: IfsProjection | null;
  onSelect: (projection: IfsProjection | null) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  isLoading?: boolean;
};

function HighlightedProjectionName({ name, searchTerm }: { name: string; searchTerm: string }) {
  const segments = splitByMatch(name, searchTerm);
  return (
    <span className="font-mono text-xs">
      {segments.map((segment, index) =>
        segment.matched ? (
          <span key={index} className="text-amber-600 dark:text-amber-400">
            {segment.text}
          </span>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </span>
  );
}

function ProjectionItemContent({ item, searchTerm }: { item: IfsProjection; searchTerm: string }) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1.5">
        <HighlightedProjectionName name={item.ProjectionName} searchTerm={searchTerm} />
        {item.Component && (
          <Badge variant="outline" className="font-mono">
            {item.Component}
          </Badge>
        )}
        {item.Deprecated === 'TRUE' && <Badge variant="destructive">Deprecated</Badge>}
      </span>
      {item.Description && (
        <span className="text-xs text-muted-foreground text-justify">{item.Description}</span>
      )}
    </span>
  );
}

function ProjectionResultCount() {
  const filteredItems = ComboboxNamespace.useFilteredItems<IfsProjection>();
  const count = filteredItems.length;

  return (
    <span className="w-20 shrink-0 text-xs whitespace-nowrap text-muted-foreground">
      {count.toLocaleString()} {count === 1 ? 'result' : 'results'}
    </span>
  );
}

const PROJECTION_ITEM_ESTIMATED_HEIGHT = 52;

function VirtualizedProjectionList({ searchTerm }: { searchTerm: string }) {
  const filteredItems = ComboboxNamespace.useFilteredItems<IfsProjection>();
  const scrollElementRef = useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => PROJECTION_ITEM_ESTIMATED_HEIGHT,
    overscan: 10,
    paddingStart: 4,
    paddingEnd: 4,
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

  if (!filteredItems.length) {
    return null;
  }

  const totalSize = virtualizer.getTotalSize();

  return (
    <div
      ref={handleScrollElementRef}
      className="no-scrollbar max-h-72 overflow-y-auto overscroll-contain scroll-py-1"
    >
      <div className="relative w-full" style={{ height: totalSize }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = filteredItems[virtualItem.index];
          if (!item) {
            return null;
          }
          return (
            <ComboboxItem
              key={virtualItem.key}
              index={virtualItem.index}
              ref={virtualizer.measureElement}
              data-index={virtualItem.index}
              value={item}
              aria-setsize={filteredItems.length}
              aria-posinset={virtualItem.index + 1}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <ProjectionItemContent item={item} searchTerm={searchTerm} />
            </ComboboxItem>
          );
        })}
      </div>
    </div>
  );
}

export function ProjectionCombobox({
  items,
  selected,
  onSelect,
  searchTerm,
  onSearchTermChange,
  isLoading,
}: ProjectionComboboxProps) {
  return (
    <Combobox
      items={items}
      itemToStringLabel={(item: IfsProjection) => item.ProjectionName}
      virtualized
      value={selected}
      onValueChange={(value) => onSelect(value as IfsProjection | null)}
      inputValue={searchTerm}
      onInputValueChange={(value) => onSearchTermChange(value)}
    >
      <div className="flex items-center justify-center gap-2">
        <ComboboxInput
          placeholder={isLoading ? 'Loading projections...' : 'Type to search a projection...'}
          disabled={isLoading}
          className="w-md shrink-0"
        >
          <ComboboxContent side="bottom" sideOffset={2}>
            <ComboboxEmpty>No projections match the current filters</ComboboxEmpty>
            <ComboboxList className="max-h-none overflow-visible p-0">
              <VirtualizedProjectionList searchTerm={searchTerm} />
            </ComboboxList>
          </ComboboxContent>
        </ComboboxInput>
        <ProjectionResultCount />
      </div>
    </Combobox>
  );
}
