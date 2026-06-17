import fs from 'fs';
import path from 'path';
import { CollectionInitOptions } from '@core/collection/collection-client';
import { dumpYaml } from '@core/shared/yaml';
import { BrunoCollection, BrunoEnvironment } from '@types-app/bruno.types';

export type BrunoInitOptions = CollectionInitOptions;

export const GITIGNORE_CONTENT = `# Secrets
.env*

# Dependencies
node_modules

# OS files
.DS_Store
Thumbs.db
`;

function buildCollectionManifest(name: string): BrunoCollection {
  return {
    opencollection: '1.0.0',
    info: { name },
    config: {
      proxy: {
        inherit: false,
        disabled: true,
        config: {
          protocol: 'http',
          hostname: '',
          port: '',
          auth: { username: '', password: '' },
          bypassProxy: '',
        },
      },
    },
    request: {
      auth: {
        type: 'oauth2',
        flow: 'client_credentials',
        accessTokenUrl:
          '{{baseHost}}{{keycloakBasePath}}/realms/{{realm}}/protocol/openid-connect/token',
        credentials: {
          clientId: '{{clientId}}',
          clientSecret: '{{clientSecret}}',
          placement: 'body',
        },
        scope: 'openid microprofile-jwt',
        tokenConfig: {
          id: 'credentials',
          placement: { header: 'Bearer' },
          source: 'access_token',
        },
        settings: {
          autoFetchToken: true,
          autoRefreshToken: false,
        },
      },
    },
    bundled: false,
    extensions: {
      bruno: {
        ignore: ['node_modules', '.git'],
      },
    },
  };
}

function buildEnvironment(options: BrunoInitOptions): BrunoEnvironment {
  return {
    name: 'default',
    variables: [
      { name: 'baseHost', value: options.host },
      { name: 'keycloakBasePath', value: '/auth' },
      { name: 'realm', value: options.realm },
      { name: 'clientId', value: options.clientId },
      { name: 'clientSecret', secret: true as const },
    ],
  };
}

export function brunoInit(collectionPath: string, options: BrunoInitOptions): void {
  const absPath = path.resolve(collectionPath);

  fs.mkdirSync(absPath, { recursive: true });
  fs.mkdirSync(path.join(absPath, 'environments'), { recursive: true });

  // opencollection.yml
  const manifest: BrunoCollection = buildCollectionManifest(options.name);
  fs.writeFileSync(path.join(absPath, 'opencollection.yml'), dumpYaml(manifest), 'utf-8');

  // .gitignore
  fs.writeFileSync(path.join(absPath, '.gitignore'), GITIGNORE_CONTENT, 'utf-8');

  // environments/default.yml
  const env: BrunoEnvironment = buildEnvironment(options);
  fs.writeFileSync(path.join(absPath, 'environments', 'default.yml'), dumpYaml(env), 'utf-8');
}
