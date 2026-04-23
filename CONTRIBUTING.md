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

Releases are fully automated via GitHub Actions. The workflow triggers on any `v*` tag and runs:

1. `pnpm typecheck`
2. `pnpm build`
3. `npm publish` → publishes to npm
4. Creates a GitHub Release using `CHANGELOG.md` as the body

### Release checklist

Before running the release script:

1. Make sure all changes are committed and pushed to `main`
2. Add an entry to `CHANGELOG.md` for the new version (the GitHub Release will use it as the body)
3. Commit the changelog: `git commit -m "chore: update changelog for vX.Y.Z"`

Then run the appropriate release script:

```bash
pnpm release:patch   # bug fixes        1.3.0 → 1.3.1
pnpm release:minor   # new features     1.3.0 → 1.4.0
pnpm release:major   # breaking changes 1.3.0 → 2.0.0
```

Each script: bumps `package.json`, commits the version, creates a `v*` tag, and pushes branch + tag. CI handles everything after that.

### First-time setup

Add your npm token as a repository secret named `NPM_TOKEN`:

1. Generate a token at [npmjs.com](https://www.npmjs.com/) → Access Tokens → Generate New Token (Granular)
   - Packages and scopes: **Read and write** — limit to `ifs-bruno` only
   - Bypass 2FA: **enabled**
2. Go to your GitHub repo → Settings → Secrets and variables → Actions
3. Add a new secret: `NPM_TOKEN` = your token
