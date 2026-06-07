# ifs-bruno

A CLI tool to import IFS Cloud OData endpoints into [Bruno](https://www.usebruno.com/) collections.

It reads IFS OpenAPI specs — either from a local file or directly from a live IFS instance — and generates Bruno request files ready to use.

## Prerequisites

- **Node.js 18+** — required to run the CLI
- **[Bruno](https://www.usebruno.com/) desktop app** — required to open and use the generated collections
- **IFS Cloud instance with Keycloak authentication** — only required for the live fetch flow (`ifs-bruno add --profile`); not needed if you import from local spec files (`ifs-bruno add --spec`)

## Installation

```bash
npm install -g ifs-bruno
```

Or with pnpm:

```bash
pnpm add -g ifs-bruno
```

## Workflow

### 1. Create a collection

Scaffolds a new Bruno collection with a pre-configured Keycloak auth request and a default environment.

```bash
ifs-bruno init
```

The CLI will prompt for each value interactively. You can also pass them as flags to skip the prompts:

```bash
ifs-bruno init --name IFS --host https://your-env.ifs.cloud --realm your-realm --client-id IFS_postman
```

| Flag | Description |
|---|---|
| `--name` | Collection name and output folder |
| `--host` | IFS Cloud base URL, e.g. `https://acme.ifs.cloud` |
| `--realm` | Keycloak realm name |
| `--client-id` | OAuth2 client ID, e.g. `IFS_postman` |
| `--output` | Output folder path (defaults to `--name`) |

**Generated structure:**

```
my-collection/
  opencollection.yml        ← Bruno collection manifest
  .gitignore
  environments/
    default.yml             ← baseHost, realm, clientId, accessToken
  Auth.yml                  ← Keycloak client_credentials request
```

> **Note:** After running `init`, open the collection in Bruno, go to the `default` environment, and set `clientSecret` manually. It is intentionally not written to disk.

### 2. Set up a profile (required for live fetch)

If you want to browse and import endpoints directly from a live IFS instance, save a profile with your connection details:

```bash
ifs-bruno profile add
```

Profiles are stored at `~/.ifs-bruno/config.json`. You can manage them with:

```bash
ifs-bruno profile list
ifs-bruno profile delete <name>
```

Skip this step if you only need to import from local spec files.

### 3. Authenticate

Open the collection in Bruno, select the `default` environment, and run the **Auth** request. This sets `accessToken` automatically — all subsequent requests use it via the environment variable.

### 4. Import endpoints

Parse an IFS OpenAPI spec and pick which endpoints to add to the collection. Each endpoint becomes its own `.yml` file inside a subfolder named after the spec.

**From a local spec file:**

```bash
ifs-bruno add --spec ./WorkTaskHandling.json --collection ./my-collection
```

**Directly from a live IFS instance** (requires a saved profile):

```bash
ifs-bruno add --profile my-env --collection ./my-collection
```

| Flag | Description |
|---|---|
| `--spec`, `-s` | Path to a local IFS OpenAPI spec (JSON) |
| `--profile`, `-p` | Name of a saved profile to fetch specs live |
| `--collection`, `-c` | Path to the Bruno collection folder |

The CLI shows a searchable list of available projections and endpoints. Select the ones you want and confirm — the files are written immediately.

Re-running `add` on an already-imported endpoint **updates it in place** instead of creating a duplicate.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
