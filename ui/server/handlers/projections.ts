import { fetchProjections } from "../../../src/core/ifs-client.ts";
import { getProfile } from "../../../src/core/profile-store.ts";
import { err, ok, route } from "../json.ts";

interface ProjectionsBody {
  profileName?: string;
}

export const postProjections = route(async (req) => {
  const body = (await req.json()) as ProjectionsBody;
  const { profileName } = body;

  if (!profileName) {
    return err("profileName is required", 400);
  }

  const profile = getProfile(profileName);
  if (!profile) {
    return err(`Profile not found: ${profileName}`, 404);
  }

  const projections = await fetchProjections(profile);
  return ok({ projections });
});
