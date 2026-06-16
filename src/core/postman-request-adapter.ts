import type { BrunoRequest, BrunoParam } from '../types/bruno.types';
import type { PostmanBody, PostmanHeader, PostmanQueryParam, PostmanRequest, PostmanRequestAuth } from '../types/postman.types';

export function adaptToPostman(request: BrunoRequest, order: number): PostmanRequest {
  const info = request.info as Record<string, unknown>;
  const name = (info['operationId'] as string | undefined) ?? request.info.name;

  const headers: PostmanHeader[] = (request.http.headers ?? [])
    .filter((h) => h.name !== 'X-XSRF-TOKEN')
    .map((h) => ({ key: h.name, value: h.value }));

  const brunoParams = request.http.params ?? [];
  const queryParams = buildQueryParams(brunoParams);
  const url = buildUrl(request.http.url, brunoParams);
  const body = mapBody(request.http.body);
  const auth: PostmanRequestAuth = { type: 'bearer', credentials: { token: '{{accessToken}}' } };

  return {
    name,
    ...(request.docs ? { description: request.docs } : {}),
    method: request.http.method,
    url,
    ...(queryParams.length ? { queryParams } : {}),
    order,
    headers,
    auth,
    ...(body !== undefined ? { body } : {}),
  };
}

function buildQueryParams(params: BrunoParam[]): PostmanQueryParam[] {
  return params
    .filter((p) => p.type === 'query')
    .map((p) => ({
      key: p.name,
      value: p.value,
      ...(p.value === '' ? { disabled: true as const } : {}),
    }));
}

function buildUrl(rawUrl: string, params: BrunoParam[]): string {
  const qIdx = rawUrl.indexOf('?');
  const baseUrl = qIdx === -1 ? rawUrl : rawUrl.slice(0, qIdx);

  const activeParams = params.filter((p) => p.type === 'query' && p.value !== '');
  if (activeParams.length === 0) return baseUrl;

  const qs = activeParams.map((p) => `${p.name}=${p.value}`).join('&');
  return `${baseUrl}?${qs}`;
}

function mapBody(brunoBody: BrunoRequest['http']['body']): PostmanBody | undefined {
  if (!brunoBody) return undefined;

  if (brunoBody.type === 'json') {
    return { type: 'json', content: brunoBody.data };
  }

  if (brunoBody.type === 'form-urlencoded') {
    return {
      type: 'urlencoded',
      content: brunoBody.data.map((p) => ({ key: p.name, value: p.value })),
    };
  }

  return undefined;
}
