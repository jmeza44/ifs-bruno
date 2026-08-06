# ifs-bruno

A CLI tool to import IFS Cloud OData endpoints into [Bruno](https://www.usebruno.com/) collections. It reads IFS OpenAPI specs — either from a local file or directly from a live IFS instance — and generates Bruno request files ready to use, through an interactive terminal UI.

The [web UI](./ui/README.md) covers the same workflow and additionally supports [Postman](https://www.postman.com/) collections.

## Prerequisites

- **Node.js 18+** — required to run the CLI
- **[Bruno](https://www.usebruno.com/) desktop app** — required to open and use the generated collections
- **IFS Cloud instance with Keycloak authentication** — only required for the live fetch flow (`ifs-bruno add --profile`); not needed if you import from local spec files (`ifs-bruno add --spec`)

## Installation

```bash
pnpm install -g ifs-bruno
```

Or with pnpm:

```bash
pnpm add -g ifs-bruno
```

## Workflow

### 1. Create a collection

Scaffolds a new Bruno collection with a pre-configured Keycloak auth request and a default environment. The CLI only scaffolds Bruno collections — to create a Postman collection instead, use the [web UI](./ui/README.md).

```bash
ifs-bruno init
```

The CLI will prompt for each value interactively. You can also pass them as flags to skip the prompts:

```bash
ifs-bruno init --name IFS --host https://your-env.ifs.cloud --realm your-realm --client-id IFS_postman
```

| Flag          | Description                                       |
| ------------- | ------------------------------------------------- |
| `--name`      | Collection name and output folder                 |
| `--host`      | IFS Cloud base URL, e.g. `https://acme.ifs.cloud` |
| `--realm`     | Keycloak realm name                               |
| `--client-id` | OAuth2 client ID, e.g. `IFS_postman`              |
| `--output`    | Output folder path (defaults to `--name`)         |

**Generated structure:**

```
my-collection/
  opencollection.yml        ← Bruno collection manifest (includes native OAuth2 auth config)
  .gitignore
  environments/
    default.yml             ← baseHost, keycloakBasePath, realm, clientId, clientSecret
```

> **Note:** After running `init`, open the collection in Bruno, go to the `default` environment, and set `clientSecret` manually. It is intentionally not written to disk.

### 2. Set up a profile (required for live fetch)

If you want to browse and import endpoints directly from a live IFS instance, save a profile with your connection details:

```bash
ifs-bruno profile add my-env --host https://your-env.ifs.cloud --realm your-realm --client-id IFS_postman
```

| Flag                     | Description                                       |
| ------------------------ | -------------------------------------------------- |
| `--host`                 | IFS Cloud base URL, e.g. `https://acme.ifs.cloud` |
| `--realm`                | Keycloak realm name                                |
| `--client-id`            | OAuth2 client ID, e.g. `IFS_postman`               |
| `--client-secret`        | OAuth2 client secret                               |
| `--keycloak-base-path`   | Keycloak base path (defaults to `/auth`)           |

Omit the flags to be prompted interactively instead.

Profiles are stored at `~/.ifs-bruno/config.json`. You can manage them with:

```bash
ifs-bruno profile list
ifs-bruno profile delete <name>
```

Skip this step if you only need to import from local spec files.

### 3. Authenticate

Nothing to run manually — the collection's auth is configured as native OAuth2 (`client_credentials`) in Bruno. Bruno fetches and refreshes the token automatically the first time you send a request, as long as `clientSecret` is set in the `default` environment.

### 4. Import endpoints

Parse an IFS OpenAPI spec and pick which endpoints to add to the collection. This opens an interactive terminal UI to search projections/endpoints and select the ones you want.

**From a local spec file:**

```bash
ifs-bruno add --spec ./WorkTaskHandling.json --collection ./my-collection
```

**Directly from a live IFS instance** (requires a saved profile):

```bash
ifs-bruno add --profile my-env --collection ./my-collection
```

If `--collection` is omitted, the TUI shows a list of previously used collections to pick from (or lets you type a new path).

| Flag                 | Description                                 |
| -------------------- | ------------------------------------------- |
| `--spec`, `-s`       | Path to a local IFS OpenAPI spec (JSON)     |
| `--profile`, `-p`    | Name of a saved profile to fetch specs live |
| `--collection`, `-c` | Path to the Bruno collection folder         |

> **Note:** `add` currently writes Bruno collections only, even when pointed at a Postman one. To import into a Postman collection, use the [web UI](./ui/README.md).

Re-running `add` on an already-imported endpoint **updates it in place** instead of creating a duplicate.

## Useful commands

| Command          | Description                                  |
| ---------------- | --------------------------------------------- |
| `pnpm dev -- <args>` | Run the CLI from source, e.g. `pnpm dev -- init` |
| `pnpm build`     | Build the CLI to `dist/`                     |
| `pnpm typecheck` | Type-check without emitting files            |
| `pnpm format`    | Format the codebase with Prettier            |

## Contributing

Found a bug or want to add a feature? Open an issue or a pull request. For local setup and the release process, see [CONTRIBUTING.md](./CONTRIBUTING.md).
