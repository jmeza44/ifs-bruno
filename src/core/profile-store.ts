import fs from "fs";
import path from "path";
import os from "os";
import yaml from "js-yaml";
import { readCollectionFolders } from "./collection-reader";

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
}

export interface CollectionEntry extends StoredCollectionEntry {
  name: string;
  baseHost: string | null;
  endpointCount: number;
}

interface ConfigFile {
  profiles: Record<string, IfsProfile>;
  collections?: Array<StoredCollectionEntry | string>;
}

const CONFIG_DIR = path.join(os.homedir(), ".ifs-bruno");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

function readConfig(): ConfigFile {
  if (!fs.existsSync(CONFIG_FILE)) return { profiles: {} };
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8")) as ConfigFile;
  } catch {
    return { profiles: {} };
  }
}

function writeConfig(config: ConfigFile): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
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

function normalizeCollections(
  raw: Array<StoredCollectionEntry | string>,
): StoredCollectionEntry[] {
  const seen = new Set<string>();
  const result: StoredCollectionEntry[] = [];
  for (const c of raw) {
    const entry = typeof c === "string" ? { path: c, lastUsed: new Date(0).toISOString() } : c;
    if (!seen.has(entry.path)) {
      seen.add(entry.path);
      result.push(entry);
    }
  }
  return result;
}

function countEndpoints(collectionPath: string): number {
  return readCollectionFolders(collectionPath).reduce((total, folder) => total + folder.endpoints.length, 0);
}

function readCollectionName(collectionPath: string): string | null {
  try {
    const raw = fs.readFileSync(path.join(collectionPath, "opencollection.yml"), "utf-8");
    const doc = yaml.load(raw) as { info?: { name?: string } } | undefined;
    return doc?.info?.name ?? null;
  } catch {
    return null;
  }
}

function readCollectionBaseHost(collectionPath: string): string | null {
  try {
    const envPath = path.join(collectionPath, "environments", "default.yml");
    const raw = fs.readFileSync(envPath, "utf-8");
    const doc = yaml.load(raw) as { variables?: Array<{ name?: string; value?: string }> } | undefined;
    const baseHost = doc?.variables?.find((v) => v.name === "baseHost");
    return baseHost?.value ?? null;
  } catch {
    return null;
  }
}

function enrichCollection(entry: StoredCollectionEntry): CollectionEntry {
  return {
    ...entry,
    name: readCollectionName(entry.path) ?? path.basename(entry.path),
    baseHost: readCollectionBaseHost(entry.path),
    endpointCount: countEndpoints(entry.path),
  };
}

export function saveCollection(collectionPath: string): void {
  const abs = path.resolve(collectionPath);
  const now = new Date().toISOString();
  const config = readConfig();
  const existing = normalizeCollections(config.collections ?? []);
  const others = existing.filter((c) => c.path !== abs);
  config.collections = [{ path: abs, lastUsed: now }, ...others];
  writeConfig(config);
}

export function listCollections(): CollectionEntry[] {
  const config = readConfig();
  const all = normalizeCollections(config.collections ?? []);
  const valid = all.filter((c) => fs.existsSync(path.join(c.path, "opencollection.yml")));
  if (valid.length !== all.length) {
    config.collections = valid;
    writeConfig(config);
  }
  return valid.map(enrichCollection);
}
