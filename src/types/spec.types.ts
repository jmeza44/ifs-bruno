export interface SwaggerSpec {
  swagger: "2.0";
  info: {
    title: string;
    description?: string;
    version: string;
  };
  host: string;
  basePath: string;
  tags?: Array<{ name: string; description?: string }>;
  paths: Record<string, PathItem>;
  definitions?: Record<string, SchemaObject>;
  parameters?: Record<string, ParameterObject>;
  responses?: Record<string, ResponseObject>;
}

export interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  patch?: Operation;
  delete?: Operation;
}

export interface Operation {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  produces?: string[];
  parameters?: Array<ParameterObject | RefObject>;
  responses?: Record<string, ResponseObject | RefObject>;
}

export interface ParameterObject {
  name: string;
  in: "body" | "query" | "header" | "path" | "formData";
  description?: string;
  required?: boolean;
  type?: string;
  schema?: SchemaObject | RefObject;
  items?: SchemaObject & { enum?: string[] };
  enum?: string[];
  collectionFormat?: string;
  uniqueItems?: boolean;
  "x-example"?: unknown;
}

export interface SchemaObject {
  type?: string;
  properties?: Record<string, SchemaObject | RefObject>;
  example?: unknown;
  enum?: string[];
  $ref?: string;
  title?: string;
  allOf?: Array<SchemaObject | RefObject>;
}

export interface RefObject {
  $ref: string;
}

export interface ResponseObject {
  description?: string;
  schema?: SchemaObject | RefObject;
}
