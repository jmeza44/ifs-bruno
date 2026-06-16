import fs from 'fs';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { countPostmanEndpoints, readCollectionFolders } from './collection-reader';

export interface IfsProfile {
  host: string;
  realm: string;
  clientId: string;
  clientSecret: string;
  keycloakBasePath?: string;
}

interface StoredCollectionEntry {
  path: string;
  lastUsed: string;
  format?: 'bruno' | 'postman';
}

export interface CollectionEntry extends StoredCollectionEntry {
  name: string;
  baseHost: string | null;
  endpointCount: number;
  format: 'bruno' | 'postman';
}

export interface AppPreferences {
  collectionsBasePath?: string;
}

interface ConfigFile {
  profiles: Record<string, IfsProfile>;
  collections?: Array<StoredCollectionEntry | string>;
  preferences?: AppPreferences;
}

const CONFIG_DIR = path.join(os.homedir(), '.ifs-bruno');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function readConfig(): ConfigFile {
  if (!fs.existsSync(CONFIG_FILE)) return { profiles: {} };
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')) as ConfigFile;
  } catch {
    return { profiles: {} };
  }
}

function writeConfig(config: ConfigFile): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export function saveProfile(name: string, profile: IfsProfile): void {
  const config = readConfig();
  config.profiles[name] = profile;
  writeConfig(config);
}

export function getProfile(name: string): IfsProfile | undefined {
  return readConfig().profiles[name];
}

export function listProfiles(): string[] {
  return Object.keys(readConfig().profiles);
}

export function deleteProfile(name: string): boolean {
  const config = readConfig();
  if (!config.profiles[name]) return false;
  delete config.profiles[name];
  writeConfig(config);
  return true;
}

function normalizeCollections(raw: Array<StoredCollectionEntry | string>): StoredCollectionEntry[] {
  const seen = new Set<string>();
  const result: StoredCollectionEntry[] = [];
  for (const c of raw) {
    const base = typeof c === 'string' ? { path: c, lastUsed: new Date(0).toISOString() } : c;
    const entry: StoredCollectionEntry = { ...base, format: base.format ?? 'bruno' };
    if (!seen.has(entry.path)) {
      seen.add(entry.path);
      result.push(entry);
    }
  }
  return result;
}

function countEndpoints(collectionPath: string): number {
  return readCollectionFolders(collectionPath).reduce(
    (total, folder) => total + folder.endpoints.length,
    0,
  );
}

function readCollectionName(collectionPath: string, format: 'bruno' | 'postman' = 'bruno'): string | null {
  try {
    if (format === 'postman') {
      const raw = fs.readFileSync(path.join(collectionPath, '.resources', 'definition.yaml'), 'utf-8');
      const doc = yaml.load(raw) as { name?: string } | undefined;
      return doc?.name ?? null;
    }
    const raw = fs.readFileSync(path.join(collectionPath, 'opencollection.yml'), 'utf-8');
    const doc = yaml.load(raw) as { info?: { name?: string } } | undefined;
    return doc?.info?.name ?? null;
  } catch {
    return null;
  }
}

function readCollectionBaseHost(collectionPath: string, format: 'bruno' | 'postman' = 'bruno'): string | null {
  try {
    if (format === 'postman') {
      const raw = fs.readFileSync(path.join(collectionPath, '.resources', 'definition.yaml'), 'utf-8');
      const doc = yaml.load(raw) as { variables?: Record<string, string> } | undefined;
      return doc?.variables?.['baseHost'] ?? null;
    }
    const envPath = path.join(collectionPath, 'environments', 'default.yml');
    const raw = fs.readFileSync(envPath, 'utf-8');
    const doc = yaml.load(raw) as
      | { variables?: Array<{ name?: string; value?: string }> }
      | undefined;
    const baseHost = doc?.variables?.find((v) => v.name === 'baseHost');
    return baseHost?.value ?? null;
  } catch {
    return null;
  }
}

function enrichCollection(entry: StoredCollectionEntry): CollectionEntry {
  const format = entry.format ?? 'bruno';
  return {
    ...entry,
    format,
    name: readCollectionName(entry.path, format) ?? path.basename(entry.path),
    baseHost: readCollectionBaseHost(entry.path, format),
    endpointCount: format === 'postman' ? countPostmanEndpoints(entry.path) : countEndpoints(entry.path),
  };
}

export function saveCollection(collectionPath: string, format: 'bruno' | 'postman' = 'bruno'): void {
  const abs = path.resolve(collectionPath);
  const now = new Date().toISOString();
  const config = readConfig();
  const existing = normalizeCollections(config.collections ?? []);
  const others = existing.filter((c) => c.path !== abs);
  config.collections = [{ path: abs, lastUsed: now, format }, ...others];
  writeConfig(config);
}

export function getPreferences(): AppPreferences {
  return readConfig().preferences ?? {};
}

export function savePreferences(prefs: Partial<AppPreferences>): void {
  const config = readConfig();
  config.preferences = { ...config.preferences, ...prefs };
  writeConfig(config);
}

function defaultCollectionsBase(): string {
  const documents = path.join(os.homedir(), 'Documents');
  return fs.existsSync(documents) ? documents : os.homedir();
}

export function resolveCollectionsBasePath(format: 'bruno' | 'postman'): string {
  const base = getPreferences().collectionsBasePath;
  const resolved = base
    ? path.resolve(base.replace(/^~/, os.homedir()))
    : defaultCollectionsBase();
  return path.join(resolved, format);
}

export function listCollections(): CollectionEntry[] {
  const config = readConfig();
  const all = normalizeCollections(config.collections ?? []);
  const valid = all.filter((c) => {
    if (c.format === 'postman') {
      return fs.existsSync(path.join(c.path, '.resources', 'definition.yaml'));
    }
    return fs.existsSync(path.join(c.path, 'opencollection.yml'));
  });
  if (valid.length !== all.length) {
    config.collections = valid;
    writeConfig(config);
  }
  return valid.map(enrichCollection);
}
