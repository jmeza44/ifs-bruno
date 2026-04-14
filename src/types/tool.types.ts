export interface EndpointEntry {
  path: string;
  method: string;
  tag: string;
  summary: string;
  operationId: string;
  displayLabel: string;
}

export interface BuildResult {
  created: number;
  updated: number;
}
