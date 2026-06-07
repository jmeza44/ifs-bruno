import type { SwaggerSpec, PathItem, Operation, ParameterObject, ResponseObject } from "../types/spec.types";
import type { EndpointDetail, EndpointEntry } from "../types/tool.types";
import { RefResolver } from "./ref-resolver";

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;

export function buildEndpointList(spec: SwaggerSpec): EndpointEntry[] {
  const entries: EndpointEntry[] = [];

  for (const [pathTemplate, pathItem] of Object.entries(spec.paths)) {
    for (const method of HTTP_METHODS) {
      const operation = (pathItem as PathItem)[method] as Operation | undefined;
      if (!operation) continue;

      const tag = operation.tags?.[0] ?? "Untagged";
      const summary = (operation.summary ?? operation.operationId ?? pathTemplate).trim();
      const operationId = operation.operationId ?? "";
      const displayLabel = `[${method.toUpperCase()}] ${pathTemplate} — ${summary}`;

      entries.push({ path: pathTemplate, method, tag, summary, operationId, displayLabel });
    }
  }

  return entries;
}

/**
 * Finds the operation for `method`+`pathTemplate` in the spec and resolves its
 * parameters/responses/schemas (following $refs) into the enriched detail shape
 * the endpoint detail panel renders.
 */
export function buildEndpointDetail(spec: SwaggerSpec, pathTemplate: string, method: string): EndpointDetail | null {
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
      example: param["x-example"],
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

function resolveSchemaSafely(resolver: RefResolver, schemaOrRef: ParameterObject["schema"]) {
  if (!schemaOrRef) return undefined;
  try {
    return resolver.resolveSchema(schemaOrRef);
  } catch {
    return schemaOrRef;
  }
}

function resolveResponseSafely(resolver: RefResolver, responseOrRef: ResponseObject | { $ref: string }) {
  try {
    return resolver.resolveResponse(responseOrRef);
  } catch {
    return "$ref" in responseOrRef ? undefined : responseOrRef;
  }
}
