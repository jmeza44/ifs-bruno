import {
  deleteProfile,
  getProfile,
  listProfiles,
  saveProfile,
  type IfsProfile,
} from "../../../src/core/profile-store.ts";
import { checkProfileAddArgs } from "../../../src/validate-args.ts";
import { err, ok, route } from "../json.ts";

interface ProfileSummary {
  name: string;
  host: string;
  realm: string;
  clientId: string;
}

function toSummary(name: string, profile: IfsProfile): ProfileSummary {
  return {
    name,
    host: profile.host,
    realm: profile.realm,
    clientId: profile.clientId,
  };
}

export const getProfiles = route(() => {
  const profiles = listProfiles()
    .map((name) => {
      const profile = getProfile(name);
      return profile ? toSummary(name, profile) : undefined;
    })
    .filter((p): p is ProfileSummary => p !== undefined);

  return ok({ profiles });
});

export const postProfile = route(async (req) => {
  const url = new URL(req.url);
  const overwrite = url.searchParams.get("overwrite") === "true";

  const body = (await req.json()) as Partial<IfsProfile> & { name?: string };
  const { name, host, realm, clientId, clientSecret, keycloakBasePath } = body;

  if (!name) {
    return err("name is required", 400);
  }

  const { ok: valid, errors } = checkProfileAddArgs({ host });
  if (!valid) {
    return err(errors.join("; "), 400);
  }

  if (!host || !realm || !clientId || !clientSecret) {
    return err("host, realm, clientId and clientSecret are required", 400);
  }

  if (getProfile(name) && !overwrite) {
    return err(`Profile already exists: ${name}`, 409);
  }

  saveProfile(name, { host, realm, clientId, clientSecret, keycloakBasePath });
  return ok({ name }, 201);
});

export const deleteProfileByName = route((req) => {
  const name = decodeURIComponent(new URL(req.url).pathname.split("/").pop() ?? "");
  if (!name) {
    return err("name is required", 400);
  }

  const deleted = deleteProfile(name);
  if (!deleted) {
    return err(`Profile not found: ${name}`, 404);
  }

  return ok({ deleted: true });
});
