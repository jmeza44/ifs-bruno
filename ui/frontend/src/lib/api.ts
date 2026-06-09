import type {
  CollectionEntry,
  CollectionFolder,
  EndpointDetail,
  IfsProjection,
  ProfileSummary,
  SpecResult,
  SpecSource,
  WriteResult,
} from './types';

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(body.error ?? res.statusText, res.status, body.fieldErrors);
  }

  return res.json() as Promise<T>;
}

function postJson<T>(path: string, body: unknown, query?: Record<string, string>): Promise<T> {
  const qs = query ? `?${new URLSearchParams(query).toString()}` : '';
  return request<T>(`${path}${qs}`, { method: 'POST', body: JSON.stringify(body) });
}

// Profiles

export function listProfiles(): Promise<{ profiles: ProfileSummary[] }> {
  return request('/profiles');
}

export interface ProfileInput {
  name: string;
  host: string;
  realm: string;
  clientId: string;
  clientSecret: string;
  keycloakBasePath?: string;
}

export function createProfile(input: ProfileInput, overwrite = false): Promise<{ name: string }> {
  return postJson('/profiles', input, overwrite ? { overwrite: 'true' } : undefined);
}

export function deleteProfile(name: string): Promise<{ deleted: true }> {
  return request(`/profiles/${encodeURIComponent(name)}`, { method: 'DELETE' });
}

export function testProfile(input: Omit<ProfileInput, 'name'>): Promise<{ ok: true }> {
  return postJson('/profiles/test', input);
}

// Collections

export function listCollections(): Promise<{ collections: CollectionEntry[] }> {
  return request('/collections');
}

export function selectCollection(path: string): Promise<{ path: string }> {
  return postJson('/collections/select', { path });
}

export function fetchCollectionEndpoints(
  collectionPath: string,
): Promise<{ folders: CollectionFolder[] }> {
  const qs = new URLSearchParams({ path: collectionPath }).toString();
  return request(`/collections/endpoints?${qs}`);
}

export interface CollectionDetails {
  realm: string;
  clientId: string;
  keycloakBasePath: string;
}

export function fetchCollectionDetails(collectionPath: string): Promise<CollectionDetails> {
  const qs = new URLSearchParams({ path: collectionPath }).toString();
  return request(`/collections/details?${qs}`);
}

export interface InitCollectionInput {
  name: string;
  host: string;
  realm: string;
  clientId: string;
  output?: string;
}

export function initCollection(
  input: InitCollectionInput,
  overwrite = false,
): Promise<{ path: string }> {
  return postJson('/collections/init', input, overwrite ? { overwrite: 'true' } : undefined);
}

// Projections

export function fetchProjections(profileName: string): Promise<{ projections: IfsProjection[] }> {
  return postJson('/projections', { profileName });
}

// Spec

export function fetchRemoteSpec(profileName: string, projectionName: string): Promise<SpecResult> {
  return postJson('/spec/remote', { profileName, projectionName });
}

export function fetchLocalSpec(specPath: string): Promise<SpecResult> {
  return postJson('/spec/local', { specPath });
}

export function fetchSpecEntry(path: string, method: string): Promise<EndpointDetail> {
  return postJson('/spec/entry', { path, method });
}

// Write

export interface WriteInput {
  collectionPath: string;
  source: SpecSource;
  selected: { path: string; method: string }[];
}

export function writeEndpoints(input: WriteInput): Promise<WriteResult> {
  return postJson('/write', input);
}
