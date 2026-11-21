# ifs-bruno

CLI and Web UI tool to import IFS Cloud OpenAPI endpoints into Bruno (OpenCollection YAML) and Postman collections.

## Commands

- `pnpm dev -- <init|add|profile> ...`: Run the CLI from source (`tsx`).
- `pnpm typecheck`: Run TypeScript check (`tsc --noEmit`); primary automated check (no unit test suite).
- `pnpm build`: Bundle CLI (`tsup` to `dist/`).
- `pnpm format`: Format codebase with Prettier.
- UI (`ui/`, Bun): `bun run dev` (server), `bun run build` (SPA bundle to `ui/dist-spa`).

## Layout

- `src/core/`: Spec parsing, `$ref` resolution, `CanonicalRequest` IR, writers (`bruno-writer.ts`, `postman-writer.ts`).
- `src/clients/{bruno,postman}`: Output format collection clients implementing `CollectionClient`.
- `src/commands/`, `src/tui/`: CLI commands and Ink TUI.
- `ui/server/` + `ui/frontend/`: Local web workspace (Bun server + React SPA).
- `docs/openapi/`: Sample IFS specs for testing.

## Gotchas & Rules

- **Endpoint Identity**: Must include the Projection name; `method:path` alone is not unique across IFS Projections.
- **UI API Types**: `ui/frontend/src/lib/api.ts` lacks runtime response validation; keep inline `Promise<T>` types aligned with `lib/types.ts`.
- **Commits**: Conventional Commits only; never add AI attribution / Co-Authored-By.
