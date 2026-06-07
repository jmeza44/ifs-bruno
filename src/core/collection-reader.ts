import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import type { BrunoRequest } from "../types/bruno.types";

const RESERVED_ENTRIES = new Set(["environments", "opencollection.yml", "Auth.yml", ".gitignore"]);

export interface CollectionEndpoint {
  name: string;
  method: string;
  path: string | null;
}

export interface CollectionFolder {
  name: string;
  endpoints: CollectionEndpoint[];
}

// Matches `{{baseHost}}/main/ifsapplications/projection/v1/<ProjectionName>.svc`,
// the fixed basePath prefix request-builder.ts embeds in every generated URL —
// each projection has a different `.svc` segment, so this can't be a static constant.
const BASE_PATH_PATTERN = /^\{\{baseHost\}\}\/main\/ifsapplications\/projection\/v1\/[^/]+\.svc/;

/**
 * Reverse-maps a saved Bruno request URL back to an OpenAPI-style path template.
 * Bruno URLs look like `{{baseHost}}/main/.../<Projection>.svc/Entity({{key}})?...` —
 * runtime variables (`{{name}}`) are the path params, and the query string and
 * host/basePath prefix are noise. Returns null when the URL doesn't follow the
 * expected IFS projection-service shape (e.g. hand-written or non-standard requests).
 */
export function urlToPathTemplate(url: string): string | null {
  const withoutQuery = url.split("?")[0];
  const match = withoutQuery.match(BASE_PATH_PATTERN);
  if (!match) return null;

  const rest = withoutQuery.slice(match[0].length);
  return rest.replace(/\{\{([^}]+)\}\}/g, "{$1}");
}

function readRequest(filePath: string): BrunoRequest | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const doc = yaml.load(raw) as BrunoRequest;
    if (!doc?.http?.method || !doc?.info?.name) return null;
    return doc;
  } catch {
    return null;
  }
}

/**
 * Reads a Bruno collection's request folders (top-level directories, excluding
 * `environments`) and groups their requests by folder. `operationId` is NOT
 * recoverable here — `bruno-writer.ts` strips it on save — so `path` is reverse-mapped
 * from the saved URL via `urlToPathTemplate` and may be `null` for non-standard requests.
 */
export function readCollectionFolders(collectionPath: string): CollectionFolder[] {
  const absPath = path.resolve(collectionPath);
  if (!fs.existsSync(absPath)) return [];

  const folders: CollectionFolder[] = [];

  for (const entry of fs.readdirSync(absPath, { withFileTypes: true })) {
    if (!entry.isDirectory() || RESERVED_ENTRIES.has(entry.name)) continue;

    const folderPath = path.join(absPath, entry.name);
    const endpoints: CollectionEndpoint[] = [];

    for (const file of fs.readdirSync(folderPath)) {
      if (!file.endsWith(".yml")) continue;

      const request = readRequest(path.join(folderPath, file));
      if (!request) continue;

      endpoints.push({
        name: request.info.name,
        method: request.http.method.toUpperCase(),
        path: urlToPathTemplate(request.http.url),
      });
    }

    if (endpoints.length > 0) {
      folders.push({ name: entry.name, endpoints });
    }
  }

  return folders;
}

/**
 * Builds the `method:path` key set for endpoints already present in the collection,
 * suitable for cross-referencing against spec entries (which key the same way).
 */
export function buildAlreadyInCollectionKeys(folders: CollectionFolder[]): Set<string> {
  const keys = new Set<string>();
  for (const folder of folders) {
    for (const endpoint of folder.endpoints) {
      if (endpoint.path === null) continue;
      keys.add(`${endpoint.method}:${endpoint.path}`);
    }
  }
  return keys;
}
