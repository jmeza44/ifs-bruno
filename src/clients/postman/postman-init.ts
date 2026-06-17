import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { CollectionInitOptions } from '@core/collection/collection-client';
import { dumpYaml } from '@core/shared/yaml';
import {
  PostmanCollectionAuth,
  PostmanCollection,
  PostmanEnvironment,
  PostmanWorkspaceResources,
} from '@types-app/postman.types';

export interface PostmanInitOptions extends CollectionInitOptions {
  workspaceId: string;
  repoRoot: string;
}

const GITIGNORE_CONTENT = `# Secrets
.env*

# Dependencies
node_modules

# OS files
.DS_Store
Thumbs.db
`;

const WORKSPACE_RESOURCES_HEADER_COMMENT = `# Use this workspace to collaborate\n`;
const WORKSPACE_RESOURCES_FOOTER_COMMENT = `\n# All resources in the \`postman/\` folder are automatically registered in Local View.
# Point to additional files outside the \`postman/\` folder to register them individually. Example:
#localResources:
#  collections:
#    - ../tests/E2E Test Collection/`;

function buildCollectionAuth(): PostmanCollectionAuth {
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
      clientId: '{{clientId}}',
      clientSecret: '{{vault:clientSecret}}',
      scope: 'openid microprofile-jwt',
      client_authentication: 'body',
    },
  };
}

function buildCollectionDefinition(name: string): PostmanCollection {
  return { $kind: 'collection', name, auth: [buildCollectionAuth()] };
}

function buildEnvironment(options: PostmanInitOptions): PostmanEnvironment {
  return {
    name: 'default',
    values: [
      { key: 'baseHost', value: options.host },
      { key: 'keycloakBasePath', value: '/auth' },
      { key: 'realm', value: options.realm },
      { key: 'clientId', value: options.clientId },
    ],
    color: 120,
  };
}

function buildWorkspaceResources(workspaceId: string): PostmanWorkspaceResources {
  return { workspace: { id: workspaceId } };
}

export function postmanInit(collectionPath: string, options: PostmanInitOptions): void {
  const absRoot = path.resolve(collectionPath);

  // postman/collections/{name}/.resources/definition.yaml
  const collectionResourcesPath = path.join(
    absRoot,
    'postman',
    'collections',
    options.name,
    '.resources',
  );
  fs.mkdirSync(collectionResourcesPath, { recursive: true });
  fs.writeFileSync(
    path.join(collectionResourcesPath, 'definition.yaml'),
    dumpYaml(buildCollectionDefinition(options.name)),
    'utf-8',
  );

  // postman/environments/default.environment.yaml
  const environmentsPath = path.join(absRoot, 'postman', 'environments');
  fs.mkdirSync(environmentsPath, { recursive: true });
  fs.writeFileSync(
    path.join(environmentsPath, 'default.environment.yaml'),
    dumpYaml(buildEnvironment(options)),
    'utf-8',
  );

  // .gitignore
  fs.writeFileSync(path.join(absRoot, '.gitignore'), GITIGNORE_CONTENT, 'utf-8');

  // .postman/resources.yaml
  const postmanMetaPath = path.join(absRoot, '.postman');
  fs.mkdirSync(postmanMetaPath, { recursive: true });
  fs.writeFileSync(
    path.join(postmanMetaPath, 'resources.yaml'),
    WORKSPACE_RESOURCES_HEADER_COMMENT +
      dumpYaml(buildWorkspaceResources(options.workspaceId)) +
      WORKSPACE_RESOURCES_FOOTER_COMMENT,
    'utf-8',
  );
}
