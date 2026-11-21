# Modular architecture: one engine, two interfaces

Objective: reorganize the repo so the CLI and the web UI are thin presentations over one shared engine, and the folder tree plus README make the project obvious at a glance.
Branch: new branch off `main` after `feat/switch-tui-to-use-ink` merges · Delivery: `ask-on-risk` · Test runner: none today (see D2).

## Specs

- **S1 — Modules.** The user's model: "hay 2 modulos de presentación, hay un modulo de consulta a IFS, hay un modulo de escritura en el sistema, y hay un modulo de lógica de procesamiento". Accepted additions from the analysis: an **application (use cases)** module shared by both presentations, and a **local state** module (profiles, secrets, preferences).
- **S2 — Obvious at a glance.** "Incluye una estuctura de archivos lógica. Nada más mirar y con el readme que sea obvio el proyecto." Top-level folders are named after what the project does, not after technical layers (`core`, `types`).
- **S3 — Dependency rule.** Presentations import only `use-cases/` (plus types). Use cases orchestrate the other modules. `openapi/` and `requests/` are pure: no `fetch`, no `fs`. Adapters (`ifs/`, `collections/`, `profiles/`) never import each other or a presentation.
- **S4 — One flow, one implementation.** Every action both interfaces offer (create collection, manage profiles, list projections, browse endpoints, import endpoints) is implemented once, in `use-cases/`.
- **S5 — No behavior change** except the CLI `add` bug that S4 fixes (D1). Every task keeps the CLI, the web server and the Bun executable working.

### Target structure

```
ifs-bruno/
├── README.md                     What it is, the two interfaces, the module map
├── src/                          Shared engine — everything both interfaces use
│   ├── use-cases/                [Application] one file per action the user can take
│   │   ├── create-collection.ts      CLI `init` + POST /collections
│   │   ├── list-collections.ts
│   │   ├── manage-profiles.ts        add / list / delete / test connection
│   │   ├── list-projections.ts
│   │   ├── browse-endpoints.ts       load spec → endpoint catalog / detail
│   │   └── import-endpoints.ts       load spec → build requests → write (picks Bruno/Postman)
│   ├── openapi/                  [Processing] understand IFS OpenAPI specs — pure
│   │   ├── openapi.types.ts          ← types/spec.types.ts
│   │   ├── parse-spec.ts             ← core/spec-loader.ts (parseSpec)
│   │   ├── ref-resolver.ts           ← core/ref-resolver.ts
│   │   ├── endpoint-catalog.ts       ← core/endpoint-list.ts
│   │   └── endpoint.types.ts         ← types/tool.types.ts
│   ├── requests/                 [Processing] endpoint → client-agnostic request — pure
│   │   ├── canonical-request.ts      ← core/request/canonical-request.ts
│   │   ├── request-builder.ts        ← core/request-builder.ts
│   │   └── request-rules.ts          ← core/constants.ts (HAS_BODY, NEEDS_XSRF, SKIP_KEYS)
│   ├── ifs/                      [Query IFS] obtain specs: from an IFS instance or an exported file
│   │   ├── ifs-api.ts                ← core/ifs-client.ts (projections, OpenAPI spec)
│   │   ├── token-provider.ts         ← core/token-provider.ts (+ fetchToken, see T2)
│   │   └── spec-file.ts              ← core/spec-loader.ts (loadSpec)
│   ├── collections/              [Write] create and update collections on disk
│   │   ├── collection-client.ts      ← core/collection/collection-client.ts (port)
│   │   ├── collection-registry.ts    ← core/collection/collection-registry.ts
│   │   ├── known-collections.ts      ← profile-store.ts (saveCollection, listCollections, base path)
│   │   ├── shared/                   ← core/shared/{yaml,collection-utils}.ts
│   │   ├── bruno/                    client, init, reader, writer, request-mapper, bruno.types.ts
│   │   └── postman/                  client, init, reader, writer, request-mapper, postman.types.ts
│   ├── profiles/                 [Local state] IFS connections, encrypted secrets, preferences
│   │   ├── profile-store.ts          ← profile-store.ts (profiles + secrets)
│   │   └── preferences.ts            ← profile-store.ts (getPreferences, savePreferences)
│   └── validation/
│       └── input-rules.ts            ← validate-args.ts (check* functions only)
├── cli/                          [Presentation] terminal — the npm package `ifs-bruno`
│   ├── index.ts                      ← src/index.ts (+ validate* wrappers that exit)
│   ├── commands/                     ← src/commands
│   ├── tui/                          ← src/tui
│   └── i18n/                         ← src/i18n
└── web/                          [Presentation] browser — ships as a Bun executable (← ui/)
    ├── server/                       handlers call use-cases only
    ├── frontend/                     React SPA
    └── build.ts                      Vite build → embedded → ifs-bruno-ui[.exe]
```

Path aliases follow the modules: `@use-cases/*`, `@openapi/*`, `@requests/*`, `@ifs/*`, `@collections/*`, `@profiles/*`, `@validation/*`. They replace `@core`, `@clients`, `@types-app` and `@tui` in both `tsconfig.json` and `ui/server/tsconfig.json`.

### Open decisions

- **D1** — The CLI `add` always writes with Bruno (`src/tui/AddFlow.tsx:343`). Moving it onto `import-endpoints` makes it write Postman collections too. This is the only intended behavior change. **Accepted (L4).**
- **D2** — There are no tests. Moves are checked with typecheck, build and smoke runs. Recommended: add `bun test` characterization tests for `use-cases/` in T5, before rewiring the presentations. They would be the first tests in the repo. **Accepted (L5):** fixtures come from `docs/openapi`, and the tests go through the use-case public functions.
- **D3** — Renaming `ui/` → `web/` and `src/{commands,tui,i18n,index.ts}` → `cli/` touches tsup, both tsconfigs, `ui/build.ts` paths and `release.yml` (Risk item 5). It is the step that makes S2 visible. Recommended: do it last, as its own commit. **Accepted (L6).**

### Checks (every task)

`pnpm typecheck` · `bunx tsc --noEmit -p ui/server` · `pnpm build` · `cd ui && bun run build` · smoke: `pnpm dev -- --help`, start the web server and load a profile, a projection and the endpoint list.

## Tasks

| ID | Specs | Task | Route | Status | Commit |
|---|---|---|---|---|---|
| T1 | S2, S3 | Move processing into `openapi/` and `requests/`; split `spec-loader` (parse → `openapi/`, file read → `ifs/`); add the new aliases | inline | pending | — |
| T2 | S2, S3 | Move `ifs/` and `collections/`; put Bruno/Postman types next to their adapters; settle whether `ifs-client.fetchToken` duplicates `KeycloakTokenFetcher` | inline | pending | — |
| T3 | S1, S3 | Split `profile-store.ts` into `profiles/` + `collections/known-collections.ts`, removing the profiles → collection-registry dependency | inline | pending | — |
| T4 | S3 | Move `check*` into `validation/input-rules.ts`; keep the `process.exit` wrappers in the CLI | inline | pending | — |
| T5 | S4 | Create `use-cases/` from the logic in `ui/server/handlers/*`; handlers become parse → use case → JSON (+ D2 tests) | inline | pending | — |
| T6 | S4, S5 | Rewire `commands/` and `tui/AddFlow.tsx` onto `use-cases/` (D1) | inline | pending | — |
| T7 | S2 | Move presentations to `cli/` and `web/`; update tsup, tsconfigs, `build.ts`, `release.yml` (D3, Risk item 5) | inline | pending | — |
| T8 | S2 | Rewrite the README opening and Architecture section around the module map; update `CLAUDE.md` | inline | pending | — |

Route evidence: each task is one understood refactor with no parallel independent units, so all are inline. T7 names a high-risk item and gets its own commit plus an independent verifier.

## Log

- **L1 (2026-11-20, user):** "Si voy a mantener ambos interfaces de acceso a las funcionalidades quiero que todo esté bien organizado. Como yo lo veo hay 2 modulos de presentación, hay un modulo de consulta a IFS, hay un modulo de escritura en el sistema, y hay un modulo de lógica de procesamiento. ¿Tú que ves?"
- **L2 (2026-11-20, user):** "Crea el plan. Incluye una estuctura de archivos lógica. Nada más mirar y con el readme que sea obvio el proyecto."
- **L3 (analysis):** The import flow is implemented twice, in `src/tui/AddFlow.tsx` and `ui/server/handlers/write.ts`, and the two have already diverged (D1). `core/` mixes pure processing with HTTP and disk I/O. `profile-store.ts` depends on `collection-registry`. Four web handlers import `src/validate-args.ts`. The frontend's `lib/types.ts` duplicates backend types; this is out of scope here.
- **L4 (2026-11-20, user):** "Sí". D1 accepted: CLI `add` will write Postman collections through `import-endpoints`.
- **L5 (2026-11-20, user):** "Sí". D2 accepted: `bun test` characterization tests for `use-cases/` in T5.
- **L6 (2026-11-20, user):** "Sí". D3 accepted: presentations move to `cli/` and `web/` in T7.
- **Next:** T1, once the user authorizes implementation and picks the base branch.
