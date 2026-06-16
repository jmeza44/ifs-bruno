import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { CollectionDetails, CollectionFolder } from '../collection-reader';
import { urlToPathTemplate } from '../collection-reader';
import type { CollectionAdapter } from './types';

const RESERVED = new Set(['.resources']);

type PostmanRequest = { name: string; method: string; url: string };

function readRequest(filePath: string): PostmanRequest | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const doc = yaml.load(raw) as PostmanRequest;
    if (!doc?.method || !doc?.name || !doc?.url) return null;
    return doc;
  } catch {
    return null;
  }
}

function readDefinition(
  collectionPath: string,
): (Record<string, string> & { name?: string }) | null {
  try {
    const defPath = path.join(path.resolve(collectionPath), '.resources', 'definition.yaml');
    const raw = fs.readFileSync(defPath, 'utf-8');
    const doc = yaml.load(raw) as { name?: string; variables?: Record<string, string> } | undefined;
    return { name: doc?.name, ...doc?.variables };
  } catch {
    return null;
  }
}

export const postmanAdapter: CollectionAdapter = {
  format: 'postman',

  detect(collectionPath) {
    return fs.existsSync(path.join(path.resolve(collectionPath), '.resources', 'definition.yaml'));
  },

  readFolders(collectionPath) {
    const absPath = path.resolve(collectionPath);
    if (!fs.existsSync(absPath)) return [];

    const folders: CollectionFolder[] = [];
    for (const entry of fs.readdirSync(absPath, { withFileTypes: true })) {
      if (!entry.isDirectory() || RESERVED.has(entry.name)) continue;

      const folderPath = path.join(absPath, entry.name);
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

      if (endpoints.length > 0) folders.push({ name: entry.name, endpoints });
    }
    return folders;
  },

  readDetails(collectionPath): CollectionDetails | null {
    const def = readDefinition(collectionPath);
    if (!def) return null;
    const { realm, clientId, keycloakBasePath = '' } = def;
    if (!realm || !clientId) return null;
    return { realm, clientId, keycloakBasePath };
  },

  readName(collectionPath) {
    return readDefinition(collectionPath)?.name ?? null;
  },

  readBaseHost(collectionPath) {
    return readDefinition(collectionPath)?.['baseHost'] ?? null;
  },

  countEndpoints(collectionPath) {
    const absPath = path.resolve(collectionPath);
    if (!fs.existsSync(absPath)) return 0;
    let count = 0;
    for (const entry of fs.readdirSync(absPath, { withFileTypes: true })) {
      if (!entry.isDirectory() || RESERVED.has(entry.name)) continue;
      count += fs
        .readdirSync(path.join(absPath, entry.name))
        .filter((f) => f.endsWith('.request.yaml')).length;
    }
    return count;
  },
} satisfies CollectionAdapter;
