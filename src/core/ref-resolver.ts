import type { SwaggerSpec, SchemaObject, ParameterObject, RefObject } from "../types/spec.types";

const SKIP_KEYS = new Set(["luname", "keyref", "objstate", "objkey", "@odata.etag"]);

export class RefResolver {
  constructor(private spec: SwaggerSpec) {}

  resolveRef(ref: string): SchemaObject | ParameterObject {
    if (!ref.startsWith("#/")) {
      throw new Error(`External $ref not supported: ${ref}`);
    }
    const parts = ref.slice(2).split("/");
    let node: unknown = this.spec;
    for (const part of parts) {
      const decoded = part.replace(/~1/g, "/").replace(/~0/g, "~");
      node = (node as Record<string, unknown>)[decoded];
      if (node === undefined) {
        throw new Error(`Could not resolve $ref: ${ref}`);
      }
    }
    return node as SchemaObject | ParameterObject;
  }

  resolveParameter(paramOrRef: ParameterObject | RefObject): ParameterObject {
    if ("$ref" in paramOrRef) {
      return this.resolveRef(paramOrRef.$ref) as ParameterObject;
    }
    return paramOrRef;
  }

  resolveSchema(schemaOrRef: SchemaObject | RefObject): SchemaObject {
    if ("$ref" in schemaOrRef && schemaOrRef.$ref !== undefined) {
      return this.resolveRef(schemaOrRef.$ref) as SchemaObject;
    }
    return schemaOrRef as SchemaObject;
  }

  buildExampleBody(schema: SchemaObject): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    if (!schema.properties) return result;

    for (const [key, propOrRef] of Object.entries(schema.properties)) {
      if (SKIP_KEYS.has(key.toLowerCase())) continue;

      let prop: SchemaObject;
      try {
        prop = "$ref" in propOrRef ? this.resolveSchema(propOrRef) : propOrRef as SchemaObject;
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
