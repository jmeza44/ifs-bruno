import * as p from "@clack/prompts";
import pc from "picocolors";
import { t } from "../i18n";
import { saveProfile, getProfile, listProfiles, deleteProfile } from "../core/profile-store";
import type { IfsProfile } from "../core/profile-store";

export interface ProfileAddArgs {
  host?: string;
  realm?: string;
  clientId?: string;
  clientSecret?: string;
  keycloakBasePath?: string;
}

export async function runProfileAdd(nameArg?: string, args: ProfileAddArgs = {}): Promise<void> {
  p.intro(pc.bgCyan(pc.black(t("profile.add_intro"))));

  const name = nameArg ?? await promptText(t("profile.prompt_name"), "my-env", t("profile.hint_name"));
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

  const host = args.host ?? await promptText(t("profile.prompt_host"), "https://your-env.ifs.cloud", t("profile.hint_host"), true);
  const realm = args.realm ?? await promptText(t("profile.prompt_realm"), "your-realm", t("profile.hint_realm"), true);
  const clientId = args.clientId ?? await promptText(t("profile.prompt_client_id"), "IFS_postman", t("profile.hint_client_id"), true);

  let clientSecret: string;
  if (args.clientSecret) {
    clientSecret = args.clientSecret;
  } else {
    const secret = await p.password({
      message: `${t("profile.prompt_client_secret")}\n${pc.dim(t("profile.hint_client_secret"))}`,
      validate: (v) => (!v.trim() ? t("common.required") : undefined),
    });
    if (p.isCancel(secret)) { p.cancel(t("common.cancelled")); process.exit(0); }
    clientSecret = secret as string;
  }

  const keycloakBasePath = args.keycloakBasePath ?? await promptText(t("profile.prompt_keycloak_base_path"), "/auth", t("profile.hint_keycloak_base_path"));

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

async function promptText(message: string, placeholder: string, hint?: string, required = false): Promise<string> {
  const label = hint ? `${message}\n${pc.dim(hint)}` : message;
  const value = await p.text({
    message: label,
    placeholder,
    validate: required ? (v) => (!v.trim() ? t("common.required") : undefined) : undefined,
  });
  if (p.isCancel(value)) { p.cancel(t("common.cancelled")); process.exit(0); }
  return (value as string).trim() || placeholder;
}
