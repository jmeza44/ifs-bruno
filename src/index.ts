import minimist from "minimist";
import pc from "picocolors";
import { initI18n, t } from "./i18n";
import { runAdd } from "./commands/add";
import { runInit } from "./commands/init";
import { runProfileAdd, runProfileList, runProfileDelete } from "./commands/profile";
import { getProfile } from "./core/profile-store";
import { validateAddArgs, validateInitArgs, validateProfileAddArgs } from "./validate-args";

const argv = minimist(process.argv.slice(2), {
  string: ["spec", "collection", "name", "host", "realm", "client-id", "client-secret", "keycloak-base-path", "output", "profile"],
  boolean: ["help"],
  alias: {
    s: "spec",
    c: "collection",
    o: "output",
    p: "profile",
    h: "help",
  },
});

const command = argv._[0];
const subcommand = argv._[1];

function printHelp(): void {
  console.log(t("cli.usage"));
  console.log(t("cli.usage_init"));
  console.log(t("cli.usage_add_spec"));
  console.log(t("cli.usage_add_profile"));
  console.log(t("cli.usage_profile_add"));
  console.log(t("cli.usage_profile_list"));
  console.log(t("cli.usage_profile_delete"));
}

async function main(): Promise<void> {
  await initI18n();

  if (argv.help) {
    printHelp();
    return;
  }

  if (command === "init") {
    const host = argv["host"] as string | undefined;
    const output = argv["output"] as string | undefined;
    validateInitArgs({ host, output });
    await runInit({
      name: argv["name"] as string | undefined,
      host,
      realm: argv["realm"] as string | undefined,
      clientId: (argv["client-id"] ?? argv["clientId"]) as string | undefined,
      output,
    });
    return;
  }

  if (command === "profile") {
    if (subcommand === "add") {
      const host = argv["host"] as string | undefined;
      validateProfileAddArgs({ host });
      await runProfileAdd(argv._[2], {
        host,
        realm: argv["realm"] as string | undefined,
        clientId: (argv["client-id"] ?? argv["clientId"]) as string | undefined,
        clientSecret: (argv["client-secret"] ?? argv["clientSecret"]) as string | undefined,
        keycloakBasePath: (argv["keycloak-base-path"] ?? argv["keycloakBasePath"]) as string | undefined,
      });
      return;
    }
    if (subcommand === "list" || !subcommand) {
      runProfileList();
      return;
    }
    if (subcommand === "delete" || subcommand === "remove") {
      const name = argv._[2];
      if (!name) {
        console.error(t("cli.profile_delete_missing_name"));
        process.exit(1);
      }
      if (!getProfile(name)) {
        console.error(pc.red("✗") + " " + t("profile.not_found", { name }));
        process.exit(1);
      }
      runProfileDelete(name);
      return;
    }
    console.error(t("cli.unknown_subcommand", { subcommand }));
    console.error(t("cli.available_subcommands"));
    process.exit(1);
  }

  if (command === "add" || !command) {
    const spec = argv["spec"] as string | undefined;
    const collection = argv["collection"] as string | undefined;
    const profile = argv["profile"] as string | undefined;
    validateAddArgs({ spec, collection, profile });
    if (profile && !getProfile(profile)) {
      console.error(pc.red("✗") + " " + t("add.profile_not_found", { name: profile }));
      process.exit(1);
    }
    await runAdd(spec, collection, profile);
    return;
  }

  console.error(t("cli.unknown_command", { command }));
  console.error(t("cli.available_commands"));
  process.exit(1);
}

main().catch((err: unknown) => {
  console.error(t("cli.unexpected_error"), err);
  process.exit(1);
});
