# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Interactive terminal UI rewritten using Ink 7 and React 19, with dynamic endpoint truncation.
- Architectural decoupling through `CanonicalRequest` Intermediate Representation (IR) and modular `CollectionClient` interface.
- Postman v3 collection client and writer support for generating filesystem-YAML Postman collections.
- AES-256-GCM encryption at rest for stored profile client secrets using a machine-local key (`~/.ifs-bruno/.machine-key`).
- Direct OpenAPI spec file content upload endpoint (`POST /api/spec/upload`) in the Web UI backend.
- Enhanced Web UI experience:
  - First-run welcome screen with contextual empty states.
  - Word-segment fuzzy matching and relevance ranking for projections and endpoints.
  - Virtualized list rendering for smooth scrolling over large projection catalogs.
  - Collapsible, colored JSON tree viewer for response schema inspection.
  - Composite-key path collapsing and OData tier classification in endpoint trees.
- Decorator-based `TokenProvider` for in-memory IFS OAuth token caching.

### Fixed

- Recursive resolution of nested `$ref` definitions in OpenAPI schemas.
- Endpoint identity scoped to projection name to avoid collision across different IFS projections with identical paths.
- Sanitized fuzzy search queries by stripping non-alphanumeric characters.
- Exposed `realm`, `clientId`, and `keycloakBasePath` in collection details API response.

## [1.3.0] - 2026-04-22

### Added

- `add` command now remembers previously used collections in `~/.ifs-bruno/config.json`
- When `--collection` is omitted, shows an interactive list of saved collections ordered by last used date
- Each collection option displays its last used date/time in the system locale
- "Other..." option available to enter a new path manually
- Collections are validated against disk before being shown (must have `opencollection.yml`)
- New collection paths are saved automatically after a successful `add`

## [1.2.0] - 2026-04-22

### Changed

- `init` command now derives the output folder name from the collection name automatically — no separate prompt needed

## [1.1.0] - 2026-04-22

### Added

- i18n support with i18next and automatic OS locale detection
- Profile management (`profile add`, `profile list`, `profile delete`) to store IFS connection details locally
- Live IFS auto-fetch support via saved profiles (`ifs-bruno add --profile`)
- XSRF-TOKEN support for IFS Cloud mutating requests

### Changed

- Tool renamed from `ifs-insomnia` to `ifs-bruno`

## [1.0.0] - 2026-04-14

### Added

- Initial implementation: CLI to import IFS Cloud OData endpoints into Bruno collections
- `init` command to scaffold a Bruno collection with Keycloak auth and default environment
- `add` command to parse IFS OpenAPI specs and generate Bruno request files
- Query params support, ETag pre-request handling, and docs generation
- Structured collection schema with auth and runtime interfaces
