import type {
  CanonicalRequest,
  CanonicalHeader,
  CanonicalParam,
  CanonicalBody,
} from './request/canonical-request';
import { RefResolver } from './ref-resolver';
import { HAS_BODY_METHODS, NEEDS_XSRF_METHODS } from './constants';
import type { SwaggerSpec, Operation, ParameterObject } from '@types-app/spec.types';

function extractPathParams(pathTemplate: string): string[] {
  const matches = pathTemplate.match(/\{([^}]+)\}/g) ?? [];
  return matches.map((m) => m.slice(1, -1));
}

function convertPathParams(pathTemplate: string): string {
  return pathTemplate.replace(/\{([^}]+)\}/g, '{{$1}}');
}

export class RequestBuilder {
  private resolver: RefResolver;

  constructor(private spec: SwaggerSpec) {
    this.resolver = new RefResolver(spec);
  }

  build(pathTemplate: string, method: string, operation: Operation, seq: number): CanonicalRequest {
    const operationId = operation.operationId ?? '';
    const name = operationId || operation.summary || pathTemplate.trim();

    const resolvedParams = (operation.parameters ?? []).map((p) =>
      this.resolver.resolveParameter(p as ParameterObject),
    );

    const pathParams = extractPathParams(pathTemplate);
    const queryParams = this.buildQueryParams(resolvedParams);
    const headers = this.buildHeaders(method, resolvedParams);
    const body = HAS_BODY_METHODS.has(method.toLowerCase())
      ? this.buildBody(method, resolvedParams)
      : undefined;

    const basePath = convertPathParams(pathTemplate);
    const queryString = queryParams
      .map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`)
      .join('&');
    const url = `{{baseHost}}${this.spec.basePath}${basePath}${queryString ? `?${queryString}` : ''}`;

    const description = this.buildDocs(operation, resolvedParams);

    return {
      name,
      operationId,
      method: method.toUpperCase(),
      url,
      pathParams,
      headers,
      queryParams,
      ...(body ? { body } : {}),
      ...(description ? { description } : {}),
      order: seq,
    };
  }

  private buildHeaders(method: string, params: ParameterObject[]): CanonicalHeader[] {
    const headers: CanonicalHeader[] = [];
    const m = method.toLowerCase();
    const isWriteMethod = m === 'patch' || m === 'put';

    for (const param of params) {
      if (param.in !== 'header') continue;
      const isIfMatch = param.name.toLowerCase() === 'if-match';
      headers.push({
        name: param.name,
        value: isIfMatch && isWriteMethod ? '{{ifMatch}}' : '',
        enabled: true,
      });
    }

    if (NEEDS_XSRF_METHODS.has(m)) {
      headers.push({
        name: 'X-XSRF-TOKEN',
        value: '{{xsrfToken}}',
        enabled: true,
      });
    }

    return headers;
  }

  private buildBody(method: string, params: ParameterObject[]): CanonicalBody | undefined {
    void method;
    const bodyParam = params.find((p) => p.in === 'body');
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
      type: 'json',
      content: JSON.stringify(exampleObj, null, 2),
    };
  }

  private buildQueryParams(params: ParameterObject[]): CanonicalParam[] {
    return params
      .filter((p) => p.in === 'query')
      .map((p) => ({
        name: p.name,
        value: p.type === 'array' && p.items?.enum ? p.items.enum.join(',') : '',
        enabled: true,
      }));
  }

  private buildDocs(operation: Operation, params: ParameterObject[]): string | undefined {
    const lines: string[] = [];

    // Title + description
    const title = (operation.summary ?? operation.operationId ?? '').replace(/\.+$/, '');
    if (title) lines.push(`# ${title}`);
    if (operation.description && operation.description !== operation.summary) {
      lines.push('', operation.description);
    }

    // Parameters table (all except body — body gets its own section)
    const nonBodyParams = params.filter((p) => p.in !== 'body');
    if (nonBodyParams.length > 0) {
      lines.push(
        '',
        '## Parameters',
        '',
        '| Name | In | Type | Required | Description |',
        '| --- | --- | --- | --- | --- |',
      );
      for (const p of nonBodyParams) {
        const type = p.type ?? (p.schema ? 'object' : '');
        const required = p.required ? 'true' : 'false';
        const description = p.description ?? '';
        lines.push(`| ${p.name} | ${p.in} | ${type} | ${required} | ${description} |`);
      }

      // Enum sections for array params with items.enum
      for (const p of nonBodyParams) {
        if (p.type === 'array' && p.items?.enum && p.items.enum.length > 0) {
          lines.push('', `## ${p.name} values`, '', '| Value |', '| --- |');
          for (const value of p.items.enum) {
            lines.push(`| ${value} |`);
          }
        }
      }
    }

    // Request body fields table
    const bodyParam = params.find((p) => p.in === 'body');
    if (bodyParam?.schema) {
      let schema;
      try {
        schema = this.resolver.resolveSchema(bodyParam.schema);
      } catch {
        schema = undefined;
      }

      if (schema?.properties && Object.keys(schema.properties).length > 0) {
        lines.push('', '## Request Body', '', '| Field | Type | Example |', '| --- | --- | --- |');
        for (const [key, propOrRef] of Object.entries(schema.properties)) {
          let prop;
          try {
            prop = '$ref' in propOrRef ? this.resolver.resolveSchema(propOrRef) : propOrRef;
          } catch {
            continue;
          }
          const type = prop.type ?? 'object';
          const example =
            prop.example !== undefined ? String(prop.example) : (prop.enum?.[0] ?? '');
          lines.push(`| ${key} | ${type} | ${example} |`);
        }
      }
    }

    // Responses table
    if (operation.responses && Object.keys(operation.responses).length > 0) {
      lines.push('', '## Responses', '', '| Status | Description |', '| --- | --- |');
      for (const [status, responseOrRef] of Object.entries(operation.responses)) {
        let response;
        try {
          response = this.resolver.resolveResponse(responseOrRef);
        } catch {
          continue;
        }
        lines.push(`| ${status} | ${response.description ?? ''} |`);
      }
    }

    if (lines.length === 0) return undefined;
    return lines.join('\n');
  }
}
