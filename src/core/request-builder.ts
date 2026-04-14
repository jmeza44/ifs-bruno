import type { SwaggerSpec, Operation, ParameterObject } from "../types/spec.types";
import type { BrunoRequest, BrunoHeader, BrunoBody, BrunoVariable } from "../types/bruno.types";
import { RefResolver } from "./ref-resolver";

const HAS_BODY_METHODS = new Set(["post", "put", "patch"]);

function extractPathParams(pathTemplate: string): string[] {
  const matches = pathTemplate.match(/\{([^}]+)\}/g) ?? [];
  return matches.map((m) => m.slice(1, -1));
}

function convertPathParams(pathTemplate: string): string {
  return pathTemplate.replace(/\{([^}]+)\}/g, "{{$1}}");
}

export class RequestBuilder {
  private resolver: RefResolver;

  constructor(private spec: SwaggerSpec) {
    this.resolver = new RefResolver(spec);
  }

  build(pathTemplate: string, method: string, operation: Operation, seq: number): BrunoRequest {
    const url = `{{baseHost}}${this.spec.basePath}${convertPathParams(pathTemplate)}`;
    const name = (operation.summary ?? operation.operationId ?? pathTemplate).trim();
    const operationId = operation.operationId ?? "";

    const resolvedParams = (operation.parameters ?? []).map((p) =>
      this.resolver.resolveParameter(p as ParameterObject)
    );

    const pathParamNames = extractPathParams(pathTemplate);
    const headers = this.buildHeaders(method, resolvedParams);
    const body = HAS_BODY_METHODS.has(method.toLowerCase())
      ? this.buildBody(method, resolvedParams)
      : undefined;

    const runtimeVariables: BrunoVariable[] = pathParamNames.map((name) => ({
      name,
      value: "",
    }));

    const request: BrunoRequest = {
      info: {
        name,
        type: "http",
        seq,
      },
      http: {
        method: method.toUpperCase(),
        url,
        auth: "inherit",
        ...(body ? { body } : {}),
      },
      settings: {
        encodeUrl: true,
        timeout: 0,
        followRedirects: true,
        maxRedirects: 5,
      },
    };

    if (headers.length > 0) request.headers = headers;
    if (runtimeVariables.length > 0) request.runtime = { variables: runtimeVariables };

    // Store operationId in a way we can retrieve it for upsert — using info metadata
    // Bruno doesn't have a description field at request level, so we extend info
    (request.info as Record<string, unknown>)["operationId"] = operationId;

    return request;
  }

  private buildHeaders(method: string, params: ParameterObject[]): BrunoHeader[] {
    const headers: BrunoHeader[] = [];

    for (const param of params) {
      if (param.in !== "header") continue;
      headers.push({
        name: param.name,
        value: "",
        enabled: param.required ?? false,
      });
    }

    return headers;
  }

  private buildBody(method: string, params: ParameterObject[]): BrunoBody | undefined {
    void method;
    const bodyParam = params.find((p) => p.in === "body");
    if (!bodyParam?.schema) return undefined;

    let schema;
    try {
      schema = this.resolver.resolveSchema(bodyParam.schema);
    } catch {
      return undefined;
    }

    const exampleObj = this.resolver.buildExampleBody(schema);
    if (Object.keys(exampleObj).length === 0) return undefined;

    return {
      type: "json",
      data: JSON.stringify(exampleObj, null, 2),
    };
  }
}
