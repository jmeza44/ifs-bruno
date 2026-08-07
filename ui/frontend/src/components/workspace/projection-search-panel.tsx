import { useCallback, useMemo, useRef, useState } from 'react';
import { Combobox as ComboboxNamespace } from '@base-ui/react/combobox';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import type { IfsProjection } from '@/lib/types';

export type ProjectionSearchPanelProps = {
  profileName: string;
  projections: IfsProjection[];
  isLoading?: boolean;
  selected: IfsProjection | null;
  onSelect: (projection: IfsProjection | null) => void;
  onContinue?: (projection: IfsProjection) => void;
  isContinuing?: boolean;
};

const ALL_VALUES = '__all__';

function distinctSorted(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => v !== null))].sort((a, b) =>
    a.localeCompare(b),
  );
}

const USAGE_TIPS = [
  'Search by projection name (e.g. "PurchaseOrder") or by words from its description.',
  'The Layer field indicates whether the projection belongs to a base, custom, or extension layer.',
  'Projections marked as Deprecated may stop being available in future IFS versions.',
  'ApiClass groups related projections — useful for finding variants of the same resource.',
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-semibold tracking-wide text-muted-foreground/80 uppercase">
        {title}
      </span>
      {children}
    </div>
  );
}

function FieldValue({ value }: { value: string | null }) {
  if (!value) {
    return <span className="text-xs text-muted-foreground/60 italic">—</span>;
  }
  return <span className="text-xs text-foreground">{value}</span>;
}

function ProjectionItemContent({ item }: { item: IfsProjection }) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1.5">
        <span className="font-mono text-xs">{item.ProjectionName}</span>
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

const PROJECTION_ITEM_ESTIMATED_HEIGHT = 52;

function VirtualizedProjectionList() {
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
              <ProjectionItemContent item={item} />
            </ComboboxItem>
          );
        })}
      </div>
    </div>
  );
}

export function ProjectionSearchPanel({
  profileName,
  projections,
  isLoading,
  selected,
  onSelect,
  onContinue,
  isContinuing,
}: ProjectionSearchPanelProps) {
  const [component, setComponent] = useState<string | null>(null);
  const [apiClass, setApiClass] = useState(ALL_VALUES);
  const [layer, setLayer] = useState(ALL_VALUES);
  const [showDeprecated, setShowDeprecated] = useState(false);

  const components = useMemo(
    () => distinctSorted(projections.map((p) => p.Component)),
    [projections],
  );
  const apiClasses = useMemo(
    () => distinctSorted(projections.map((p) => p.ApiClass)),
    [projections],
  );
  const layers = useMemo(() => distinctSorted(projections.map((p) => p.Layer)), [projections]);

  const filteredProjections = useMemo(
    () =>
      projections.filter((p) => {
        if (component !== null && p.Component !== component) return false;
        if (apiClass !== ALL_VALUES && p.ApiClass !== apiClass) return false;
        if (layer !== ALL_VALUES && p.Layer !== layer) return false;
        if (!showDeprecated && p.Deprecated === 'TRUE') return false;
        return true;
      }),
    [projections, component, apiClass, layer, showDeprecated],
  );

  return (
    <div className="flex h-full w-full items-start justify-center p-4">
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <div className="flex flex-col items-center gap-1 text-center">
          <MagnifyingGlassIcon className="size-5 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Search IFS projection</span>
          <span className="text-xs text-muted-foreground">
            Active profile: <span className="font-medium text-foreground">{profileName}</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Combobox
            items={components}
            itemToStringLabel={(item: string) => item}
            value={component}
            onValueChange={(value) => setComponent(value as string | null)}
          >
            <ComboboxInput placeholder="Component" showClear className="h-7 w-32">
              <ComboboxContent side="bottom" align="start">
                <ComboboxEmpty>No components found</ComboboxEmpty>
                <ComboboxList>
                  {(item: string) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </ComboboxInput>
          </Combobox>

          <Select value={apiClass} onValueChange={setApiClass}>
            <SelectTrigger size="sm">
              <SelectValue placeholder="ApiClass" />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" align="start">
              <SelectItem value={ALL_VALUES}>All API classes</SelectItem>
              {apiClasses.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={layer} onValueChange={setLayer}>
            <SelectTrigger size="sm">
              <SelectValue placeholder="Layer" />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" align="start">
              <SelectItem value={ALL_VALUES}>All layers</SelectItem>
              {layers.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Toggle
            size="sm"
            variant="outline"
            className="data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            pressed={showDeprecated}
            onPressedChange={setShowDeprecated}
            aria-label="Show deprecated projections"
          >
            Show deprecated
          </Toggle>
        </div>

        <Combobox
          items={filteredProjections}
          itemToStringLabel={(item: IfsProjection) => item.ProjectionName}
          virtualized
          value={selected}
          onValueChange={(value) => onSelect(value as IfsProjection | null)}
        >
          <div className="flex justify-center">
            <ComboboxInput
              placeholder={isLoading ? 'Loading projections...' : 'Type to search a projection...'}
              disabled={isLoading}
              className="w-full max-w-md"
            >
              <ComboboxContent side="bottom" sideOffset={2}>
                <ComboboxEmpty>No projections match the current filters</ComboboxEmpty>
                <ComboboxList className="max-h-none overflow-visible p-0">
                  <VirtualizedProjectionList />
                </ComboboxList>
              </ComboboxContent>
            </ComboboxInput>
          </div>
        </Combobox>

        {selected ? (
          <div className="@container flex flex-col gap-3 rounded-none border border-border bg-card p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm mb-2">
              <span className="font-mono font-semibold text-foreground">
                {selected.ProjectionName}
              </span>
              {selected.Deprecated === 'TRUE' && <Badge variant="destructive">Deprecated</Badge>}
            </div>

            <Section title="Description">
              <FieldValue value={selected.Description} />
            </Section>

            <div className="flex flex-wrap justify-between gap-4">
              <Section title="Component">
                <FieldValue value={selected.Component} />
              </Section>
              <Section title="Categories">
                <FieldValue value={selected.Categories} />
              </Section>
              <Section title="ApiClass">
                <FieldValue value={selected.ApiClass} />
              </Section>
              <Section title="Layer">
                <FieldValue value={selected.Layer} />
              </Section>
            </div>

            {onContinue && (
              <div className="flex justify-end">
                <Button size="sm" disabled={isContinuing} onClick={() => onContinue(selected)}>
                  {isContinuing ? 'Loading endpoints...' : 'Continue'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className={cn('rounded-none border border-border bg-card p-3 text-center')}>
            <Section title="Usage tips">
              <ul className="flex flex-col gap-1.5">
                {USAGE_TIPS.map((tip) => (
                  <li key={tip} className="text-xs text-muted-foreground">
                    {tip}
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}
