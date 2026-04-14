export interface BrunoCollection {
  opencollection: "1.0.0";
  info: {
    name: string;
  };
  bundled: false;
  auth?: {
    mode: "bearer";
    bearer: {
      token: string;
    };
  };
  script?: {
    req?: string;
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
    body?: BrunoBody;
  };
  headers?: BrunoHeader[];
  script?: {
    pre?: string;
    res?: string;
  };
  runtime?: {
    variables: BrunoVariable[];
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

export interface BrunoRequestSettings {
  encodeUrl: boolean;
  timeout: number;
  followRedirects: boolean;
  maxRedirects: number;
}
