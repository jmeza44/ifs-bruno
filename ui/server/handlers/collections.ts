import fs from 'fs';
import path from 'path';
import { brunoClient } from '@clients/bruno/bruno-client';
import { BrunoInitOptions } from '@clients/bruno/bruno-init';
import { postmanClient } from '@clients/postman/postman-client';
import { PostmanInitOptions } from '@clients/postman/postman-init';
import { resolveClient } from '@core/collection/collection-registry';
import { listCollections, saveCollection, resolveCollectionsBasePath } from '@core/profile-store';
import { checkInitArgs } from '../../../src/validate-args';
import { err, fieldErr, route, ok } from '../json';

export const getCollections = route(() => {
  return ok({ collections: listCollections() });
});

export const getCollectionEndpoints = route((req) => {
  const url = new URL(req.url);
  const collectionPath = url.searchParams.get('path');
  if (!collectionPath) return err('path query parameter is required', 400);

  const resolvedPath = path.resolve(collectionPath);
  if (!fs.existsSync(resolvedPath)) return err(`Collection not found: ${resolvedPath}`, 404);

  const client = resolveClient(resolvedPath);
  if (!client) return err(`Not a recognized collection: ${resolvedPath}`, 404);

  return ok({ folders: client.readFolders(resolvedPath) });
});

export const getCollectionDetails = route((req) => {
  const url = new URL(req.url);
  const collectionPath = url.searchParams.get('path');
  if (!collectionPath) return err('path query parameter is required', 400);

  const resolvedPath = path.resolve(collectionPath);
  if (!fs.existsSync(resolvedPath)) return err(`Collection not found: ${resolvedPath}`, 404);

  const client = resolveClient(resolvedPath);
  if (!client) return err(`Not a recognized collection: ${resolvedPath}`, 404);

  const details = client.readDetails(resolvedPath);
  if (!details) return err(`Collection details not found: ${resolvedPath}`, 404);

  return ok(details);
});

export const postCollectionSelect = route(async (req) => {
  const body = (await req.json()) as { path?: string };
  if (!body.path) return err('path is required', 400);

  const resolvedPath = path.resolve(body.path);
  if (!fs.existsSync(resolvedPath)) return err(`Collection not found: ${resolvedPath}`, 404);

  const client = resolveClient(resolvedPath);
  if (!client) return err(`Not a recognized collection: ${resolvedPath}`, 404);

  saveCollection(resolvedPath, client.format);
  return ok({ path: resolvedPath });
});

interface InitBody {
  format?: 'bruno' | 'postman';
  name?: string;
  host?: string;
  realm?: string;
  clientId?: string;
  workspaceId?: string;
}

export const postCollectionInit = route(async (req) => {
  const body = (await req.json()) as InitBody;
  const { format = 'bruno', name, host, realm, clientId, workspaceId } = body;

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = 'Required';
  if (!host) fieldErrors.host = 'Required';
  else if (!checkInitArgs({ host }).ok)
    fieldErrors.host = 'Must be a valid URL, e.g. https://acme.ifs.cloud';
  if (!realm) fieldErrors.realm = 'Required';
  if (!clientId) fieldErrors.clientId = 'Required';
  if (format === 'postman' && !workspaceId) fieldErrors.workspaceId = 'Required';

  if (Object.keys(fieldErrors).length > 0) return fieldErr(fieldErrors);

  const outputPath = path.join(resolveCollectionsBasePath(format), name!);
  if (fs.existsSync(outputPath)) return err(`Output already exists: ${outputPath}`, 409);

  if (format === 'postman') {
    const options: PostmanInitOptions = {
      name: name!,
      host: host!,
      realm: realm!,
      clientId: clientId!,
      workspaceId: workspaceId!,
      repoRoot: process.cwd(),
    };
    postmanClient.init(outputPath, options);
  } else {
    const options: BrunoInitOptions = {
      host: host!.replace(/\/$/, ''),
      realm: realm!,
      clientId: clientId!,
      name: name!,
    };
    brunoClient.init(outputPath, options);
  }

  saveCollection(outputPath, format);
  return ok({ path: outputPath }, 201);
});
