import { buildEndpointList, buildEndpointDetail } from '@core/endpoint-list.ts';
import { fetchOpenApiSpec } from '@core/ifs-client.ts';
import { getProfile } from '@core/profile-store.ts';
import { loadSpec } from '@core/spec-loader.ts';
import { SwaggerSpec } from '@types-app/spec.types.ts';
import { checkAddArgs } from '../../../src/validate-args.ts';
import { err, ok, route } from '../json.ts';

interface RemoteSpecBody {
  profileName?: string;
  projectionName?: string;
}

interface LocalSpecBody {
  specPath?: string;
}

interface SpecEntryBody {
  path?: string;
  method?: string;
}

// Single-slot cache for the most recently resolved spec — entry-detail lookups
// (POST /spec/entry) need the full SwaggerSpec to resolve $refs, but it's too large
// to embed in every entry of the flattened list returned by /spec/remote and /spec/local.
let lastResolvedSpec: SwaggerSpec | null = null;

export const postSpecRemote = route(async (req) => {
  const body = (await req.json()) as RemoteSpecBody;
  const { profileName, projectionName } = body;

  if (!profileName || !projectionName) {
    return err('profileName and projectionName are required', 400);
  }

  const profile = getProfile(profileName);
  if (!profile) {
    return err(`Profile not found: ${profileName}`, 404);
  }

  const spec = await fetchOpenApiSpec(profile, projectionName);
  lastResolvedSpec = spec;
  const entries = buildEndpointList(spec);
  return ok({ specTitle: spec.info.title, entries });
});

export const postSpecLocal = route(async (req) => {
  const body = (await req.json()) as LocalSpecBody;
  const { specPath } = body;

  if (!specPath) {
    return err('specPath is required', 400);
  }

  const { ok: valid, errors } = checkAddArgs({ spec: specPath });
  if (!valid) {
    return err(errors.join('; '), 400);
  }

  const spec = loadSpec(specPath);
  lastResolvedSpec = spec;
  const entries = buildEndpointList(spec);
  return ok({ specTitle: spec.info.title, entries });
});

export const postSpecEntry = route(async (req) => {
  const body = (await req.json()) as SpecEntryBody;
  const { path: pathTemplate, method } = body;

  if (!pathTemplate || !method) {
    return err('path and method are required', 400);
  }

  if (!lastResolvedSpec) {
    return err('No spec loaded — fetch a spec via /spec/remote or /spec/local first', 409);
  }

  const detail = buildEndpointDetail(lastResolvedSpec, pathTemplate, method);
  if (!detail) {
    return err(`Endpoint not found in the loaded spec: ${method} ${pathTemplate}`, 404);
  }

  return ok(detail);
});
