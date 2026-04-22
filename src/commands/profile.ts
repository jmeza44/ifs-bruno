import * as p from "@clack/prompts";
import pc from "picocolors";
import { t } from "../i18n";
import { saveProfile, getProfile, listProfiles, deleteProfile } from "../core/profile-store";
import type { IfsProfile } from "../core/profile-store";

export async function runProfileAdd(nameArg?: string): Promise<void> {
  p.intro(pc.bgCyan(pc.black(t("profile.add_intro"))));

  const name = nameArg ?? await promptText(t("profile.prompt_name"), "my-env");
  const existing = getProfile(name);

  if (existing) {
    const overwrite = await p.confirm({
      message: t("profile.confirm_overwrite", { name }),
      initialValue: false,
    });
    if (p.isCancel(overwrite) || !overwrite) {
      p.cancel(t("common.aborted"));
      process.exit(0);
    }
  }

  const host = await promptText(t("profile.prompt_host"), "https://your-env.ifs.cloud");
  const realm = await promptText(t("profile.prompt_realm"), "your-realm");
  const clientId = await promptText(t("profile.prompt_client_id"), "IFS_postman");

  const clientSecret = await p.password({ message: t("profile.prompt_client_secret") });
  if (p.isCancel(clientSecret)) { p.cancel(t("common.cancelled")); process.exit(0); }

  const keycloakBasePath = await promptText(t("profile.prompt_keycloak_base_path"), "/auth");

  const profile: IfsProfile = {
    host: host.replace(/\/$/, ""),
    realm,
    clientId,
    clientSecret: clientSecret as string,
    keycloakBasePath,
  };

  saveProfile(name, profile);

  p.outro(pc.green(t("profile.saved", { name })) + `\n  ${pc.dim("~/.ifs-bruno/config.json")}`);
}

export function runProfileList(): void {
  const profiles = listProfiles();

  if (profiles.length === 0) {
    console.log(pc.yellow(t("profile.no_profiles")));
    console.log(pc.dim(t("profile.no_profiles_hint")));
    return;
  }

  console.log(pc.bold(t("profile.profiles_title")));
  for (const name of profiles) {
    const profile = getProfile(name)!;
    console.log(`  ${pc.cyan(name)}`);
    console.log(pc.dim(`    host:     ${profile.host}`));
    console.log(pc.dim(`    realm:    ${profile.realm}`));
    console.log(pc.dim(`    clientId: ${profile.clientId}`));
  }
  console.log();
}

export function runProfileDelete(name: string): void {
  const deleted = deleteProfile(name);
  if (deleted) {
    console.log(pc.green(t("profile.deleted", { name })));
  } else {
    console.log(pc.red(t("profile.not_found", { name })));
    process.exit(1);
  }
}

async function promptText(message: string, placeholder: string): Promise<string> {
  const value = await p.text({ message, placeholder });
  if (p.isCancel(value)) { p.cancel(t("common.cancelled")); process.exit(0); }
  return (value as string).trim() || placeholder;
}
