export interface PostmanHeader {
  key: string;
  value: string;
}

export interface PostmanUrlEncodedParam {
  key: string;
  value: string;
}

export type PostmanBody =
  | { type: 'json'; content: string }
  | { type: 'urlencoded'; content: PostmanUrlEncodedParam[] }
  | { type: 'text'; content: string }
  | { type: 'xml'; content: string };

export interface PostmanQueryParam {
  key: string;
  value: string;
  disabled?: true;
}

export interface PostmanRequestAuth {
  type: 'bearer';
  credentials: { token: string };
}

export interface PostmanCollectionAuth {
  id: string;
  type: 'oauth2';
  name: string;
  credentials: {
    addTokenTo: 'header';
    tokenName: string;
    grant_type: 'client_credentials';
    accessTokenUrl: string;
    clientId: string;
    clientSecret: string;
    scope: string;
    client_authentication: 'body';
  };
}

export interface PostmanEnvironmentVariable {
  key: string;
  value: string;
}

export interface PostmanEnvironment {
  name: string;
  values: PostmanEnvironmentVariable[];
  color?: number;
}

export interface PostmanRequest {
  name: string;
  description?: string;
  method: string;
  url: string;
  queryParams?: PostmanQueryParam[];
  order: number;
  headers: PostmanHeader[];
  auth?: PostmanRequestAuth;
  body?: PostmanBody;
}

export interface PostmanRequestDoc {
  $kind: 'http-request';
  name: string;
  description?: string;
  method: string;
  url: string;
  queryParams?: PostmanQueryParam[];
  order: number;
  headers?: PostmanHeader[];
  auth?: PostmanRequestAuth;
  body?: PostmanBody;
}

export interface PostmanCollection {
  $kind: 'collection';
  name: string;
  auth?: PostmanCollectionAuth[];
}

export interface PostmanWorkspaceResources {
  workspace: { id: string };
}
