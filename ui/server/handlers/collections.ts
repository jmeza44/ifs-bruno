import fs from 'fs';
import path from 'path';
import { initCollection, type InitOptions } from '../../../src/core/bruno-writer.ts';
import { resolveAdapter } from '../../../src/core/collection-adapters/index.ts';
import { listCollections, resolveCollectionsBasePath, saveCollection } from '../../../src/core/profile-store.ts';
import { checkInitArgs } from '../../../src/validate-args.ts';
import { err, fieldErr, ok, route } from '../json.ts';

export const getCollections = route(() => {
  return ok({ collections: listCollections() });
});

export const getCollectionEndpoints = route((req) => {
  const url = new URL(req.url);
  const collectionPath = url.searchParams.get('path');
  if (!collectionPath) return err('path query parameter is required', 400);

  const resolvedPath = path.resolve(collectionPath);
  if (!fs.existsSync(resolvedPath)) return err(`Collection not found: ${resolvedPath}`, 404);

  const adapter = resolveAdapter(resolvedPath);
  if (!adapter) return err(`Not a recognized collection: ${resolvedPath}`, 404);

  return ok({ folders: adapter.readFolders(resolvedPath) });
});

export const getCollectionDetails = route((req) => {
  const url = new URL(req.url);
  const collectionPath = url.searchParams.get('path');
  if (!collectionPath) return err('path query parameter is required', 400);

  const resolvedPath = path.resolve(collectionPath);
  if (!fs.existsSync(resolvedPath)) return err(`Collection not found: ${resolvedPath}`, 404);

  const adapter = resolveAdapter(resolvedPath);
  if (!adapter) return err(`Not a recognized collection: ${resolvedPath}`, 404);

  const details = adapter.readDetails(resolvedPath);
  if (!details) return err(`Collection details not found: ${resolvedPath}`, 404);

  return ok(details);
});

export const postCollectionSelect = route(async (req) => {
  const body = (await req.json()) as { path?: string };
  if (!body.path) return err('path is required', 400);

  const resolvedPath = path.resolve(body.path);
  if (!fs.existsSync(resolvedPath)) return err(`Collection not found: ${resolvedPath}`, 404);

  const adapter = resolveAdapter(resolvedPath);
  if (!adapter) return err(`Not a recognized collection: ${resolvedPath}`, 404);

  saveCollection(resolvedPath, adapter.format);
  return ok({ path: resolvedPath });
});

interface InitBody {
  name?: string;
  host?: string;
  realm?: string;
  clientId?: string;
}

export const postCollectionInit = route(async (req) => {
  const body = (await req.json()) as InitBody;
  const { name, host, realm, clientId } = body;

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = 'Required';
  if (!host) fieldErrors.host = 'Required';
  else if (!checkInitArgs({ host }).ok)
    fieldErrors.host = 'Must be a valid URL, e.g. https://acme.ifs.cloud';
  if (!realm) fieldErrors.realm = 'Required';
  if (!clientId) fieldErrors.clientId = 'Required';

  if (Object.keys(fieldErrors).length > 0) {
    return fieldErr(fieldErrors);
  }

  const outputPath = path.join(resolveCollectionsBasePath('bruno'), name!);
  if (fs.existsSync(outputPath)) {
    return err(`Output already exists: ${outputPath}`, 409);
  }

  const options: InitOptions = { host: host!.replace(/\/$/, ''), realm: realm!, clientId: clientId!, name: name! };
  initCollection(outputPath, options);
  saveCollection(outputPath, 'bruno');

  return ok({ path: outputPath }, 201);
});
