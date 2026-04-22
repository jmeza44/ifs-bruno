import * as p from "@clack/prompts";
import pc from "picocolors";
import { saveProfile, getProfile, listProfiles, deleteProfile } from "../core/profile-store";
import type { IfsProfile } from "../core/profile-store";

export async function runProfileAdd(nameArg?: string): Promise<void> {
  p.intro(pc.bgCyan(pc.black(" ifs-insomnia profile add ")));

  const name = nameArg ?? await promptText("Nombre del perfil", "my-env");
  const existing = getProfile(name);

  if (existing) {
    const overwrite = await p.confirm({
      message: `El perfil "${name}" ya existe. ¿Sobreescribir?`,
      initialValue: false,
    });
    if (p.isCancel(overwrite) || !overwrite) {
      p.cancel("Abortado.");
      process.exit(0);
    }
  }

  const host = await promptText("Host de IFS", "https://your-env.ifs.cloud");
  const realm = await promptText("Realm de Keycloak", "your-realm");
  const clientId = await promptText("Client ID", "IFS_postman");

  const clientSecret = await p.password({ message: "Client Secret" });
  if (p.isCancel(clientSecret)) { p.cancel("Cancelado."); process.exit(0); }

  const keycloakBasePath = await promptText("Keycloak base path", "/auth");

  const profile: IfsProfile = {
    host: host.replace(/\/$/, ""),
    realm,
    clientId,
    clientSecret: clientSecret as string,
    keycloakBasePath,
  };

  saveProfile(name, profile);

  p.outro(pc.green(`Perfil "${name}" guardado.`) + `\n  ${pc.dim("~/.ifs-insomnia/config.json")}`);
}

export function runProfileList(): void {
  const profiles = listProfiles();

  if (profiles.length === 0) {
    console.log(pc.yellow("No hay perfiles configurados."));
    console.log(pc.dim("  Ejecutá: ifs-insomnia profile add"));
    return;
  }

  console.log(pc.bold("\nPerfiles configurados:\n"));
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
    console.log(pc.green(`Perfil "${name}" eliminado.`));
  } else {
    console.log(pc.red(`Perfil "${name}" no encontrado.`));
    process.exit(1);
  }
}

async function promptText(message: string, placeholder: string): Promise<string> {
  const value = await p.text({ message, placeholder });
  if (p.isCancel(value)) { p.cancel("Cancelado."); process.exit(0); }
  return (value as string).trim() || placeholder;
}
