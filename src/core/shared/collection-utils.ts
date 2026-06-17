// Matches `{{baseHost}}/main/ifsapplications/projection/v1/<ProjectionName>.svc`,
// the fixed basePath prefix request-builder.ts embeds in every generated URL —
// each projection has a different `.svc` segment, so this can't be a static constant.
const BASE_PATH_PATTERN = /^\{\{baseHost\}\}\/main\/ifsapplications\/projection\/v1\/[^/]+\.svc/;

/**
 * Reverse-maps a saved request URL back to an OpenAPI-style path template.
 * URLs look like `{{baseHost}}/main/.../<Projection>.svc/Entity({{key}})?...` —
 * runtime variables (`{{name}}`) are the path params, and the query string and
 * host/basePath prefix are noise. Returns null when the URL doesn't follow the
 * expected IFS projection-service shape.
 */
export function urlToPathTemplate(url: string): string | null {
  const withoutQuery = url.split('?')[0];
  const match = withoutQuery.match(BASE_PATH_PATTERN);
  if (!match) return null;

  const rest = withoutQuery.slice(match[0].length);
  return rest.replace(/\{\{([^}]+)\}\}/g, '{$1}');
}
