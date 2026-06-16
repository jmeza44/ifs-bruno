import fs from 'fs';
import path from 'path';
import { initPostmanCollection, type PostmanInitOptions } from '../../../src/core/postman-writer.ts';
import { resolveCollectionsBasePath, saveCollection } from '../../../src/core/profile-store.ts';
import { err, ok, route } from '../json.ts';

interface PostmanInitBody {
  name?: string;
  host?: string;
  realm?: string;
  clientId?: string;
  workspaceId?: string;
}

export const postPostmanCollectionInit = route(async (req) => {
  const body = (await req.json()) as PostmanInitBody;
  const { name, host, realm, clientId, workspaceId } = body;

  if (!name) return err('name is required', 400);
  if (!workspaceId) return err('workspaceId is required', 400);
  if (!host) return err('host is required', 400);
  if (!realm) return err('realm is required', 400);
  if (!clientId) return err('clientId is required', 400);

  const outputPath = path.join(resolveCollectionsBasePath('postman'), name);
  if (fs.existsSync(outputPath)) return err(`Output already exists: ${outputPath}`, 409);

  const repoRoot = process.cwd();

  const options: PostmanInitOptions = {
    name,
    baseHost: host,
    realm: realm!,
    clientId: clientId!,
    workspaceId,
    repoRoot,
  };

  initPostmanCollection(outputPath, options);
  saveCollection(outputPath, 'postman');

  return ok({ path: outputPath }, 201);
});

export const postPostmanCollectionSelect = route(async (req) => {
  const body = (await req.json()) as { path?: string };
  if (!body.path) return err('path is required', 400);

  const resolvedPath = path.resolve(body.path);
  if (!fs.existsSync(path.join(resolvedPath, '.resources', 'definition.yaml'))) {
    return err(
      `Not a Postman collection — .resources/definition.yaml not found in: ${resolvedPath}`,
      404,
    );
  }

  saveCollection(resolvedPath, 'postman');
  return ok({ path: resolvedPath });
});
