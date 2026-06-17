import type { CanonicalRequest } from '../../core/request/canonical-request';
import type {
  PostmanBody,
  PostmanHeader,
  PostmanQueryParam,
  PostmanRequest,
  PostmanRequestAuth,
} from '../../types/postman.types';

function buildQueryParams(params: CanonicalRequest['queryParams']): PostmanQueryParam[] {
  return params.map((p) => ({
    key: p.name,
    value: p.value,
    ...(p.value === '' ? { disabled: true as const } : {}),
  }));
}

function buildUrl(rawUrl: string, params: CanonicalRequest['queryParams']): string {
  const qIdx = rawUrl.indexOf('?');
  const baseUrl = qIdx === -1 ? rawUrl : rawUrl.slice(0, qIdx);

  const activeParams = params.filter((p) => p.value !== '');
  if (activeParams.length === 0) return baseUrl;

  const qs = activeParams.map((p) => `${p.name}=${p.value}`).join('&');
  return `${baseUrl}?${qs}`;
}

function mapBody(body: CanonicalRequest['body']): PostmanBody | undefined {
  if (!body) return undefined;

  if (body.type === 'json') {
    return { type: 'json', content: body.content as string };
  }

  if (body.type === 'form-urlencoded') {
    return {
      type: 'urlencoded',
      content: (body.content as Array<{ name: string; value: string }>).map((p) => ({
        key: p.name,
        value: p.value,
      })),
    };
  }

  return undefined;
}

/**
 * Maps a CanonicalRequest to a PostmanRequest.
 * - Drops X-XSRF-TOKEN from headers
 * - Renames name→key on headers and queryParams
 * - Converts form-urlencoded→urlencoded
 * - Adds per-request bearer auth
 */
export function postmanRequestMapper(req: CanonicalRequest, order: number): PostmanRequest {
  const name = req.operationId || req.name;

  const headers: PostmanHeader[] = req.headers
    .filter((h) => h.name !== 'X-XSRF-TOKEN')
    .map((h) => ({ key: h.name, value: h.value }));

  const queryParams = buildQueryParams(req.queryParams);
  const url = buildUrl(req.url, req.queryParams);
  const body = mapBody(req.body);
  const auth: PostmanRequestAuth = { type: 'bearer', credentials: { token: '{{accessToken}}' } };

  return {
    name,
    ...(req.description ? { description: req.description } : {}),
    method: req.method,
    url,
    ...(queryParams.length ? { queryParams } : {}),
    order,
    headers,
    auth,
    ...(body !== undefined ? { body } : {}),
  };
}
