import { randomUUID } from 'crypto';
import type {
  PostmanCollection,
  PostmanCollectionAuth,
  PostmanRequest,
  PostmanRequestDoc,
  PostmanWorkspaceResources,
} from '../types/postman.types';

export interface PostmanInitOptions {
  name: string;
  baseHost: string;
  realm: string;
  clientId: string;
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
      accessTokenUrl: '{{baseHost}}{{keycloakBasePath}}/realms/{{realm}}/protocol/openid-connect/token',
      clientId: options.clientId,
      scope: 'openid microprofile-jwt',
    },
  };
}

export function buildPostmanDefinition(
  name: string,
  variables: Record<string, string>,
  options: PostmanInitOptions,
): PostmanCollection {
  return { $kind: 'collection', name, variables, auth: [buildCollectionAuth(options)] };
}

export function buildPostmanRequestDoc(req: PostmanRequest): PostmanRequestDoc {
  return {
    $kind: 'http-request',
    name: req.name,
    ...(req.description ? { description: req.description } : {}),
    method: req.method,
    url: req.url,
    order: req.order,
    ...(req.queryParams && Object.keys(req.queryParams).length ? { queryParams: req.queryParams } : {}),
    ...(req.auth ? { auth: req.auth } : {}),
    ...(req.headers.length ? { headers: req.headers } : {}),
    ...(req.body !== undefined ? { body: req.body } : {}),
  };
}

export function buildPostmanVariables(options: PostmanInitOptions): Record<string, string> {
  return {
    baseHost: options.baseHost,
    realm: options.realm,
    clientId: options.clientId,
    accessToken: '',
    xsrfToken: '',
    keycloakBasePath: '',
  };
}

export function buildWorkspaceResources(workspaceId: string): PostmanWorkspaceResources {
  return { workspace: { id: workspaceId } };
}
