import { openBrowser } from './open-browser.ts';
import { handleRequest } from './router.ts';

function log(message: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

log('Starting ifs-bruno-ui server...');

const port = process.env.PORT ? Number(process.env.PORT) : 0;

async function loggedHandler(req: Request): Promise<Response> {
  const start = performance.now();
  const { pathname } = new URL(req.url);
  const response = await handleRequest(req);
  const durationMs = (performance.now() - start).toFixed(1);
  log(`${req.method}\t${pathname} -> ${response.status} (${durationMs}ms)`);
  return response;
}

const server = Bun.serve({
  port,
  fetch: loggedHandler,
});

const url = `http://localhost:${server.port}`;
log(`Server ready — listening on ${url}`);

log('Opening browser...');
await openBrowser(url);
log('Browser launch requested. Server is running — press Ctrl+C to stop.');
