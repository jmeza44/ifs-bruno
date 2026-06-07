import { openBrowser } from "./open-browser.ts";
import { handleRequest } from "./router.ts";

const port = process.env.PORT ? Number(process.env.PORT) : 0;

const server = Bun.serve({
  port,
  fetch: handleRequest,
});

const url = `http://localhost:${server.port}`;
console.log(`ifs-bruno-ui listening on ${url}`);

await openBrowser(url);
