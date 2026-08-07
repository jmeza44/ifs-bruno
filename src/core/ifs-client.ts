import type { SwaggerSpec } from '@types-app/spec.types';
import type { IfsProfile } from './profile-store';
import { KeycloakTokenFetcher, cachedTokenProvider } from './token-provider';

export interface IfsProjection {
  ProjectionName: string;
  Name: string | null;
  Description: string | null;
  Categories: string | null;
  ApiClass: string | null;
  Layer: string | null;
  Deprecated: string | null;
}

const uncachedTokenFetcher = new KeycloakTokenFetcher();

/** Always hits Keycloak — use to validate credentials (e.g. a "test connection" action). */
export async function fetchToken(profile: IfsProfile): Promise<string> {
  return uncachedTokenFetcher.getToken(profile);
}

export async function fetchProjections(profile: IfsProfile): Promise<IfsProjection[]> {
  const token = await cachedTokenProvider.getToken(profile);
  const params = new URLSearchParams({
    $format: 'json',
    $select: 'ProjectionName,Name,Description,Categories,ApiClass,Layer,Deprecated',
    $orderby: 'ProjectionName',
  });
  const url = `${profile.host}/main/ifsapplications/projection/v1/AllProjections.svc/Projections?${params}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch projections (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { value?: IfsProjection[] };
  return data.value ?? [];
}

export async function fetchOpenApiSpec(
  profile: IfsProfile,
  projectionName: string,
): Promise<SwaggerSpec> {
  const token = await cachedTokenProvider.getToken(profile);
  const url = `${profile.host}/main/ifsapplications/projection/v1/${projectionName}.svc/$openapi?V2`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch OpenAPI spec for ${projectionName} (${res.status}): ${text}`);
  }

  const spec = (await res.json()) as SwaggerSpec;

  if (spec.swagger !== '2.0') {
    throw new Error(`Expected Swagger 2.0 spec, got: ${String(spec.swagger ?? 'unknown')}`);
  }

  return spec;
}
