import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { BrunoRequest } from '../../types/bruno.types';
import type { CollectionDetails, CollectionFolder } from '../collection-reader';
import { urlToPathTemplate } from '../collection-reader';
import type { CollectionAdapter } from './types';

const RESERVED = new Set(['environments', 'opencollection.yml', 'Auth.yml', '.gitignore']);

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

export const brunoAdapter: CollectionAdapter = {
  format: 'bruno',

  detect(collectionPath) {
    return fs.existsSync(path.join(path.resolve(collectionPath), 'opencollection.yml'));
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
        .filter((f) => f.endsWith('.yml'))
        .flatMap((f) => {
          const req = readRequest(path.join(folderPath, f));
          if (!req) return [];
          return [{ name: req.info.name, method: req.http.method.toUpperCase(), path: urlToPathTemplate(req.http.url) }];
        });

      if (endpoints.length > 0) folders.push({ name: entry.name, endpoints });
    }
    return folders;
  },

  readDetails(collectionPath) {
    try {
      const envPath = path.join(path.resolve(collectionPath), 'environments', 'default.yml');
      const raw = fs.readFileSync(envPath, 'utf-8');
      const doc = yaml.load(raw) as { variables?: Array<{ name?: string; value?: string }> } | undefined;
      const variables = doc?.variables ?? [];
      const find = (name: string) => variables.find((v) => v.name === name)?.value;
      const realm = find('realm');
      const clientId = find('clientId');
      const keycloakBasePath = find('keycloakBasePath');
      if (!realm || !clientId || !keycloakBasePath) return null;
      return { realm, clientId, keycloakBasePath };
    } catch {
      return null;
    }
  },

  readName(collectionPath) {
    try {
      const raw = fs.readFileSync(path.join(path.resolve(collectionPath), 'opencollection.yml'), 'utf-8');
      const doc = yaml.load(raw) as { info?: { name?: string } } | undefined;
      return doc?.info?.name ?? null;
    } catch {
      return null;
    }
  },

  readBaseHost(collectionPath) {
    try {
      const envPath = path.join(path.resolve(collectionPath), 'environments', 'default.yml');
      const raw = fs.readFileSync(envPath, 'utf-8');
      const doc = yaml.load(raw) as { variables?: Array<{ name?: string; value?: string }> } | undefined;
      return doc?.variables?.find((v) => v.name === 'baseHost')?.value ?? null;
    } catch {
      return null;
    }
  },

  countEndpoints(collectionPath) {
    return this.readFolders(collectionPath).reduce((total, f) => total + f.endpoints.length, 0);
  },
} satisfies CollectionAdapter;
