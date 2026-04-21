export interface BrunoScript {
  type: "before-request" | "after-response" | "tests";
  code: string;
}

export interface BrunoCollection {
  opencollection: "1.0.0";
  info: {
    name: string;
  };
  bundled: false;
  request?: {
    auth?: {
      type: "bearer";
      token: string;
    };
    scripts?: BrunoScript[];
  };
  extensions: {
    bruno: {
      ignore: string[];
    };
  };
}

export interface BrunoEnvironment {
  name: string;
  variables: BrunoVariable[];
}

export type BrunoVariable =
  | { name: string; value: string }
  | { name: string; secret: true };

export interface BrunoRequest {
  info: {
    name: string;
    type: "http";
    seq: number;
  };
  http: {
    method: string;
    url: string;
    auth?: "bearer" | "inherit" | "none";
    headers?: BrunoHeader[];
    params?: BrunoParam[];
    body?: BrunoBody;
  };
  headers?: BrunoHeader[];
  runtime?: {
    scripts?: BrunoScript[];
    variables?: BrunoVariable[];
  };
  settings: BrunoRequestSettings;
}

export interface BrunoHeader {
  name: string;
  value: string;
  enabled: boolean;
}

export type BrunoBody =
  | { type: "json"; data: string }
  | { type: "form-urlencoded"; data: BrunoFormParam[] };

export interface BrunoFormParam {
  name: string;
  value: string;
}

export interface BrunoParam {
  name: string;
  value: string;
  type: "query";
}

export interface BrunoRequestSettings {
  encodeUrl: boolean;
  timeout: number;
  followRedirects: boolean;
  maxRedirects: number;
}
