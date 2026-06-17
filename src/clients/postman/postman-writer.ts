import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { CanonicalRequest, WriteResult } from '@core/request/canonical-request';
import { dumpYaml } from '@core/shared/yaml';
import { PostmanRequest, PostmanRequestDoc } from '@types-app/postman.types';
import { postmanRequestMapper } from './postman-request-mapper';

function buildPostmanRequestDoc(req: PostmanRequest): PostmanRequestDoc {
  return {
    $kind: 'http-request',
    name: req.name,
    ...(req.description ? { description: req.description } : {}),
    method: req.method,
    url: req.url,
    order: req.order,
    ...(req.queryParams && req.queryParams.length ? { queryParams: req.queryParams } : {}),
    ...(req.auth ? { auth: req.auth } : {}),
    ...(req.headers.length ? { headers: req.headers } : {}),
    ...(req.body !== undefined ? { body: req.body } : {}),
  };
}

export function postmanWrite(
  collectionPath: string,
  folderName: string,
  requests: CanonicalRequest[],
): WriteResult {
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

  for (const req of requests) {
    const operationId = req.operationId || req.name;
    const filePath = path.join(folderPath, `${operationId}.request.yaml`);

    if (fs.existsSync(filePath)) {
      const existing = yaml.load(fs.readFileSync(filePath, 'utf-8')) as PostmanRequestDoc;
      const preservedOrder = typeof existing?.order === 'number' ? existing.order : nextOrder++;
      const pm = postmanRequestMapper(req, preservedOrder);
      fs.writeFileSync(filePath, dumpYaml(buildPostmanRequestDoc(pm)), 'utf-8');
      updated++;
    } else {
      const pm = postmanRequestMapper(req, nextOrder++);
      fs.writeFileSync(filePath, dumpYaml(buildPostmanRequestDoc(pm)), 'utf-8');
      created++;
    }
  }

  return { created, updated };
}
