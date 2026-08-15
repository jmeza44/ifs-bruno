import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { resolveClient as resolveAdapter } from './collection/collection-registry';

export interface IfsProfile {
  host: string;
  realm: string;
  clientId: string;
  clientSecret: string;
  keycloakBasePath?: string;
}

interface EncryptedSecret {
  iv: string;
  authTag: string;
  ciphertext: string;
}

/** clientSecret is stored encrypted; everything else stays plaintext for easy inspection. */
type StoredProfile = Omit<IfsProfile, 'clientSecret'> & {
  clientSecret: string | EncryptedSecret;
};

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
  profiles: Record<string, StoredProfile>;
  collections?: Array<StoredCollectionEntry | string>;
  preferences?: AppPreferences;
}

const CONFIG_DIR = path.join(os.homedir(), '.ifs-bruno');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const MACHINE_KEY_FILE = path.join(CONFIG_DIR, '.machine-key');

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

function getMachineKey(): Buffer {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  if (fs.existsSync(MACHINE_KEY_FILE)) {
    return Buffer.from(fs.readFileSync(MACHINE_KEY_FILE, 'utf-8').trim(), 'hex');
  }
  const key = crypto.randomBytes(32);
  fs.writeFileSync(MACHINE_KEY_FILE, key.toString('hex'), { encoding: 'utf-8', mode: 0o600 });
  fs.chmodSync(MACHINE_KEY_FILE, 0o600);
  return key;
}

function encryptSecret(plaintext: string): EncryptedSecret {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, getMachineKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
  return {
    iv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex'),
    ciphertext: ciphertext.toString('hex'),
  };
}

function decryptSecret(secret: EncryptedSecret): string {
  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    getMachineKey(),
    Buffer.from(secret.iv, 'hex'),
  );
  decipher.setAuthTag(Buffer.from(secret.authTag, 'hex'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(secret.ciphertext, 'hex')),
    decipher.final(),
  ]);
  return plaintext.toString('utf-8');
}

function isEncryptedSecret(value: string | EncryptedSecret): value is EncryptedSecret {
  return typeof value === 'object' && value !== null && 'iv' in value && 'authTag' in value;
}

function toStoredProfile(profile: IfsProfile): StoredProfile {
  return { ...profile, clientSecret: encryptSecret(profile.clientSecret) };
}

function fromStoredProfile(stored: StoredProfile): IfsProfile {
  const clientSecret = isEncryptedSecret(stored.clientSecret)
    ? decryptSecret(stored.clientSecret)
    : stored.clientSecret; // legacy plaintext, migrated on next save
  return { ...stored, clientSecret };
}

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
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { encoding: 'utf-8', mode: 0o600 });
}

export function saveProfile(name: string, profile: IfsProfile): void {
  const config = readConfig();
  config.profiles[name] = toStoredProfile(profile);
  writeConfig(config);
}

export function getProfile(name: string): IfsProfile | undefined {
  const stored = readConfig().profiles[name];
  if (!stored) return undefined;

  const profile = fromStoredProfile(stored);
  if (!isEncryptedSecret(stored.clientSecret)) {
    // Legacy plaintext secret found on read — migrate it transparently.
    saveProfile(name, profile);
  }
  return profile;
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

function enrichCollection(entry: StoredCollectionEntry): CollectionEntry {
  const format = entry.format ?? 'bruno';
  const adapter = resolveAdapter(entry.path);
  return {
    ...entry,
    format,
    name: adapter?.readName(entry.path) ?? path.basename(entry.path),
    baseHost: adapter?.readBaseHost(entry.path) ?? null,
    endpointCount: adapter?.countEndpoints(entry.path) ?? 0,
  };
}

export function saveCollection(
  collectionPath: string,
  format: 'bruno' | 'postman' = 'bruno',
): void {
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
  const resolved = base ? path.resolve(base.replace(/^~/, os.homedir())) : defaultCollectionsBase();
  return path.join(resolved, format);
}

export function listCollections(): CollectionEntry[] {
  const config = readConfig();
  const all = normalizeCollections(config.collections ?? []);
  const valid = all.filter((c) => resolveAdapter(c.path) !== null);
  if (valid.length !== all.length) {
    config.collections = valid;
    writeConfig(config);
  }
  return valid.map(enrichCollection);
}
