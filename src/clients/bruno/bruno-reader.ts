import { CollectionFolder, CollectionDetails } from '@core/collection/collection-client';
import { urlToPathTemplate } from '@core/shared/collection-utils';
import { BrunoRequest } from '@types-app/bruno.types';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const BRUNO_RESERVED = new Set(['environments', 'opencollection.yml', 'Auth.yml', '.gitignore']);

function readRequest(filePath: string): BrunoRequest | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const doc = yaml.load(raw) as BrunoRequest;
    if (!doc?.http?.method || !doc?.info?.name) return null;
    return doc;
  } catch {
    return null;
  }
}

export function brunoDetect(collectionPath: string): boolean {
  return fs.existsSync(path.join(path.resolve(collectionPath), 'opencollection.yml'));
}

export function brunoReadFolders(collectionPath: string): CollectionFolder[] {
  const absPath = path.resolve(collectionPath);
  if (!fs.existsSync(absPath)) return [];

  const folders: CollectionFolder[] = [];
  for (const entry of fs.readdirSync(absPath, { withFileTypes: true })) {
    if (!entry.isDirectory() || BRUNO_RESERVED.has(entry.name)) continue;

    const folderPath = path.join(absPath, entry.name);
    const endpoints = fs
      .readdirSync(folderPath)
      .filter((f) => f.endsWith('.yml'))
      .flatMap((f) => {
        const req = readRequest(path.join(folderPath, f));
        if (!req) return [];
        return [
          {
            name: req.info.name,
            method: req.http.method.toUpperCase(),
            path: urlToPathTemplate(req.http.url),
          },
        ];
      });

    if (endpoints.length > 0) folders.push({ name: entry.name, endpoints });
  }
  return folders;
}

export function brunoReadDetails(collectionPath: string): CollectionDetails | null {
  try {
    const absPath = path.resolve(collectionPath);
    const name = brunoReadName(absPath);
    const baseHost = brunoReadBaseHost(absPath);
    if (!name || !baseHost) return null;
    return { name, baseHost, format: 'bruno' };
  } catch {
    return null;
  }
}

export function brunoReadName(collectionPath: string): string | null {
  try {
    const raw = fs.readFileSync(
      path.join(path.resolve(collectionPath), 'opencollection.yml'),
      'utf-8',
    );
    const doc = yaml.load(raw) as { info?: { name?: string } } | undefined;
    return doc?.info?.name ?? null;
  } catch {
    return null;
  }
}

export function brunoReadBaseHost(collectionPath: string): string | null {
  try {
    const envPath = path.join(path.resolve(collectionPath), 'environments', 'default.yml');
    const raw = fs.readFileSync(envPath, 'utf-8');
    const doc = yaml.load(raw) as
      | { variables?: Array<{ name?: string; value?: string }> }
      | undefined;
    return doc?.variables?.find((v) => v.name === 'baseHost')?.value ?? null;
  } catch {
    return null;
  }
}

export function brunoCountEndpoints(collectionPath: string): number {
  return brunoReadFolders(collectionPath).reduce((total, f) => total + f.endpoints.length, 0);
}
