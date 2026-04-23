# Contributing

## Development

Run from source with no build step:

```bash
pnpm dev -- init
pnpm dev -- add --spec ./path/to/spec.json --collection ./my-collection
```

Validate types:

```bash
pnpm typecheck
```

Build and test locally as a real global command:

```bash
pnpm build
pnpm link --global

ifs-bruno init
```

## Releasing

Releases are automated via GitHub Actions. Pushing a `v*` tag triggers typecheck → build → npm publish → GitHub Release.

### One-command release

```bash
pnpm release:patch   # 1.2.0 → 1.2.1  (bug fixes)
pnpm release:minor   # 1.2.0 → 1.3.0  (new features)
pnpm release:major   # 1.2.0 → 2.0.0  (breaking changes)
```

Each script bumps the version in `package.json`, commits, creates a `v*` tag, and pushes — CI handles the rest.

Before releasing, add an entry to `CHANGELOG.md` describing what changed. The GitHub Release will use it as the release body.

### First-time setup

Add your npm token as a repository secret named `NPM_TOKEN`:

1. Generate a token at [npmjs.com](https://www.npmjs.com/) → Access Tokens → Generate New Token (Automation)
2. Go to your GitHub repo → Settings → Secrets and variables → Actions
3. Add a new secret: `NPM_TOKEN` = your token
