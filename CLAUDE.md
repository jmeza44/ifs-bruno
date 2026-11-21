# ifs-bruno

Imports IFS OpenAPI endpoints into Bruno (OpenCollection YAML) and Postman collections.

**Direction:** the web UI (`ui/`) is the primary product; the CLI is secondary. New features target the UI first, with logic living in `src/core` so both can reuse it.

## Commands

- `pnpm dev -- <init|add|profile> ...` — run the CLI from source (tsx)
- `pnpm typecheck` — the only automated check; there is no test suite
- `pnpm build` — tsup bundle to `dist/`
- `pnpm format` — Prettier (single quotes, 100 cols)
- UI (`ui/`, Bun): `bun run dev` (server), `bun run build` (Vite SPA → embedded into a standalone `ui/dist/ifs-bruno-ui[.exe]` via `bun build --compile`). The executable is the UI's distribution channel; npm ships only the CLI.

## Layout

- `src/core` — spec parsing, `$ref` resolution, collection/request building (client-agnostic)
- `src/clients/{bruno,postman}` — output-format adapters
- `src/commands`, `src/tui` — CLI commands and Ink TUI
- `ui/server` + `ui/frontend` — local web workspace (React SPA)
- `docs/openapi` — sample IFS specs for manual testing

## Gotchas

- Endpoint identity must include the Projection name; `method:path` is not unique across IFS Projections.
- `ui/frontend/src/lib/api.ts` has no runtime response validation; keep inline `Promise<T>` types aligned with `lib/types.ts`.
- Conventional Commits; no AI attribution in commits.
