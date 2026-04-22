import type { IfsProfile } from "./profile-store";
import type { SwaggerSpec } from "../types/spec.types";

export interface IfsProjection {
  ProjectionName: string;
  Name: string | null;
  Description: string | null;
  Categories: string | null;
  ApiClass: string | null;
  Layer: string | null;
  Deprecated: string | null;
}

async function fetchToken(profile: IfsProfile): Promise<string> {
  const keycloakBase = profile.keycloakBasePath ?? "/auth";
  const url = `${profile.host}${keycloakBase}/realms/${profile.realm}/protocol/openid-connect/token`;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: profile.clientId,
    client_secret: profile.clientSecret,
    scope: "openid microprofile-jwt",
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Auth failed (${res.status}): ${text}`);
  }

  const data = await res.json() as { access_token?: string };
  if (!data.access_token) throw new Error("No access_token in auth response");
  return data.access_token;
}

export async function fetchProjections(profile: IfsProfile): Promise<IfsProjection[]> {
  const token = await fetchToken(profile);
  const url = `${profile.host}/main/ifsapplications/projection/v1/AllProjections.svc/Projections?$format=json`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch projections (${res.status}): ${text}`);
  }

  const data = await res.json() as { value?: IfsProjection[] };
  return data.value ?? [];
}

export async function fetchOpenApiSpec(profile: IfsProfile, projectionName: string): Promise<SwaggerSpec> {
  const token = await fetchToken(profile);
  const url = `${profile.host}/main/ifsapplications/projection/v1/${projectionName}.svc/$openapi?V2`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch OpenAPI spec for ${projectionName} (${res.status}): ${text}`);
  }

  const spec = await res.json() as SwaggerSpec;

  if (spec.swagger !== "2.0") {
    throw new Error(`Expected Swagger 2.0 spec, got: ${String(spec.swagger ?? "unknown")}`);
  }

  return spec;
}
