# ifs-bruno UI

Web interface for [ifs-bruno](../README.md). Everything you can do with the `ifs-bruno` CLI — create collections, manage profiles, import endpoints — you can also do here, backed by the same core logic, plus [Postman](https://www.postman.com/) collection support that the CLI doesn't have yet. Use whichever fits: the CLI for quick, scriptable runs, the UI for a visual, guided flow.

- **`server/`** — Bun HTTP server exposing the `/api/*` endpoints and serving the built frontend
- **`frontend/`** — React + TypeScript SPA (see [frontend/README.md](./frontend/README.md))

## Prerequisites

- **[Bun](https://bun.sh/)** — required to run the server
- **Node.js 18+** and **pnpm** — required for the frontend
- **[Bruno](https://www.usebruno.com/) desktop app** or **[Postman](https://www.postman.com/) desktop app** — required to open and use the generated collections

## Get Started

The frontend has no data of its own — every screen calls `/api/*`, which is served by this backend. **In development, run both at the same time, in separate terminals:**

1. Start the backend (from `ui/`):

   ```bash
   pnpm dev
   ```

   This starts the Bun server and opens your browser automatically. In dev, the server has no frontend build to serve yet (that only exists after `pnpm build`), so you'll use it for the API only — Vite serves the actual UI.

2. Start the frontend (from `ui/frontend/`):

   ```bash
   pnpm install
   pnpm dev
   ```

   Vite proxies `/api` requests to the backend (see `frontend/vite.config.ts`). Open the URL Vite prints (defaults to `http://localhost:5173`).

## API endpoints

| Method | Route                        | Description                                                  |
| ------ | ----------------------------- | ------------------------------------------------------------ |
| GET    | `/api/health`                 | Healthcheck                                                  |
| GET    | `/api/profiles`                | List saved profiles                                          |
| POST   | `/api/profiles`                | Create/update a profile (`?overwrite=true`)                  |
| POST   | `/api/profiles/test`           | Test a connection without saving it                          |
| DELETE | `/api/profiles/:name`          | Delete a profile                                              |
| GET    | `/api/collections`             | List previously used collections (Bruno and Postman)          |
| GET    | `/api/collections/endpoints`   | List folders/endpoints already in a collection                |
| GET    | `/api/collections/details`     | Get details of a collection                                   |
| POST   | `/api/collections/select`      | Mark an existing collection as used                            |
| POST   | `/api/collections/init`        | Create a new collection (`format: 'bruno' \| 'postman'`)      |
| POST   | `/api/projections`             | List IFS projections available to a profile                   |
| POST   | `/api/spec/remote`             | Load an OpenAPI spec from a live IFS instance                 |
| POST   | `/api/spec/local`               | Load an OpenAPI spec from a local file                         |
| POST   | `/api/spec/entry`               | Get details of one endpoint from the last loaded spec          |
| POST   | `/api/write`                    | Write the selected requests (Bruno or Postman, per collection) |
| GET    | `/api/preferences`              | Read preferences (e.g. `collectionsBasePath`)                  |
| PATCH  | `/api/preferences`              | Update preferences                                              |

## Useful commands

| Command      | Description                                                        |
| ------------ | -------------------------------------------------------------------- |
| `pnpm dev`   | Start the backend server                                            |
| `pnpm build` | Build the frontend, then compile a standalone `ifs-bruno-ui` executable (see `build.ts`) |

## Contributing

Found a bug or want to add a feature? Open an issue or a pull request. When touching both sides, keep the backend (`server/`) and frontend (`frontend/`) running together locally so you can verify the full flow, not just one half.
