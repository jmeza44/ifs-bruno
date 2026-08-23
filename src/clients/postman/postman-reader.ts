import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { CollectionFolder, CollectionDetails } from '@core/collection/collection-client';
import { urlToPathTemplate } from '@core/shared/collection-utils';

const COLLECTIONS_SUBDIR = path.join('postman', 'collections');
const ENVIRONMENT_FILE = path.join('postman', 'environments', 'default.environment.yaml');

type MinimalPostmanRequest = { name: string; method: string; url: string };

function readRequest(filePath: string): MinimalPostmanRequest | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const doc = yaml.load(raw) as MinimalPostmanRequest;
    if (!doc?.method || !doc?.name || !doc?.url) return null;
    return doc;
  } catch {
    return null;
  }
}

function readCollectionName(collectionPath: string): string | null {
  try {
    const collectionsDir = path.join(path.resolve(collectionPath), COLLECTIONS_SUBDIR);
    if (!fs.existsSync(collectionsDir)) return null;
    const entries = fs.readdirSync(collectionsDir, { withFileTypes: true });
    const first = entries.find((e) => e.isDirectory());
    if (!first) return null;
    const defPath = path.join(collectionsDir, first.name, '.resources', 'definition.yaml');
    const raw = fs.readFileSync(defPath, 'utf-8');
    const doc = yaml.load(raw) as { name?: string } | undefined;
    return doc?.name ?? null;
  } catch {
    return null;
  }
}

function readEnvironmentValues(collectionPath: string): Record<string, string> {
  try {
    const envPath = path.join(path.resolve(collectionPath), ENVIRONMENT_FILE);
    const raw = fs.readFileSync(envPath, 'utf-8');
    const doc = yaml.load(raw) as { values?: Array<{ key: string; value: string }> } | undefined;
    const result: Record<string, string> = {};
    for (const v of doc?.values ?? []) result[v.key] = v.value;
    return result;
  } catch {
    return {};
  }
}

export function postmanDetect(collectionPath: string): boolean {
  const absPath = path.resolve(collectionPath);
  const collectionsDir = path.join(absPath, COLLECTIONS_SUBDIR);
  if (!fs.existsSync(collectionsDir)) return false;
  return fs
    .readdirSync(collectionsDir, { withFileTypes: true })
    .some(
      (e) =>
        e.isDirectory() &&
        fs.existsSync(path.join(collectionsDir, e.name, '.resources', 'definition.yaml')),
    );
}

export function postmanReadFolders(collectionPath: string): CollectionFolder[] {
  const collectionsDir = path.join(path.resolve(collectionPath), COLLECTIONS_SUBDIR);
  if (!fs.existsSync(collectionsDir)) return [];

  const folders: CollectionFolder[] = [];

  for (const collEntry of fs.readdirSync(collectionsDir, { withFileTypes: true })) {
    if (!collEntry.isDirectory()) continue;
    const collDir = path.join(collectionsDir, collEntry.name);

    for (const folderEntry of fs.readdirSync(collDir, { withFileTypes: true })) {
      if (!folderEntry.isDirectory() || folderEntry.name === '.resources') continue;
      const folderPath = path.join(collDir, folderEntry.name);

      const endpoints = fs
        .readdirSync(folderPath)
        .filter((f) => f.endsWith('.request.yaml'))
        .flatMap((f) => {
          const req = readRequest(path.join(folderPath, f));
          if (!req) return [];
          return [
            { name: req.name, method: req.method.toUpperCase(), path: urlToPathTemplate(req.url) },
          ];
        });

      if (endpoints.length > 0) folders.push({ name: folderEntry.name, endpoints });
    }
  }

  return folders;
}

export function postmanReadDetails(collectionPath: string): CollectionDetails | null {
  const name = readCollectionName(collectionPath);
  const env = readEnvironmentValues(collectionPath);
  if (!name || !env['baseHost']) return null;
  return {
    name,
    baseHost: env['baseHost'],
    realm: env['realm'] ?? null,
    clientId: env['clientId'] ?? null,
    keycloakBasePath: env['keycloakBasePath'] ?? null,
    format: 'postman',
  };
}

export function postmanReadName(collectionPath: string): string | null {
  return readCollectionName(collectionPath);
}

export function postmanReadBaseHost(collectionPath: string): string | null {
  return readEnvironmentValues(collectionPath)['baseHost'] ?? null;
}

export function postmanCountEndpoints(collectionPath: string): number {
  return postmanReadFolders(collectionPath).reduce((total, f) => total + f.endpoints.length, 0);
}
