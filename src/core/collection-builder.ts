import type { BrunoCollection, BrunoEnvironment, BrunoRequest } from "../types/bruno.types";

export interface InitOptions {
  host: string;
  realm: string;
  clientId: string;
  name: string;
}

const COLLECTION_PRE_REQUEST_SCRIPT = `
const token = bru.getEnvVar("accessToken");

if (token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
    if (expiresIn > 60) return;
  } catch (_) {
    // malformed token — fall through to re-authenticate
  }
}

const base = bru.getEnvVar("baseHost");
const keycloakPath = bru.getEnvVar("keycloakBasePath") ?? "/auth";
const realm = bru.getEnvVar("realm");
const clientId = bru.getEnvVar("clientId");
const clientSecret = bru.getEnvVar("clientSecret");

const body = [
  "grant_type=client_credentials",
  \`client_id=\${encodeURIComponent(clientId)}\`,
  \`client_secret=\${encodeURIComponent(clientSecret)}\`,
  "scope=openid%20microprofile-jwt",
].join("&");

await bru.sendRequest(
  {
    method: "POST",
    url: \`\${base}\${keycloakPath}/realms/\${realm}/protocol/openid-connect/token\`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    data: body,
  },
  (err, res) => {
    if (err) throw new Error("Auto-auth failed: " + err.message);
    bru.setEnvVar("accessToken", res.data.access_token);
  }
);
`.trim();

export function buildCollectionManifest(name: string): BrunoCollection {
  return {
    opencollection: "1.0.0",
    info: { name },
    request: {
      auth: {
        type: "bearer",
        token: "{{accessToken}}",
      },
      scripts: [
        {
          type: "before-request",
          code: COLLECTION_PRE_REQUEST_SCRIPT,
        },
      ],
    },
    bundled: false,
    extensions: {
      bruno: {
        ignore: ["node_modules", ".git"],
      },
    },
  };
}

export function buildEnvironment(options: InitOptions): BrunoEnvironment {
  return {
    name: "default",
    variables: [
      { name: "baseHost", value: options.host },
      { name: "realm", value: options.realm },
      { name: "clientId", value: options.clientId },
      { name: "clientSecret", secret: true as const },
      { name: "keycloakBasePath", value: "/auth" },
      { name: "accessToken", secret: true as const },
    ],
  };
}

export function buildAuthRequest(): BrunoRequest {
  return {
    info: {
      name: "Auth",
      type: "http",
      seq: 1,
    },
    http: {
      method: "POST",
      url: "{{baseHost}}{{keycloakBasePath}}/realms/{{realm}}/protocol/openid-connect/token",
      auth: "none",
      body: {
        type: "form-urlencoded",
        data: [
          { name: "grant_type", value: "client_credentials" },
          { name: "scope", value: "openid microprofile-jwt" },
          { name: "client_id", value: "{{clientId}}" },
          { name: "client_secret", value: "{{clientSecret}}" },
        ],
      },
    },
    runtime: {
      scripts: [
        {
          type: "after-response",
          code: "bru.setEnvVar(\"accessToken\", res.body.access_token);",
        },
      ],
    },
    settings: {
      encodeUrl: true,
      timeout: 0,
      followRedirects: true,
      maxRedirects: 5,
    },
  };
}

export const GITIGNORE_CONTENT = `# Secrets
.env*

# Dependencies
node_modules

# OS files
.DS_Store
Thumbs.db
`;
