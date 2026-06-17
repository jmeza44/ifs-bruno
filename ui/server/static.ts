// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated at build time, does not exist in dev
const assetManifest: Record<string, Bun.BunFile> = await import('./static-assets.gen.ts')
  .then((mod) => mod.default)
  .catch(() => ({}));

const MIME_TYPES: Record<string, string> = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  svg: 'image/svg+xml',
  woff2: 'font/woff2',
  json: 'application/json; charset=utf-8',
  ico: 'image/x-icon',
  png: 'image/png',
};

function mimeFor(path: string): string {
  const ext = path.split('.').pop() ?? '';
  return MIME_TYPES[ext] ?? 'application/octet-stream';
}

function lookup(pathname: string): Bun.BunFile | undefined {
  const key = pathname === '/' ? '/index.html' : pathname;
  return assetManifest[key];
}

export function serveStatic(req: Request): Response {
  const { pathname } = new URL(req.url);

  const asset = lookup(pathname) ?? assetManifest['/index.html'];
  if (!asset) {
    return new Response(
      'No embedded frontend assets found. Run the frontend dev server (pnpm --filter frontend dev) and use its URL instead, or run `bun run build.ts` to embed the production build.',
      { status: 404 },
    );
  }

  return new Response(asset, {
    headers: { 'content-type': mimeFor(asset.name ?? pathname) },
  });
}
