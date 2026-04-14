# ifs-insomnia

A CLI tool to import IFS OpenAPI endpoints directly into Bruno collections.

## Development

To work on the tool itself, use `tsx` to run from source directly — no build step needed.

```bash
pnpm dev -- init
pnpm dev -- add --spec <path> --collection <path>
```

Make a change, run the command, see the result immediately.

## Prerequisites

- Node.js 18+
- [Bruno](https://www.usebruno.com/) desktop app
- An IFS Cloud instance with Keycloak authentication

## Installation

```bash
pnpm install
pnpm build
pnpm link --global
```

## Usage

### `init` — Create a new Bruno collection

Scaffolds a new Bruno collection with a pre-configured Keycloak Auth request and a default environment ready to use.

```bash
ifs-insomnia init [options]
```

| Option | Description |
|---|---|
| `--name` | Collection name (e.g. `IFS`) |
| `--host` | IFS host URL (e.g. `https://your-env.ifs.cloud`) |
| `--realm` | Keycloak realm name |
| `--clientId` | OAuth client ID |
| `--clientSecret` | OAuth client secret |
| `--output` | Output folder name (defaults to collection name) |

If no options are provided, the CLI will prompt for each value interactively.

**Generated structure:**

```
my-collection/
  opencollection.yml      ← Bruno collection manifest
  .gitignore
  environments/
    default.yml           ← baseHost, realm, clientId, clientSecret, accessToken
  Auth.yml                ← Keycloak client_credentials request
```

### `add` — Import endpoints from an IFS OpenAPI spec

Parses an IFS OpenAPI spec and lets you select which endpoints to add to an existing Bruno collection. Each endpoint becomes its own `.yml` file inside a subfolder named after the spec.

```bash
ifs-insomnia add --spec <path> --collection <path>
```

| Argument | Description |
|---|---|
| `--spec` | Path to the IFS OpenAPI spec (YAML or JSON) |
| `--collection` | Path to the Bruno collection folder |

OData path parameters (e.g. `{TaskSeq}`) are mapped to `{{TaskSeq}}` in the URL and added as `runtime.variables` in the request file — so you can fill them in directly in Bruno before sending.

Re-running `add` on an already-imported endpoint updates it in place rather than creating a duplicate.

## Workflow

1. Run `ifs-insomnia init` and open the generated folder in Bruno.
2. Select the `default` environment and run **Auth** — `accessToken` will be set automatically.
3. Run `ifs-insomnia add` to import endpoints from any IFS OpenAPI spec.
4. Fill in the runtime variables (path params) directly in each request and send.
