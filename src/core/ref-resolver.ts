import type {
  SwaggerSpec,
  SchemaObject,
  ParameterObject,
  ResponseObject,
  RefObject,
} from '@types-app/spec.types';
import { SKIP_KEYS } from './constants';

export class RefResolver {
  constructor(private spec: SwaggerSpec) {}

  resolveRef(ref: string): SchemaObject | ParameterObject {
    if (!ref.startsWith('#/')) {
      throw new Error(`External $ref not supported: ${ref}`);
    }
    const parts = ref.slice(2).split('/');
    let node: unknown = this.spec;
    for (const part of parts) {
      const decoded = part.replace(/~1/g, '/').replace(/~0/g, '~');
      node = (node as Record<string, unknown>)[decoded];
      if (node === undefined) {
        throw new Error(`Could not resolve $ref: ${ref}`);
      }
    }
    return node as SchemaObject | ParameterObject;
  }

  resolveParameter(paramOrRef: ParameterObject | RefObject): ParameterObject {
    if ('$ref' in paramOrRef) {
      return this.resolveRef(paramOrRef.$ref) as ParameterObject;
    }
    return paramOrRef;
  }

  resolveSchema(schemaOrRef: SchemaObject | RefObject): SchemaObject {
    return this.resolveSchemaDeep(schemaOrRef, new Set());
  }

  /**
   * Resolves `$ref`s recursively through `properties` and `items` — deep enough
   * to expand OData's `{ value: { type: array, items: { $ref } } }` collection
   * wrapper down to each item's own referenced sub-schemas (e.g. an enum type
   * on one of its fields), which in practice bottoms out within 2-3 hops in IFS
   * specs. `visitedRefs` guards against circular $ref chains: if a schema was
   * already expanded earlier in the current chain, it's returned unresolved
   * instead of recursing again — belt-and-suspenders, since no cycles have
   * been found in IFS specs surveyed so far, but this is spec-driven data from
   * a remote server, not something we control.
   */
  private resolveSchemaDeep(schemaOrRef: SchemaObject | RefObject, visitedRefs: Set<string>): SchemaObject {
    let schema: SchemaObject;
    if ('$ref' in schemaOrRef && schemaOrRef.$ref !== undefined) {
      if (visitedRefs.has(schemaOrRef.$ref)) return schemaOrRef as SchemaObject;
      visitedRefs = new Set(visitedRefs).add(schemaOrRef.$ref);
      try {
        schema = this.resolveRef(schemaOrRef.$ref) as SchemaObject;
      } catch {
        return schemaOrRef as SchemaObject;
      }
    } else {
      schema = schemaOrRef as SchemaObject;
    }

    const properties = schema.properties
      ? Object.fromEntries(
          Object.entries(schema.properties).map(([key, propOrRef]) => [
            key,
            this.resolveSchemaDeep(propOrRef, visitedRefs),
          ]),
        )
      : undefined;

    const items = schema.items ? this.resolveSchemaDeep(schema.items, visitedRefs) : undefined;

    if (!properties && !items) return schema;
    return { ...schema, ...(properties && { properties }), ...(items && { items }) };
  }

  resolveResponse(responseOrRef: ResponseObject | RefObject): ResponseObject {
    if ('$ref' in responseOrRef && responseOrRef.$ref !== undefined) {
      return this.resolveRef(responseOrRef.$ref) as ResponseObject;
    }
    return responseOrRef as ResponseObject;
  }

  buildExampleBody(schema: SchemaObject): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    if (!schema.properties) return result;

    for (const [key, propOrRef] of Object.entries(schema.properties)) {
      if (SKIP_KEYS.has(key.toLowerCase())) continue;

      let prop: SchemaObject;
      try {
        prop = '$ref' in propOrRef ? this.resolveSchema(propOrRef) : (propOrRef as SchemaObject);
      } catch {
        continue;
      }

      if (prop.example !== undefined) {
        result[key] = prop.example;
      } else if (prop.enum && prop.enum.length > 0) {
        result[key] = prop.enum[0];
      }
    }

    return result;
  }
}
