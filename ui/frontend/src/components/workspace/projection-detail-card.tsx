import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { IfsProjection } from '@/lib/types';

export type ProjectionDetailCardProps = {
  selected: IfsProjection | null;
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

export function ProjectionDetailCard({
  selected,
  onContinue,
  isContinuing,
}: ProjectionDetailCardProps) {
  if (!selected) {
    return (
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
    );
  }

  return (
    <div className="@container flex flex-col gap-3 rounded-none border border-border bg-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm mb-2">
        <span className="font-mono font-semibold text-foreground">{selected.ProjectionName}</span>
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
  );
}
