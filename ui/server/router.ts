import {
  getCollectionDetails,
  getCollectionEndpoints,
  getCollections,
  postCollectionInit,
  postCollectionSelect,
} from './handlers/collections.ts';
import { getHealth } from './handlers/health.ts';
import { getPreferencesHandler, patchPreferencesHandler } from './handlers/preferences.ts';
import {
  deleteProfileByName,
  getProfiles,
  postProfile,
  postProfileTest,
} from './handlers/profiles.ts';
import { postProjections } from './handlers/projections.ts';
import { postSpecEntry, postSpecLocal, postSpecRemote, postSpecUpload } from './handlers/spec.ts';
import { postWrite } from './handlers/write.ts';
import { serveStatic } from './static.ts';

type Handler = (req: Request) => Response | Promise<Response>;
type RouteEntry = { method: string; pathname: string; handler: Handler; prefix?: boolean };

const routes: RouteEntry[] = [
  { method: 'GET', pathname: '/api/health', handler: getHealth },
  { method: 'GET', pathname: '/api/profiles', handler: getProfiles },
  { method: 'POST', pathname: '/api/profiles', handler: postProfile },
  { method: 'POST', pathname: '/api/profiles/test', handler: postProfileTest },
  { method: 'DELETE', pathname: '/api/profiles/', handler: deleteProfileByName, prefix: true },
  { method: 'GET', pathname: '/api/collections', handler: getCollections },
  { method: 'GET', pathname: '/api/collections/endpoints', handler: getCollectionEndpoints },
  { method: 'GET', pathname: '/api/collections/details', handler: getCollectionDetails },
  { method: 'POST', pathname: '/api/collections/select', handler: postCollectionSelect },
  { method: 'POST', pathname: '/api/collections/init', handler: postCollectionInit },
  { method: 'POST', pathname: '/api/projections', handler: postProjections },
  { method: 'POST', pathname: '/api/spec/remote', handler: postSpecRemote },
  { method: 'POST', pathname: '/api/spec/local', handler: postSpecLocal },
  { method: 'POST', pathname: '/api/spec/upload', handler: postSpecUpload },
  { method: 'POST', pathname: '/api/spec/entry', handler: postSpecEntry },
  { method: 'POST', pathname: '/api/write', handler: postWrite },
  { method: 'GET', pathname: '/api/preferences', handler: getPreferencesHandler },
  { method: 'PATCH', pathname: '/api/preferences', handler: patchPreferencesHandler },
];

export async function handleRequest(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);
  const method = req.method;

  const match = routes.find(
    (r) =>
      r.method === method && (r.prefix ? pathname.startsWith(r.pathname) : pathname === r.pathname),
  );

  if (match) return match.handler(req);

  return serveStatic(req);
}
