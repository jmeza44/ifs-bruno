export function ok(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function err(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

export function fieldErr(errors: Record<string, string>, status = 400): Response {
  return Response.json({ fieldErrors: errors }, { status });
}

type Handler = (req: Request) => Promise<Response> | Response;

export function route(handler: Handler): Handler {
  return async (req) => {
    try {
      return await handler(req);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return err(message, 500);
    }
  };
}
