import { Checkbox } from '@/components/ui/checkbox';
import { HighlightedText } from '@/components/workspace/shared/highlighted-text';
import { MethodLabel } from '@/components/workspace/shared/method-label';
import type { EndpointListEntry } from '@/lib/types';
import { cn } from '@/lib/utils';

export type EndpointListRowProps = {
  entry: EndpointListEntry;
  searchTerm: string;
  isSelected: boolean;
  isLocked: boolean;
  isActive: boolean;
  onToggleSelected: (id: string) => void;
  onViewDetail: (entry: EndpointListEntry) => void;
};

export function EndpointListRow({
  entry,
  searchTerm,
  isSelected,
  isLocked,
  isActive,
  onToggleSelected,
  onViewDetail,
}: EndpointListRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onViewDetail(entry)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onViewDetail(entry);
      }}
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-none px-1.5 py-1 text-xs transition-colors hover:bg-accent hover:text-accent-foreground',
        isActive && 'bg-accent text-accent-foreground',
      )}
    >
      <Checkbox
        checked={isSelected || isLocked}
        disabled={isLocked}
        onClick={(e) => e.stopPropagation()}
        onCheckedChange={() => onToggleSelected(entry.id)}
        className="shrink-0"
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
