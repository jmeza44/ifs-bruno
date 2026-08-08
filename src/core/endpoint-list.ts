import type {
  SwaggerSpec,
  PathItem,
  Operation,
  ParameterObject,
  ResponseObject,
} from '@types-app/spec.types';
import type { EndpointEntry, EndpointDetail, EndpointTier } from '@types-app/tool.types';
import { RefResolver } from './ref-resolver';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;
const WRITE_METHODS = new Set<(typeof HTTP_METHODS)[number]>(['post', 'put', 'patch', 'delete']);

/**
 * Classifies a tag by which HTTP methods its operations support: tags with any
 * write method are `core` entities; the rest are read-only reference/lookup
 * data, distinguished from IFS's own naming convention for those (`Reference_*`,
 * `Lookup_*`). `Service Operations - *` tags group business actions/functions,
 * which are always POST-only but aren't CRUD on an entity.
 */
function classifyTier(tag: string, writableTags: Set<string>): EndpointTier {
  if (tag.startsWith('Service Operations')) return 'service-ops';
  if (writableTags.has(tag)) return 'core';
  if (tag.startsWith('Lookup_')) return 'lookup';
  return 'reference';
}

export function buildEndpointList(spec: SwaggerSpec): EndpointEntry[] {
  const writableTags = new Set<string>();
  for (const pathItem of Object.values(spec.paths)) {
    for (const method of HTTP_METHODS) {
      if (!WRITE_METHODS.has(method)) continue;
      const operation = (pathItem as PathItem)[method] as Operation | undefined;
      if (!operation) continue;
      for (const tag of operation.tags ?? []) writableTags.add(tag);
    }
  }

  const entries: EndpointEntry[] = [];

  for (const [pathTemplate, pathItem] of Object.entries(spec.paths)) {
    for (const method of HTTP_METHODS) {
      const operation = (pathItem as PathItem)[method] as Operation | undefined;
      if (!operation) continue;

      const tag = operation.tags?.[0] ?? 'Untagged';
      const summary = (operation.summary ?? operation.operationId ?? pathTemplate).trim();
      const operationId = operation.operationId ?? '';
      const displayLabel = `[${method.toUpperCase()}] ${pathTemplate} — ${summary}`;
      const tier = classifyTier(tag, writableTags);

      entries.push({ path: pathTemplate, method, tag, summary, operationId, displayLabel, tier });
    }
  }

  return entries;
}

/**
 * Finds the operation for `method`+`pathTemplate` in the spec and resolves its
 * parameters/responses/schemas (following $refs) into the enriched detail shape
 * the endpoint detail panel renders.
 */
export function buildEndpointDetail(
  spec: SwaggerSpec,
  pathTemplate: string,
  method: string,
): EndpointDetail | null {
  const pathItem = spec.paths[pathTemplate] as PathItem | undefined;
  if (!pathItem) return null;

  const normalizedMethod = method.toLowerCase() as (typeof HTTP_METHODS)[number];
  const operation = pathItem[normalizedMethod] as Operation | undefined;
  if (!operation) return null;

  const resolver = new RefResolver(spec);

  const parameters = (operation.parameters ?? []).map((paramOrRef) => {
    const param = resolver.resolveParameter(paramOrRef);
    return {
      name: param.name,
      in: param.in,
      required: param.required,
      description: param.description,
      type: param.type,
      enum: param.enum,
      example: param['x-example'],
      schema: resolveSchemaSafely(resolver, param.schema),
    };
  });

  const responses = Object.entries(operation.responses ?? {}).map(([status, responseOrRef]) => {
    const response = resolveResponseSafely(resolver, responseOrRef);
    return {
      status,
      description: response?.description,
      schema: resolveSchemaSafely(resolver, response?.schema),
    };
  });

  return {
    path: pathTemplate,
    method: method.toUpperCase(),
    operationId: operation.operationId,
    summary: operation.summary,
    description: operation.description,
    tags: operation.tags,
    produces: operation.produces,
    parameters: parameters.length > 0 ? parameters : undefined,
    responses: responses.length > 0 ? responses : undefined,
  };
}

function resolveSchemaSafely(resolver: RefResolver, schemaOrRef: ParameterObject['schema']) {
  if (!schemaOrRef) return undefined;
  try {
    return resolver.resolveSchema(schemaOrRef);
  } catch {
    return schemaOrRef;
  }
}

function resolveResponseSafely(
  resolver: RefResolver,
  responseOrRef: ResponseObject | { $ref: string },
) {
  try {
    return resolver.resolveResponse(responseOrRef);
  } catch {
    return '$ref' in responseOrRef ? undefined : responseOrRef;
  }
}
