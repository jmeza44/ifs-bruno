import { ArrowLeftIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { EndpointTierHelpDialog } from '@/components/workspace/endpoint/endpoint-tier-help-dialog';
import {
  ENDPOINT_TIER_LABELS,
  ENDPOINT_TIERS,
  HTTP_METHODS,
  type HttpMethod,
} from '@/lib/endpoint-search';
import { METHOD_STYLES } from '@/lib/http-method-styles';
import type { EndpointTier } from '@/lib/types';
import { cn } from '@/lib/utils';

export type EndpointListFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  activeMethods: Set<HttpMethod>;
  onActiveMethodsChange: (methods: Set<HttpMethod>) => void;
  activeTiers: Set<EndpointTier>;
  onActiveTiersChange: (tiers: Set<EndpointTier>) => void;
  onChangeProjection?: () => void;
};

export function EndpointListFilters({
  search,
  onSearchChange,
  activeMethods,
  onActiveMethodsChange,
  activeTiers,
  onActiveTiersChange,
  onChangeProjection,
}: EndpointListFiltersProps) {
  return (
    <div className="flex shrink-0 flex-col gap-1.5 border-b border-border p-1.5">
      <div className="flex items-center gap-1.5">
        {onChangeProjection && (
          <Button
            variant="outline"
            size="icon"
            onClick={onChangeProjection}
            title="Change projection"
          >
            <ArrowLeftIcon size={12} />
          </Button>
        )}
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            size={12}
            className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by path, summary or operation id..."
            className="pl-7"
          />
        </div>
      </div>
      <ToggleGroup
        type="multiple"
        spacing={1}
        value={Array.from(activeMethods)}
        onValueChange={(value) => onActiveMethodsChange(new Set(value as HttpMethod[]))}
        className="flex-wrap"
      >
        {HTTP_METHODS.map((method) => {
          const active = activeMethods.has(method);
          return (
            <ToggleGroupItem
              key={method}
              value={method}
              size="sm"
              className={cn(
                'h-auto rounded-none border px-1.5 py-0.5 font-mono text-[11px] font-semibold transition-colors',
                active
                  ? cn('border-border bg-muted', METHOD_STYLES[method])
                  : 'border-transparent text-muted-foreground/50 hover:bg-transparent hover:text-muted-foreground',
              )}
            >
              {method}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
      <div className="flex items-center gap-1.5">
        <ToggleGroup
          type="multiple"
          spacing={1}
          value={Array.from(activeTiers)}
          onValueChange={(value) => onActiveTiersChange(new Set(value as EndpointTier[]))}
          className="flex-1 flex-wrap"
        >
          {ENDPOINT_TIERS.map((tier) => {
            const active = activeTiers.has(tier);
            return (
              <ToggleGroupItem
                key={tier}
                value={tier}
                size="sm"
                className={cn(
                  'h-auto rounded-none border px-1.5 py-0.5 text-[11px] font-semibold transition-colors',
                  active
                    ? 'border-border bg-muted text-foreground'
                    : 'border-transparent text-muted-foreground/50 hover:bg-transparent hover:text-muted-foreground',
                )}
              >
                {ENDPOINT_TIER_LABELS[tier]}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
        <EndpointTierHelpDialog />
      </div>
    </div>
  );
}
