import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { BrunoRequest } from '../types/bruno.types';
import type { PostmanCollection, PostmanRequestDoc } from '../types/postman.types';
import type { BuildResult } from '../types/tool.types';
import {
  buildPostmanDefinition,
  buildPostmanRequestDoc,
  buildPostmanVariables,
  buildWorkspaceResources,
  type PostmanInitOptions,
} from './postman-collection-builder';
import { adaptToPostman } from './postman-request-adapter';

export type { PostmanInitOptions };

function dumpYaml(obj: unknown): string {
  return yaml.dump(obj, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  });
}

export function initPostmanCollection(collectionPath: string, options: PostmanInitOptions): void {
  const absCollection = path.resolve(collectionPath);

  fs.mkdirSync(path.join(absCollection, '.resources'), { recursive: true });
  fs.writeFileSync(
    path.join(absCollection, '.resources', 'definition.yaml'),
    dumpYaml(buildPostmanDefinition(options.name, buildPostmanVariables(options), options)),
    'utf-8',
  );

  const absRepo = path.resolve(options.repoRoot);
  fs.mkdirSync(path.join(absRepo, '.postman'), { recursive: true });
  fs.writeFileSync(
    path.join(absRepo, '.postman', 'resources.yaml'),
    dumpYaml(buildWorkspaceResources(options.workspaceId)),
    'utf-8',
  );
}

export function loadPostmanCollection(collectionPath: string): PostmanCollection {
  const absPath = path.resolve(collectionPath);
  const definitionPath = path.join(absPath, '.resources', 'definition.yaml');

  if (!fs.existsSync(definitionPath)) {
    throw new Error(`Not a Postman collection — definition.yaml not found in: ${absPath}`);
  }

  const doc = yaml.load(fs.readFileSync(definitionPath, 'utf-8')) as PostmanCollection;

  if (!doc || doc.$kind !== 'collection') {
    throw new Error(`Unsupported Postman collection format: ${definitionPath}`);
  }

  return doc;
}

export function upsertPostmanRequests(
  collectionPath: string,
  folderName: string,
  requests: BrunoRequest[],
): BuildResult {
  const absCollection = path.resolve(collectionPath);
  const folderPath = path.join(absCollection, 'postman', 'collections', folderName);

  fs.mkdirSync(folderPath, { recursive: true });

  const existingFiles = fs.existsSync(folderPath)
    ? fs.readdirSync(folderPath).filter((f) => f.endsWith('.request.yaml'))
    : [];

  let maxOrder = 999;
  for (const file of existingFiles) {
    const fullPath = path.join(folderPath, file);
    const doc = yaml.load(fs.readFileSync(fullPath, 'utf-8')) as PostmanRequestDoc;
    if (typeof doc?.order === 'number' && doc.order > maxOrder) {
      maxOrder = doc.order;
    }
  }

  let nextOrder = Math.max(maxOrder + 1, 1000);
  let created = 0;
  let updated = 0;

  for (const request of requests) {
    const info = request.info as Record<string, unknown>;
    const operationId = (info['operationId'] as string | undefined) ?? request.info.name;
    const filePath = path.join(folderPath, `${operationId}.request.yaml`);

    if (fs.existsSync(filePath)) {
      const existing = yaml.load(fs.readFileSync(filePath, 'utf-8')) as PostmanRequestDoc;
      const preservedOrder = typeof existing?.order === 'number' ? existing.order : nextOrder++;
      const pm = adaptToPostman(request, preservedOrder);
      fs.writeFileSync(filePath, dumpYaml(buildPostmanRequestDoc(pm)), 'utf-8');
      updated++;
    } else {
      const pm = adaptToPostman(request, nextOrder++);
      fs.writeFileSync(filePath, dumpYaml(buildPostmanRequestDoc(pm)), 'utf-8');
      created++;
    }
  }

  return { created, updated };
}
