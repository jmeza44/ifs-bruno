import type { Ref } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { HighlightedText } from '@/components/workspace/shared/highlighted-text';
import { MethodLabel } from '@/components/workspace/shared/method-label';
import type { EndpointListEntry } from '@/lib/types';
import { cn } from '@/lib/utils';

/** Shared by the scroll container (defines the columns) and each row (inherits via subgrid). */
export const ENDPOINT_ROW_GRID_COLUMNS = 'grid-cols-[auto_auto_1fr]';

export type EndpointListRowProps = {
  entry: EndpointListEntry;
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
  return (
    <div
      ref={ref}
      data-index={dataIndex}
      role="button"
      tabIndex={0}
      onClick={() => onViewDetail(entry)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onViewDetail(entry);
      }}
      className={cn(
        'col-span-full grid grid-cols-subgrid items-center gap-2 rounded-none px-1.5 py-1 text-xs transition-colors hover:bg-accent hover:text-accent-foreground',
        'cursor-pointer',
        isActive && 'bg-accent text-accent-foreground',
      )}
    >
      <Checkbox
        checked={isSelected || isLocked}
        disabled={isLocked}
        onClick={(e) => e.stopPropagation()}
        onCheckedChange={() => onToggleSelected(entry.id)}
        title={isLocked ? 'Already in collection' : isSelected ? 'Deselect' : 'Select'}
      />
      <MethodLabel method={entry.method} />
      <HighlightedText
        text={entry.path}
        searchTerm={searchTerm}
        className="truncate"
        title={entry.path}
      />
    </div>
  );
}
