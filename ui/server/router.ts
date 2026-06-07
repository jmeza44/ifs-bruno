import {
  getCollectionEndpoints,
  getCollections,
  postCollectionInit,
  postCollectionSelect,
} from "./handlers/collections.ts";
import { getHealth } from "./handlers/health.ts";
import { deleteProfileByName, getProfiles, postProfile } from "./handlers/profiles.ts";
import { postProjections } from "./handlers/projections.ts";
import { postSpecEntry, postSpecLocal, postSpecRemote } from "./handlers/spec.ts";
import { serveStatic } from "./static.ts";

export async function handleRequest(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);
  const method = req.method;

  if (pathname === "/api/health" && method === "GET") {
    return getHealth(req);
  }

  if (pathname === "/api/profiles" && method === "GET") {
    return getProfiles(req);
  }
  if (pathname === "/api/profiles" && method === "POST") {
    return postProfile(req);
  }
  if (pathname.startsWith("/api/profiles/") && method === "DELETE") {
    return deleteProfileByName(req);
  }

  if (pathname === "/api/collections" && method === "GET") {
    return getCollections(req);
  }
  if (pathname === "/api/collections/endpoints" && method === "GET") {
    return getCollectionEndpoints(req);
  }
  if (pathname === "/api/collections/select" && method === "POST") {
    return postCollectionSelect(req);
  }
  if (pathname === "/api/collections/init" && method === "POST") {
    return postCollectionInit(req);
  }

  if (pathname === "/api/projections" && method === "POST") {
    return postProjections(req);
  }

  if (pathname === "/api/spec/remote" && method === "POST") {
    return postSpecRemote(req);
  }
  if (pathname === "/api/spec/local" && method === "POST") {
    return postSpecLocal(req);
  }
  if (pathname === "/api/spec/entry" && method === "POST") {
    return postSpecEntry(req);
  }

  return serveStatic(req);
}
