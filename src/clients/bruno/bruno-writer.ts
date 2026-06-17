import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { CanonicalRequest, WriteResult } from '@core/request/canonical-request';
import { dumpYaml } from '@core/shared/yaml';
import { BrunoRequest } from '@types-app/bruno.types';
import { brunoRequestMapper } from './bruno-request-mapper';

function findFileByOperationId(folderPath: string, operationId: string): string | undefined {
  if (!fs.existsSync(folderPath)) return undefined;

  const files = fs.readdirSync(folderPath).filter((f) => f.endsWith('.yml'));

  for (const file of files) {
    const fullPath = path.join(folderPath, file);
    const content = yaml.load(fs.readFileSync(fullPath, 'utf-8')) as BrunoRequest;
    if ((content?.info as Record<string, unknown>)?.['operationId'] === operationId) {
      return fullPath;
    }
  }

  return undefined;
}

function sanitizeRequest(request: BrunoRequest): BrunoRequest {
  // Remove operationId from info before writing — it's internal metadata
  const { operationId: _, ...info } = request.info as Record<string, unknown>;
  void _;
  return { ...request, info: info as BrunoRequest['info'] };
}

export function brunoLoadCollection(collectionPath: string): void {
  const absPath = path.resolve(collectionPath);
  const manifestPath = path.join(absPath, 'opencollection.yml');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Not a Bruno collection — opencollection.yml not found in: ${absPath}`);
  }

  const raw = fs.readFileSync(manifestPath, 'utf-8');
  const doc = yaml.load(raw) as { opencollection?: string };

  if (!doc || doc.opencollection !== '1.0.0') {
    throw new Error(`Unsupported Bruno collection format: ${manifestPath}`);
  }
}

export function brunoWrite(
  collectionPath: string,
  folderName: string,
  requests: CanonicalRequest[],
): WriteResult {
  const absPath = path.resolve(collectionPath);
  const folderPath = path.join(absPath, folderName);

  fs.mkdirSync(folderPath, { recursive: true });

  let created = 0;
  let updated = 0;

  // Determine next seq by scanning existing files in the folder
  const existingFiles = fs.existsSync(folderPath)
    ? fs.readdirSync(folderPath).filter((f) => f.endsWith('.yml'))
    : [];

  let nextSeq = existingFiles.length + 1;

  for (const req of requests) {
    const brunoReq = brunoRequestMapper(req);

    const operationId = req.operationId;
    const fileName = operationId || req.name;
    const filePath = path.join(folderPath, `${fileName}.yml`);

    const existingFile = operationId ? findFileByOperationId(folderPath, operationId) : undefined;

    if (existingFile) {
      // Update — preserve seq from existing file
      const existing = yaml.load(fs.readFileSync(existingFile, 'utf-8')) as BrunoRequest;
      brunoReq.info.seq = existing.info.seq;
      fs.writeFileSync(existingFile, dumpYaml(sanitizeRequest(brunoReq)), 'utf-8');
      updated++;
    } else {
      // Create
      brunoReq.info.seq = nextSeq++;
      fs.writeFileSync(filePath, dumpYaml(sanitizeRequest(brunoReq)), 'utf-8');
      created++;
    }
  }

  return { created, updated };
}
