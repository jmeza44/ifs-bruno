export interface ProfileSummary {
  name: string;
  host: string;
  realm: string;
  clientId: string;
}

export interface CollectionEntry {
  path: string;
  lastUsed: string;
  name: string;
  baseHost: string | null;
  endpointCount: number;
}

export interface IfsProjection {
  ProjectionName: string;
  Name: string | null;
  Description: string | null;
  Categories: string | null;
  ApiClass: string | null;
  Layer: string | null;
  Deprecated: string | null;
}

export interface EndpointEntry {
  path: string;
  method: string;
  tag: string;
  summary: string;
  operationId: string;
  displayLabel: string;
}

export interface SpecResult {
  specTitle: string;
  entries: EndpointEntry[];
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

export interface CollectionEndpoint {
  name: string;
  method: string;
  path: string | null;
}

export interface CollectionFolder {
  name: string;
  endpoints: CollectionEndpoint[];
}

export type SpecSource =
  | { kind: "remote"; profileName: string; projectionName: string }
  | { kind: "local"; specPath: string };

export interface WriteResult {
  created: number;
  updated: number;
  folder: string;
}
