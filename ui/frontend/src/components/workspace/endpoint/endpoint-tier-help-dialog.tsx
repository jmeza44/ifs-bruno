import { QuestionIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ENDPOINT_TIER_LABELS } from '@/lib/endpoint-search';

const TIER_EXPLANATIONS: Record<keyof typeof ENDPOINT_TIER_LABELS, string> = {
  core: 'Entities you can create, update, or delete — the main business objects of this projection.',
  'service-ops': 'Business actions and functions you invoke directly, not tied to a single entity.',
  reference: 'Read-only data specific to this projection, used to look up values for core entities.',
  lookup: 'Read-only generic catalogs (e.g. ISO country, currency, unit) — the least domain-specific data.',
};

export function EndpointTierHelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon-xs" title="What do these categories mean?">
          <QuestionIcon size={12} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Endpoint categories</DialogTitle>
          <DialogDescription>
            Endpoints are grouped by how the underlying entity is used in this projection.
          </DialogDescription>
        </DialogHeader>
        <dl className="flex flex-col gap-3">
          {(Object.keys(ENDPOINT_TIER_LABELS) as Array<keyof typeof ENDPOINT_TIER_LABELS>).map(
            (tier) => (
              <div key={tier} className="flex flex-col gap-0.5">
                <dt className="text-xs font-semibold">{ENDPOINT_TIER_LABELS[tier]}</dt>
                <dd className="text-xs text-muted-foreground">{TIER_EXPLANATIONS[tier]}</dd>
              </div>
            ),
          )}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
