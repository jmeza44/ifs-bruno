import { CanonicalRequest } from '@core/request/canonical-request';
import { BrunoRequest, BrunoVariable } from '@types-app/bruno.types';

/**
 * Builds the ETag pre-request script for PATCH/PUT requests that include an If-Match header.
 * Regenerated from the CanonicalRequest URL and pathParams — mirrors the original
 * RequestBuilder.buildETagPreRequest() logic.
 */
function buildETagPreRequest(url: string, pathParams: string[]): string {
  // Strip query string from URL and convert {{param}} → ${param} for JS template literal
  const qIdx = url.indexOf('?');
  const baseUrl = qIdx === -1 ? url : url.slice(0, qIdx);
  const scriptUrl = baseUrl.replace(/\{\{([^}]+)\}\}/g, (_, name: string) => `\${${name}}`);

  const paramAssignments = pathParams
    .map((name) => `const ${name} = bru.getRequestVar("${name}");`)
    .join('\n');

  const lines: string[] = [];
  if (paramAssignments) lines.push(paramAssignments);
  lines.push(
    `const base = bru.getEnvVar("baseHost");`,
    ``,
    `await bru.sendRequest(`,
    `  {`,
    `    method: "GET",`,
    `    url: \`${scriptUrl}\`,`,
    `    headers: { Authorization: \`Bearer \${bru.getEnvVar("accessToken")}\` },`,
    `  },`,
    `  (err, res) => {`,
    `    if (err) throw new Error("ETag fetch failed: " + err.message);`,
    `    const etag = res.headers["etag"] ?? res.headers["ETag"] ?? res.body?.["@odata.etag"];`,
    `    if (!etag) throw new Error("No ETag in response");`,
    `    bru.setVar("ifMatch", etag);`,
    `  }`,
    `);`,
  );
  return lines.join('\n');
}

/**
 * Maps a CanonicalRequest to a BrunoRequest.
 * Sets operationId transiently on info for upsert-key matching; the caller must
 * sanitize it before writing to disk (via sanitizeRequest).
 */
export function brunoRequestMapper(req: CanonicalRequest): BrunoRequest {
  const m = req.method.toLowerCase();
  const isWriteMethod = m === 'patch' || m === 'put';
  const hasIfMatch = req.headers.some((h) => h.name.toLowerCase() === 'if-match');

  // runtime.variables — one per path param
  const runtimeVariables: BrunoVariable[] = req.pathParams.map((name) => ({
    name,
    value: '',
  }));

  // ETag pre-request script — only for write methods that carry If-Match
  const etagScript =
    isWriteMethod && hasIfMatch ? buildETagPreRequest(req.url, req.pathParams) : undefined;

  const hasRuntime = runtimeVariables.length > 0 || etagScript !== undefined;

  const brunoRequest: BrunoRequest = {
    info: {
      name: req.name,
      type: 'http' as const,
      seq: req.order,
    },
    http: {
      method: req.method.toUpperCase(),
      url: req.url,
      auth: 'inherit' as const,
      ...(req.headers.length > 0
        ? {
            headers: req.headers.map((h) => ({ name: h.name, value: h.value, enabled: h.enabled })),
          }
        : {}),
      ...(req.queryParams.length > 0
        ? {
            params: req.queryParams.map((p) => ({
              name: p.name,
              value: p.value,
              type: 'query' as const,
            })),
          }
        : {}),
      ...(req.body
        ? {
            body:
              req.body.type === 'json'
                ? { type: 'json' as const, data: req.body.content as string }
                : {
                    type: 'form-urlencoded' as const,
                    data: (req.body.content as Array<{ name: string; value: string }>).map((p) => ({
                      name: p.name,
                      value: p.value,
                    })),
                  },
          }
        : {}),
    },
    settings: {
      encodeUrl: true,
      timeout: 0,
      followRedirects: true,
      maxRedirects: 5,
    },
    ...(req.description ? { docs: req.description } : {}),
    ...(hasRuntime
      ? {
          runtime: {
            ...(etagScript
              ? { scripts: [{ type: 'before-request' as const, code: etagScript }] }
              : {}),
            ...(runtimeVariables.length > 0 ? { variables: runtimeVariables } : {}),
          },
        }
      : {}),
  };

  // Transiently set operationId on info for upsert-key matching.
  // The writer calls sanitizeRequest() to strip it before dumping to disk.
  (brunoRequest.info as Record<string, unknown>)['operationId'] = req.operationId;

  return brunoRequest;
}
