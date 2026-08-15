import type { Ref } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { HighlightedText } from '@/components/workspace/shared/highlighted-text';
import { MethodLabel } from '@/components/workspace/shared/method-label';
import { basePathSegment, countPathKeys, shouldCollapsePathKeys } from '@/lib/endpoint-path';
import { cn } from '@/lib/utils';
import type { ScoredEndpointEntry } from '@/components/workspace/endpoint/endpoint-list-panel';
import type { EndpointListEntry } from '@/lib/types';

/** Shared by the scroll container (defines the columns) and each row (inherits via subgrid). */
export const ENDPOINT_ROW_GRID_COLUMNS = 'grid-cols-[auto_auto_1fr]';

export type EndpointListRowProps = {
  entry: ScoredEndpointEntry;
  searchTerm: string;
  isSelected: boolean;
  isLocked: boolean;
  isActive: boolean;
  onToggleSelected: (id: string) => void;
  onViewDetail: (entry: EndpointListEntry) => void;
  ref?: Ref<HTMLDivElement>;
  'data-index'?: number;
};

export function EndpointListRow({
  entry,
  searchTerm,
  isSelected,
  isLocked,
  isActive,
  onToggleSelected,
  onViewDetail,
  ref,
  'data-index': dataIndex,
}: EndpointListRowProps) {
  const collapseKeys = shouldCollapsePathKeys(entry.path);

  return (
    <div
      ref={ref}
      data-index={dataIndex}
      role="option"
      aria-selected={isActive}
      onClick={() => onViewDetail(entry)}
      className={cn(
        'col-span-full grid grid-cols-subgrid items-start gap-2 rounded-none px-1.5 py-1 text-xs transition-colors hover:bg-accent hover:text-accent-foreground',
        'cursor-pointer',
        isActive && 'bg-accent text-accent-foreground',
      )}
    >
      <Checkbox
        checked={isSelected || isLocked}
        disabled={isLocked}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onCheckedChange={() => onToggleSelected(entry.id)}
        title={isLocked ? 'Already in collection' : isSelected ? 'Deselect' : 'Select'}
      />
      <MethodLabel method={entry.method} />
      {collapseKeys ? (
        <span className="flex min-w-0 items-baseline gap-1.5" title={entry.path}>
          <span className="truncate font-mono text-xs">{basePathSegment(entry.path)}</span>
          <span className="shrink-0 rounded-none border border-border px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
            {countPathKeys(entry.path)} keys
          </span>
        </span>
      ) : (
        <HighlightedText
          text={entry.path}
          searchTerm={searchTerm}
          ranges={entry.matchRanges}
          title={entry.path}
          className="min-w-0 break-all"
        />
      )}
    </div>
  );
}
