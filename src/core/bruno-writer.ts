import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import type { BrunoCollection, BrunoEnvironment, BrunoRequest } from "../types/bruno.types";
import type { BuildResult } from "../types/tool.types";
import { buildCollectionManifest, buildEnvironment, buildAuthRequest, GITIGNORE_CONTENT } from "./collection-builder";
import type { InitOptions } from "./collection-builder";

export type { InitOptions };

function dumpYaml(obj: unknown): string {
  return yaml.dump(obj, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  });
}

export function initCollection(collectionPath: string, options: InitOptions): void {
  const absPath = path.resolve(collectionPath);

  fs.mkdirSync(absPath, { recursive: true });
  fs.mkdirSync(path.join(absPath, "environments"), { recursive: true });

  // opencollection.yml
  const manifest: BrunoCollection = buildCollectionManifest(options.name);
  fs.writeFileSync(
    path.join(absPath, "opencollection.yml"),
    dumpYaml(manifest),
    "utf-8"
  );

  // .gitignore
  fs.writeFileSync(path.join(absPath, ".gitignore"), GITIGNORE_CONTENT, "utf-8");

  // environments/default.yml
  const env: BrunoEnvironment = buildEnvironment(options);
  fs.writeFileSync(
    path.join(absPath, "environments", "default.yml"),
    dumpYaml(env),
    "utf-8"
  );

  // Auth.yml
  const authRequest: BrunoRequest = buildAuthRequest();
  fs.writeFileSync(
    path.join(absPath, "Auth.yml"),
    dumpYaml(authRequest),
    "utf-8"
  );
}

export function loadCollection(collectionPath: string): BrunoCollection {
  const absPath = path.resolve(collectionPath);
  const manifestPath = path.join(absPath, "opencollection.yml");

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Not a Bruno collection — opencollection.yml not found in: ${absPath}`);
  }

  const raw = fs.readFileSync(manifestPath, "utf-8");
  const doc = yaml.load(raw) as BrunoCollection;

  if (!doc || doc.opencollection !== "1.0.0") {
    throw new Error(`Unsupported Bruno collection format: ${manifestPath}`);
  }

  return doc;
}

export function upsertRequests(
  collectionPath: string,
  folderName: string,
  requests: BrunoRequest[]
): BuildResult {
  const absPath = path.resolve(collectionPath);
  const folderPath = path.join(absPath, folderName);

  fs.mkdirSync(folderPath, { recursive: true });

  let created = 0;
  let updated = 0;

  // Determine next seq by scanning existing files in the folder
  const existingFiles = fs.existsSync(folderPath)
    ? fs.readdirSync(folderPath).filter((f) => f.endsWith(".yml"))
    : [];

  let nextSeq = existingFiles.length + 1;

  for (const request of requests) {
    const operationId = (request.info as Record<string, unknown>)["operationId"] as string | undefined;
    const fileName = operationId || request.info.name;
    const filePath = path.join(folderPath, `${fileName}.yml`);

    // Upsert: check if a file with same operationId already exists
    const existingFile = operationId ? findFileByOperationId(folderPath, operationId) : undefined;

    if (existingFile) {
      // Update — preserve seq from existing file
      const existing = yaml.load(fs.readFileSync(existingFile, "utf-8")) as BrunoRequest;
      request.info.seq = existing.info.seq;
      fs.writeFileSync(existingFile, dumpYaml(sanitizeRequest(request)), "utf-8");
      updated++;
    } else {
      // Create
      request.info.seq = nextSeq++;
      const targetPath = existingFile ?? filePath;
      fs.writeFileSync(targetPath, dumpYaml(sanitizeRequest(request)), "utf-8");
      created++;
    }
  }

  return { created, updated };
}

function findFileByOperationId(folderPath: string, operationId: string): string | undefined {
  if (!fs.existsSync(folderPath)) return undefined;

  const files = fs.readdirSync(folderPath).filter((f) => f.endsWith(".yml"));

  for (const file of files) {
    const fullPath = path.join(folderPath, file);
    const content = yaml.load(fs.readFileSync(fullPath, "utf-8")) as BrunoRequest;
    if ((content?.info as Record<string, unknown>)?.["operationId"] === operationId) {
      return fullPath;
    }
  }

  return undefined;
}

function sanitizeRequest(request: BrunoRequest): BrunoRequest {
  // Remove operationId from info before writing — it's internal metadata
  const { operationId: _, ...info } = request.info as Record<string, unknown>;
  void _;
  return { ...request, info: info as BrunoRequest["info"] };
}
