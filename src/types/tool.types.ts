/**
 * Coarse relevance grouping derived from which HTTP methods a tag's operations
 * support: `core` entities accept writes, `service-ops` are business actions,
 * `reference`/`lookup` are read-only data used to populate core entities.
 */
export type EndpointTier = 'core' | 'service-ops' | 'reference' | 'lookup';

export interface EndpointEntry {
  path: string;
  method: string;
  tag: string;
  summary: string;
  operationId: string;
  displayLabel: string;
  tier: EndpointTier;
}

export interface EndpointDetailParameter {
  name: string;
  in: string;
  required?: boolean;
  description?: string;
  type?: string;
  enum?: string[];
  example?: unknown;
  schema?: unknown;
}

export interface EndpointDetailResponse {
  status: string;
  description?: string;
  schema?: unknown;
}

export interface EndpointDetail {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  produces?: string[];
  parameters?: EndpointDetailParameter[];
  responses?: EndpointDetailResponse[];
}

export interface BuildResult {
  created: number;
  updated: number;
}
