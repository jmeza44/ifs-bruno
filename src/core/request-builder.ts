import type { SwaggerSpec, Operation, ParameterObject } from "../types/spec.types";
import type { BrunoRequest, BrunoHeader, BrunoBody, BrunoParam, BrunoVariable } from "../types/bruno.types";
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
    const operationId = operation.operationId ?? "";
    const name = operationId || (operation.summary ?? pathTemplate).trim();

    const resolvedParams = (operation.parameters ?? []).map((p) =>
      this.resolver.resolveParameter(p as ParameterObject)
    );

    const pathParamNames = extractPathParams(pathTemplate);
    const queryParams = this.buildQueryParams(resolvedParams);
    const headers = this.buildHeaders(method, resolvedParams);
    const body = HAS_BODY_METHODS.has(method.toLowerCase())
      ? this.buildBody(method, resolvedParams)
      : undefined;

    const basePath = convertPathParams(pathTemplate);
    const queryString = queryParams.map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`).join("&");
    const url = `{{baseHost}}${this.spec.basePath}${basePath}${queryString ? `?${queryString}` : ""}`;

    const runtimeVariables: BrunoVariable[] = pathParamNames.map((name) => ({
      name,
      value: "",
    }));

    const docs = this.buildDocs(operation, resolvedParams);
    const preRequestScript = this.buildETagPreRequest(method, pathTemplate, resolvedParams);

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
        ...(headers.length > 0 ? { headers } : {}),
        ...(queryParams.length > 0 ? { params: queryParams } : {}),
        ...(body ? { body } : {}),
      },
      settings: {
        encodeUrl: true,
        timeout: 0,
        followRedirects: true,
        maxRedirects: 5,
      },
      ...(docs ? { docs } : {}),
    };

    if (runtimeVariables.length > 0 || preRequestScript) {
      request.runtime = {
        ...(preRequestScript ? { scripts: [{ type: "before-request", code: preRequestScript }] } : {}),
        ...(runtimeVariables.length > 0 ? { variables: runtimeVariables } : {}),
      };
    }

    // Store operationId in a way we can retrieve it for upsert — using info metadata
    // Bruno doesn't have a description field at request level, so we extend info
    (request.info as Record<string, unknown>)["operationId"] = operationId;

    return request;
  }

  private buildHeaders(method: string, params: ParameterObject[]): BrunoHeader[] {
    const headers: BrunoHeader[] = [];
    const m = method.toLowerCase();
    const isWriteMethod = m === "patch" || m === "put";

    for (const param of params) {
      if (param.in !== "header") continue;
      const isIfMatch = param.name.toLowerCase() === "if-match";
      headers.push({
        name: param.name,
        value: isIfMatch && isWriteMethod ? "{{ifMatch}}" : "",
        enabled: true,
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

  private buildETagPreRequest(method: string, pathTemplate: string, params: ParameterObject[]): string | undefined {
    const m = method.toLowerCase();
    if (m !== "patch" && m !== "put") return undefined;

    const hasIfMatch = params.some((p) => p.in === "header" && p.name.toLowerCase() === "if-match");
    if (!hasIfMatch) return undefined;

    const getOperation = this.spec.paths[pathTemplate]?.get;
    if (!getOperation) return undefined;

    const pathParamNames = extractPathParams(pathTemplate);

    // Replace {paramName} with ${paramName} — variables are already declared via bru.getRequestVar()
    const scriptPath = pathTemplate.replace(/\{([^}]+)\}/g, (_, name) => `\${${name}}`);
    const getUrl = `\${base}${this.spec.basePath}${scriptPath}`;

    const paramAssignments = pathParamNames
      .map((name) => `const ${name} = bru.getRequestVar("${name}");`)
      .join("\n");

    return [
      paramAssignments,
      `const base = bru.getEnvVar("baseHost");`,
      ``,
      `await bru.sendRequest(`,
      `  {`,
      `    method: "GET",`,
      `    url: \`${getUrl}\`,`,
      `    headers: { Authorization: \`Bearer \${bru.getEnvVar("accessToken")}\` },`,
      `  },`,
      `  (err, res) => {`,
      `    if (err) throw new Error("ETag fetch failed: " + err.message);`,
      `    const etag = res.headers["etag"] ?? res.headers["ETag"] ?? res.body?.["@odata.etag"];`,
      `    if (!etag) throw new Error("No ETag in response");`,
      `    bru.setVar("ifMatch", etag);`,
      `  }`,
      `);`,
    ].join("\n");
  }

  private buildQueryParams(params: ParameterObject[]): BrunoParam[] {
    return params
      .filter((p) => p.in === "query")
      .map((p) => ({
        name: p.name,
        value: p.type === "array" && p.items?.enum ? p.items.enum.join(",") : "",
        type: "query" as const,
      }));
  }

  private buildDocs(operation: Operation, params: ParameterObject[]): string | undefined {
    const lines: string[] = [];

    // Title + description
    const title = (operation.summary ?? operation.operationId ?? "").replace(/\.+$/, "");
    if (title) lines.push(`# ${title}`);
    if (operation.description && operation.description !== operation.summary) {
      lines.push("", operation.description);
    }

    // Parameters table (all except body — body gets its own section)
    const nonBodyParams = params.filter((p) => p.in !== "body");
    if (nonBodyParams.length > 0) {
      lines.push("", "## Parameters", "", "| Name | In | Type | Required | Description |", "| --- | --- | --- | --- | --- |");
      for (const p of nonBodyParams) {
        const type = p.type ?? (p.schema ? "object" : "");
        const required = p.required ? "true" : "false";
        const description = p.description ?? "";
        lines.push(`| ${p.name} | ${p.in} | ${type} | ${required} | ${description} |`);
      }

      // Enum sections for array params with items.enum
      for (const p of nonBodyParams) {
        if (p.type === "array" && p.items?.enum && p.items.enum.length > 0) {
          lines.push("", `## ${p.name} values`, "", "| Value |", "| --- |");
          for (const value of p.items.enum) {
            lines.push(`| ${value} |`);
          }
        }
      }
    }

    // Request body fields table
    const bodyParam = params.find((p) => p.in === "body");
    if (bodyParam?.schema) {
      let schema;
      try {
        schema = this.resolver.resolveSchema(bodyParam.schema);
      } catch {
        schema = undefined;
      }

      if (schema?.properties && Object.keys(schema.properties).length > 0) {
        lines.push("", "## Request Body", "", "| Field | Type | Example |", "| --- | --- | --- |");
        for (const [key, propOrRef] of Object.entries(schema.properties)) {
          let prop;
          try {
            prop = "$ref" in propOrRef ? this.resolver.resolveSchema(propOrRef) : propOrRef;
          } catch {
            continue;
          }
          const type = prop.type ?? "object";
          const example = prop.example !== undefined ? String(prop.example) : prop.enum?.[0] ?? "";
          lines.push(`| ${key} | ${type} | ${example} |`);
        }
      }
    }

    // Responses table
    if (operation.responses && Object.keys(operation.responses).length > 0) {
      lines.push("", "## Responses", "", "| Status | Description |", "| --- | --- |");
      for (const [status, responseOrRef] of Object.entries(operation.responses)) {
        let response;
        try {
          response = this.resolver.resolveResponse(responseOrRef);
        } catch {
          continue;
        }
        lines.push(`| ${status} | ${response.description ?? ""} |`);
      }
    }

    if (lines.length === 0) return undefined;
    return lines.join("\n");
  }
}
