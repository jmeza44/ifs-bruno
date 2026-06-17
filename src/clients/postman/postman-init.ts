import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { CollectionInitOptions } from '@core/collection/collection-client';
import { dumpYaml } from '@core/shared/yaml';
import {
  PostmanCollectionAuth,
  PostmanCollection,
  PostmanWorkspaceResources,
} from '@types-app/postman.types';

export interface PostmanInitOptions extends CollectionInitOptions {
  workspaceId: string;
  repoRoot: string;
}

function buildCollectionAuth(options: PostmanInitOptions): PostmanCollectionAuth {
  return {
    id: randomUUID(),
    type: 'oauth2',
    name: 'OAuth 2.0',
    credentials: {
      addTokenTo: 'header',
      tokenName: 'accessToken',
      grant_type: 'client_credentials',
      accessTokenUrl:
        '{{baseHost}}{{keycloakBasePath}}/realms/{{realm}}/protocol/openid-connect/token',
      clientId: options.clientId,
      scope: 'openid microprofile-jwt',
    },
  };
}

function buildPostmanDefinition(
  name: string,
  variables: Record<string, string>,
  options: PostmanInitOptions,
): PostmanCollection {
  return { $kind: 'collection', name, variables, auth: [buildCollectionAuth(options)] };
}

function buildPostmanVariables(options: PostmanInitOptions): Record<string, string> {
  return {
    baseHost: options.host,
    realm: options.realm,
    clientId: options.clientId,
    accessToken: '',
    xsrfToken: '',
    keycloakBasePath: '',
  };
}

function buildWorkspaceResources(workspaceId: string): PostmanWorkspaceResources {
  return { workspace: { id: workspaceId } };
}

export function postmanInit(collectionPath: string, options: PostmanInitOptions): void {
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
