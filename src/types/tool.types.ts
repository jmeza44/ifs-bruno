export interface EndpointEntry {
  path: string;
  method: string;
  tag: string;
  summary: string;
  operationId: string;
  displayLabel: string;
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
