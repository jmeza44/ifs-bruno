import { getPreferences, savePreferences, type AppPreferences } from '../../../src/core/profile-store.ts';
import { err, ok, route } from '../json.ts';

export const getPreferencesHandler = route(() => {
  return ok(getPreferences());
});

export const patchPreferencesHandler = route(async (req) => {
  const body = (await req.json()) as Partial<AppPreferences>;

  if (body.collectionsBasePath !== undefined) {
    if (typeof body.collectionsBasePath !== 'string') {
      return err('collectionsBasePath must be a string', 400);
    }
    if (body.collectionsBasePath !== '' && !body.collectionsBasePath.startsWith('~/')) {
      return err('collectionsBasePath must start with ~/', 400);
    }
  }

  savePreferences(body);
  return ok(getPreferences());
});
