import { CanonicalRequest, WriteResult } from '@core/request/canonical-request';

export interface CollectionFolder {
  name: string;
  endpoints: CollectionEndpoint[];
}

export interface CollectionEndpoint {
  name: string;
  method: string;
  operationId?: string;
}

export interface CollectionDetails {
  name: string;
  baseHost: string;
  format: 'bruno' | 'postman';
}

export interface CollectionInitOptions {
  name: string;
  host: string;
  realm: string;
  clientId: string;
}

export interface CollectionClient<O extends CollectionInitOptions = CollectionInitOptions> {
  format: 'bruno' | 'postman';
  detect(path: string): boolean;
  init(path: string, options: O): void;
  readFolders(path: string): CollectionFolder[];
  readDetails(path: string): CollectionDetails | null;
  readName(path: string): string | null;
  readBaseHost(path: string): string | null;
  countEndpoints(path: string): number;
  write(path: string, folder: string, requests: CanonicalRequest[]): WriteResult;
}
