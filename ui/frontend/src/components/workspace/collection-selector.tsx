import { FolderIcon, GlobeIcon, PlusIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CollectionEntry } from '@/lib/types';

export type CollectionSelectorProps = {
  active: CollectionEntry | null;
  available: CollectionEntry[];
  onSelect: (collection: CollectionEntry) => void;
  onCreateNew: () => void;
};

const relativeTimeFormatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: 'auto',
});

function formatLastUsed(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);
  if (Math.abs(diffMinutes) < 60) return relativeTimeFormatter.format(diffMinutes, 'minute');

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return relativeTimeFormatter.format(diffHours, 'hour');

  const diffDays = Math.round(diffHours / 24);
  return relativeTimeFormatter.format(diffDays, 'day');
}

function formatHost(baseHost: string | null): string | null {
  if (!baseHost) return null;
  try {
    return new URL(baseHost).host;
  } catch {
    return baseHost;
  }
}

function CollectionMeta({ collection }: { collection: CollectionEntry }) {
  const host = formatHost(collection.baseHost);
  return (
    <span className="flex min-w-0 items-center gap-1.5 truncate text-xs text-muted-foreground">
      {host && (
        <span className="flex items-center gap-1 truncate">
          <GlobeIcon size={12} className="shrink-0" />
          {host}
        </span>
      )}
      {host && <span aria-hidden>·</span>}
      <span className="shrink-0">{collection.endpointCount} endpoints</span>
      <span aria-hidden>·</span>
      <span className="shrink-0">{formatLastUsed(collection.lastUsed)}</span>
    </span>
  );
}

export function CollectionSelector({
  active,
  available,
  onSelect,
  onCreateNew,
}: CollectionSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={active?.path ?? ''}
        onValueChange={(selectedPath) => {
          const collection = available.find((c) => c.path === selectedPath);
          if (collection) onSelect(collection);
        }}
      >
        <SelectTrigger className="h-auto w-72 min-w-0 py-1.5">
          <FolderIcon size={16} className="shrink-0 text-muted-foreground" />
          {active ? (
            <span className="truncate text-sm leading-none">{active.name}</span>
          ) : (
            <SelectValue placeholder="Select a collection…" />
          )}
        </SelectTrigger>
        <SelectContent side="bottom" align="start" className="min-w-80" position="popper">
          <SelectGroup>
            <SelectLabel>Collections</SelectLabel>
            {available.length === 0 && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No collections yet</div>
            )}
            {available.map((collection) => (
              <SelectItem key={collection.path} value={collection.path} className="py-2">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm leading-none">{collection.name}</span>
                  <CollectionMeta collection={collection} />
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Button variant="outline" size="icon" onClick={onCreateNew} title="Create new collection">
        <PlusIcon size={16} />
      </Button>
    </div>
  );
}
