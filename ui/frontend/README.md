# ifs-bruno UI — Frontend

React + TypeScript SPA for the [ifs-bruno](../../README.md) web UI. Talks to the `ui/server` backend via the `/api` proxy (see `vite.config.ts`). Built with Vite, Tailwind CSS v4, shadcn/radix-ui components, TanStack Query/Store for state.

## Prerequisites

- **Node.js 18+**
- **pnpm** — this workspace uses pnpm
- The `ui/server` backend running locally (requests to `/api` are proxied to it — see the root `ui/` folder)

## Get Started

The frontend has no data of its own — every screen calls the `/api/*` endpoints, which Vite proxies to the `ui/server` backend (see `vite.config.ts`). **Start the backend first, or the app will load with API calls failing.**

1. In `ui/`, start the backend:

   ```bash
   cd ../.. # to ui/
   pnpm dev
   ```

2. In a separate terminal, install frontend dependencies and start the dev server from `ui/frontend`:

   ```bash
   pnpm install
   pnpm dev
   ```

Vite will print the local URL (defaults to `http://localhost:5173`).

## Useful commands

| Command        | Description                                  |
| -------------- | --------------------------------------------- |
| `pnpm dev`     | Start the Vite dev server with HMR            |
| `pnpm build`   | Type-check and build for production (`../dist-spa`) |
| `pnpm preview` | Preview the production build locally          |
| `pnpm lint`    | Lint the codebase with ESLint                 |

## Contributing

Found a bug or want to add a feature? Open an issue or a pull request. Keep changes scoped, run `pnpm lint` before committing, and match the existing component/style conventions in `src/`.
