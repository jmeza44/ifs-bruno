import type { SwaggerSpec, Operation } from '../../../src/types/spec.types.ts';
import { fetchOpenApiSpec } from '../../../src/core/ifs-client.ts';
import { getProfile } from '../../../src/core/profile-store.ts';
import { loadSpec } from '../../../src/core/spec-loader.ts';
import { loadCollection, upsertRequests } from '../../../src/core/bruno-writer.ts';
import { RequestBuilder } from '../../../src/core/request-builder.ts';
import { checkAddArgs } from '../../../src/validate-args.ts';
import { err, ok, route } from '../json.ts';

type SpecSource =
  | { kind: 'remote'; profileName?: string; projectionName?: string }
  | { kind: 'local'; specPath?: string };

interface WriteBody {
  collectionPath?: string;
  source?: SpecSource;
  selected?: { path?: string; method?: string }[];
}

async function resolveSpec(source: SpecSource): Promise<SwaggerSpec | Response> {
  if (source.kind === 'remote') {
    const { profileName, projectionName } = source;
    if (!profileName || !projectionName) {
      return err(
        'source.profileName and source.projectionName are required for a remote source',
        400,
      );
    }
    const profile = getProfile(profileName);
    if (!profile) return err(`Profile not found: ${profileName}`, 404);
    return fetchOpenApiSpec(profile, projectionName);
  }

  const { specPath } = source;
  if (!specPath) return err('source.specPath is required for a local source', 400);

  const { ok: valid, errors } = checkAddArgs({ spec: specPath });
  if (!valid) return err(errors.join('; '), 400);

  return loadSpec(specPath);
}

export const postWrite = route(async (req) => {
  const body = (await req.json()) as WriteBody;
  const { collectionPath, source, selected } = body;

  if (!collectionPath) return err('collectionPath is required', 400);
  if (!source) return err('source is required', 400);
  if (!selected || selected.length === 0) return err('selected must be a non-empty array', 400);

  for (const entry of selected) {
    if (!entry.path || !entry.method) {
      return err('each selected entry requires path and method', 400);
    }
  }

  const specOrError = await resolveSpec(source);
  if (specOrError instanceof Response) return specOrError;
  const spec = specOrError;

  loadCollection(collectionPath);

  const builder = new RequestBuilder(spec);
  const builtRequests = selected.map((entry, index) => {
    const pathItem = spec.paths[entry.path!] as Record<string, Operation> | undefined;
    const operation = pathItem?.[entry.method!.toLowerCase()];
    if (!operation) {
      throw new Error(`Endpoint not found in the loaded spec: ${entry.method} ${entry.path}`);
    }
    return builder.build(entry.path!, entry.method!, operation, index + 1);
  });

  const result = upsertRequests(collectionPath, spec.info.title, builtRequests);
  return ok({ created: result.created, updated: result.updated, folder: spec.info.title });
});
