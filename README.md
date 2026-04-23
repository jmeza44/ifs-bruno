# ifs-bruno

A CLI tool to import IFS Cloud OData endpoints into [Bruno](https://www.usebruno.com/) collections.

It reads IFS OpenAPI specs — either from a local file or directly from a live IFS instance — and generates Bruno request files ready to use.

## Prerequisites

- Node.js 18+
- [Bruno](https://www.usebruno.com/) desktop app
- An IFS Cloud instance with Keycloak authentication

## Installation

```bash
npm install -g ifs-bruno
```

Or with pnpm:

```bash
pnpm add -g ifs-bruno
```

## Workflow

The typical flow has three steps:

### 1. Create a collection

Scaffolds a new Bruno collection with a pre-configured Keycloak auth request and a default environment.

```bash
ifs-bruno init
```

The CLI will prompt for each value interactively. You can also pass them as flags to skip the prompts:

```bash
ifs-bruno init --name IFS --host https://your-env.ifs.cloud --realm your-realm --client-id IFS_postman --output my-collection
```

| Flag | Description |
|---|---|
| `--name` | Collection name |
| `--host` | IFS Cloud host URL |
| `--realm` | Keycloak realm name |
| `--client-id` | OAuth client ID |
| `--output` | Output folder (defaults to `--name`) |

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

### 2. Authenticate

Open the collection in Bruno, select the `default` environment, and run the **Auth** request. This sets `accessToken` automatically — all subsequent requests use it via the environment variable.

### 3. Import endpoints

Parse an IFS OpenAPI spec and pick which endpoints to add to the collection. Each endpoint becomes its own `.yml` file inside a subfolder named after the spec.

**From a local spec file:**

```bash
ifs-bruno add --spec ./WorkTaskHandling.json --collection ./my-collection
```

**Directly from a live IFS instance** (requires a saved profile — see below):

```bash
ifs-bruno add --profile my-env --collection ./my-collection
```

| Flag | Description |
|---|---|
| `--spec`, `-s` | Path to a local IFS OpenAPI spec (JSON or YAML) |
| `--profile`, `-p` | Name of a saved IFS profile to fetch specs live |
| `--collection`, `-c` | Path to the Bruno collection folder |

The CLI shows a searchable list of available endpoints. Select the ones you want and confirm — the files are written immediately.

Re-running `add` on an already-imported endpoint **updates it in place** instead of creating a duplicate.

## Profiles

Profiles store your IFS connection details locally (`~/.ifs-bruno/config.json`) so you don't have to type them every time. They are required for the live-fetch flow (`--profile`).

```bash
# Save a new profile
ifs-bruno profile add

# List saved profiles
ifs-bruno profile list

# Delete a profile
ifs-bruno profile delete <name>
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
