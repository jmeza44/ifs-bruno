const PLACEHOLDER_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>ifs-bruno-ui</title>
  </head>
  <body>
    <h1>ifs-bruno-ui</h1>
    <p>Server is running. Frontend assets will be embedded in M8.</p>
  </body>
</html>
`;

export function serveStatic(_req: Request): Response {
  return new Response(PLACEHOLDER_HTML, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
