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

export function ProjectionSearchPanel({
  profileName,
  projections,
  isLoading,
  selected,
  onSelect,
  onContinue,
  isContinuing,
}: ProjectionSearchPanelProps) {
  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <div className="flex flex-col items-center gap-1 text-center">
          <MagnifyingGlassIcon className="size-5 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Search IFS projection</span>
          <span className="text-xs text-muted-foreground">
            Active profile: <span className="font-medium text-foreground">{profileName}</span>
          </span>
        </div>

        <Combobox
          items={projections}
          itemToStringLabel={(item: IfsProjection) => item.ProjectionName}
          limit={10}
          value={selected}
          onValueChange={(value) => onSelect(value as IfsProjection | null)}
        >
          <div className="flex justify-center">
            <ComboboxInput
              placeholder={isLoading ? 'Loading projections...' : 'Type to search a projection...'}
              disabled={isLoading}
              className="w-full max-w-md"
            >
              <ComboboxContent>
                <ComboboxEmpty>No projections found</ComboboxEmpty>
                <ComboboxList>
                  {(item: IfsProjection) => (
                    <ComboboxItem key={item.ProjectionName} value={item}>
                      <span className="flex flex-col gap-0.5">
                        <span className="font-mono text-xs">{item.ProjectionName}</span>
                        {item.Description && (
                          <span className="text-xs text-muted-foreground">{item.Description}</span>
                        )}
                      </span>
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </ComboboxInput>
          </div>
        </Combobox>

        {selected ? (
          <div className="@container flex flex-col gap-3 rounded-none border border-border bg-card p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold text-foreground">
                {selected.ProjectionName}
              </span>
              {selected.Deprecated === 'true' && <Badge variant="destructive">Deprecated</Badge>}
            </div>

            <Section title="Description">
              <FieldValue value={selected.Description} />
            </Section>

            <div className="flex flex-wrap gap-4">
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
          <div className={cn('rounded-none border border-border bg-card p-3')}>
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
