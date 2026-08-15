import type { EndpointListEntry, EndpointTier } from '@/lib/types';

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export const ENDPOINT_TIERS = ['core', 'service-ops', 'reference', 'lookup'] as const satisfies readonly EndpointTier[];

export const ENDPOINT_TIER_LABELS: Record<EndpointTier, string> = {
  core: 'Core',
  'service-ops': 'Actions',
  reference: 'Reference',
  lookup: 'Lookup',
};

const TIER_ORDER: Record<EndpointTier, number> = Object.fromEntries(
  ENDPOINT_TIERS.map((tier, index) => [tier, index]),
) as Record<EndpointTier, number>;

/** No active search: group by tier (Core first, Lookup last), alphabetical within each. */
export function sortByTier(entries: EndpointListEntry[]): EndpointListEntry[] {
  return [...entries].sort((a, b) => {
    const tierDiff = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
    if (tierDiff !== 0) return tierDiff;
    return a.path.localeCompare(b.path);
  });
}
