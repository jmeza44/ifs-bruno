import {
  deleteProfile,
  getProfile,
  listProfiles,
  saveProfile,
  type IfsProfile,
} from "../../../src/core/profile-store.ts";
import { fetchToken } from "../../../src/core/ifs-client.ts";
import { checkProfileAddArgs } from "../../../src/validate-args.ts";
import { err, fieldErr, ok, route } from "../json.ts";

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

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Required";
  if (!host) fieldErrors.host = "Required";
  else if (!checkProfileAddArgs({ host }).ok) fieldErrors.host = "Must be a valid URL, e.g. https://acme.ifs.cloud";
  if (!realm) fieldErrors.realm = "Required";
  if (!clientId) fieldErrors.clientId = "Required";
  if (!clientSecret) fieldErrors.clientSecret = "Required";

  if (Object.keys(fieldErrors).length > 0) {
    return fieldErr(fieldErrors);
  }

  if (getProfile(name) && !overwrite) {
    return err(`Profile already exists: ${name}`, 409);
  }

  saveProfile(name, { host, realm, clientId, clientSecret, keycloakBasePath });
  return ok({ name }, 201);
});

export const postProfileTest = route(async (req) => {
  const body = (await req.json()) as Partial<IfsProfile>;
  const { host, realm, clientId, clientSecret, keycloakBasePath } = body;

  if (!host || !realm || !clientId || !clientSecret) {
    return err("host, realm, clientId and clientSecret are required", 400);
  }

  await fetchToken({ host, realm, clientId, clientSecret, keycloakBasePath });
  return ok({ ok: true });
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
