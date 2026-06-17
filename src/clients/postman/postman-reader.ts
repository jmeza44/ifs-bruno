import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { CollectionFolder, CollectionDetails } from '@core/collection/collection-client';
import { urlToPathTemplate } from '@core/shared/collection-utils';

const COLLECTIONS_SUBDIR = path.join('postman', 'collections');

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

interface CollectionDefinition {
  name?: string;
  [key: string]: string | undefined;
}

function readDefinition(collectionPath: string): CollectionDefinition | null {
  try {
    const defPath = path.join(path.resolve(collectionPath), '.resources', 'definition.yaml');
    const raw = fs.readFileSync(defPath, 'utf-8');
    const doc = yaml.load(raw) as { name?: string; variables?: Record<string, string> } | undefined;
    return { name: doc?.name, ...doc?.variables };
  } catch {
    return null;
  }
}

export function postmanDetect(collectionPath: string): boolean {
  return fs.existsSync(path.join(path.resolve(collectionPath), '.resources', 'definition.yaml'));
}

export function postmanReadFolders(collectionPath: string): CollectionFolder[] {
  const absPath = path.join(path.resolve(collectionPath), COLLECTIONS_SUBDIR);
  if (!fs.existsSync(absPath)) return [];

  const folders: CollectionFolder[] = [];
  for (const entry of fs.readdirSync(absPath, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const folderPath = path.join(absPath, entry.name);
    const endpoints = fs
      .readdirSync(folderPath)
      .filter((f) => f.endsWith('.request.yaml'))
      .flatMap((f) => {
        const req = readRequest(path.join(folderPath, f));
        if (!req) return [];
        return [
          {
            name: req.name,
            method: req.method.toUpperCase(),
            path: urlToPathTemplate(req.url),
          },
        ];
      });

    if (endpoints.length > 0) folders.push({ name: entry.name, endpoints });
  }
  return folders;
}

export function postmanReadDetails(collectionPath: string): CollectionDetails | null {
  const def = readDefinition(collectionPath);
  if (!def) return null;
  const name = def.name;
  const baseHost = def['baseHost'];
  if (!name || !baseHost) return null;
  return { name, baseHost, format: 'postman' };
}

export function postmanReadName(collectionPath: string): string | null {
  return readDefinition(collectionPath)?.name ?? null;
}

export function postmanReadBaseHost(collectionPath: string): string | null {
  return readDefinition(collectionPath)?.['baseHost'] ?? null;
}

export function postmanCountEndpoints(collectionPath: string): number {
  return postmanReadFolders(collectionPath).reduce((total, f) => total + f.endpoints.length, 0);
}
