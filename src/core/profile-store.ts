import fs from "fs";
import path from "path";
import os from "os";

export interface IfsProfile {
  host: string;
  realm: string;
  clientId: string;
  clientSecret: string;
  keycloakBasePath?: string;
}

interface ConfigFile {
  profiles: Record<string, IfsProfile>;
}

const CONFIG_DIR = path.join(os.homedir(), ".ifs-insomnia");
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
