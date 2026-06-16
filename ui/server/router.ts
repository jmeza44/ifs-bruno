import {
  getCollectionDetails,
  getCollectionEndpoints,
  getCollections,
  postCollectionInit,
  postCollectionSelect,
} from './handlers/collections.ts';
import {
  postPostmanCollectionInit,
  postPostmanCollectionSelect,
} from './handlers/postman-collections.ts';
import { getHealth } from './handlers/health.ts';
import { getPreferencesHandler, patchPreferencesHandler } from './handlers/preferences.ts';
import {
  deleteProfileByName,
  getProfiles,
  postProfile,
  postProfileTest,
} from './handlers/profiles.ts';
import { postProjections } from './handlers/projections.ts';
import { postSpecEntry, postSpecLocal, postSpecRemote } from './handlers/spec.ts';
import { postWrite } from './handlers/write.ts';
import { serveStatic } from './static.ts';

export async function handleRequest(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);
  const method = req.method;

  if (pathname === '/api/health' && method === 'GET') {
    return getHealth(req);
  }

  if (pathname === '/api/profiles' && method === 'GET') {
    return getProfiles(req);
  }
  if (pathname === '/api/profiles' && method === 'POST') {
    return postProfile(req);
  }
  if (pathname === '/api/profiles/test' && method === 'POST') {
    return postProfileTest(req);
  }
  if (pathname.startsWith('/api/profiles/') && method === 'DELETE') {
    return deleteProfileByName(req);
  }

  if (pathname === '/api/collections' && method === 'GET') {
    return getCollections(req);
  }
  if (pathname === '/api/collections/endpoints' && method === 'GET') {
    return getCollectionEndpoints(req);
  }
  if (pathname === '/api/collections/details' && method === 'GET') {
    return getCollectionDetails(req);
  }
  if (pathname === '/api/collections/select' && method === 'POST') {
    return postCollectionSelect(req);
  }
  if (pathname === '/api/collections/init' && method === 'POST') {
    return postCollectionInit(req);
  }
  if (pathname === '/api/collections/postman/init' && method === 'POST') {
    return postPostmanCollectionInit(req);
  }
  if (pathname === '/api/collections/postman/select' && method === 'POST') {
    return postPostmanCollectionSelect(req);
  }

  if (pathname === '/api/projections' && method === 'POST') {
    return postProjections(req);
  }

  if (pathname === '/api/spec/remote' && method === 'POST') {
    return postSpecRemote(req);
  }
  if (pathname === '/api/spec/local' && method === 'POST') {
    return postSpecLocal(req);
  }
  if (pathname === '/api/spec/entry' && method === 'POST') {
    return postSpecEntry(req);
  }

  if (pathname === '/api/write' && method === 'POST') {
    return postWrite(req);
  }

  if (pathname === '/api/preferences' && method === 'GET') {
    return getPreferencesHandler(req);
  }
  if (pathname === '/api/preferences' && method === 'PATCH') {
    return patchPreferencesHandler(req);
  }

  return serveStatic(req);
}
