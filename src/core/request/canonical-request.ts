export interface CanonicalHeader {
  name: string;
  value: string;
  enabled: boolean;
}

export interface CanonicalParam {
  name: string;
  value: string;
  enabled: boolean;
}

export type CanonicalBodyType = 'json' | 'form-urlencoded';

export interface CanonicalBody {
  type: CanonicalBodyType;
  content: unknown;
}

export interface CanonicalRequest {
  name: string;
  operationId: string;
  method: string;
  url: string;
  /** Path parameter names extracted from the path template (e.g. {CustomerId} → 'CustomerId').
   * Bruno mapper uses these to generate runtime.variables and ETag pre-request script.
   * Postman ignores this field. */
  pathParams: string[];
  headers: CanonicalHeader[];
  queryParams: CanonicalParam[];
  body?: CanonicalBody;
  description?: string;
  order: number;
}

export interface WriteResult {
  created: number;
  updated: number;
}
