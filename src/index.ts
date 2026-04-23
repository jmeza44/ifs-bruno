import minimist from "minimist";
import { initI18n, t } from "./i18n";
import { runAdd } from "./commands/add";
import { runInit } from "./commands/init";
import { runProfileAdd, runProfileList, runProfileDelete } from "./commands/profile";

const argv = minimist(process.argv.slice(2), {
  string: ["spec", "collection", "name", "host", "realm", "client-id", "output", "profile"],
  alias: {
    s: "spec",
    c: "collection",
    o: "output",
    p: "profile",
  },
});

const command = argv._[0];
const subcommand = argv._[1];

async function main(): Promise<void> {
  await initI18n();

  if (command === "init") {
    await runInit({
      name: argv["name"] as string | undefined,
      host: argv["host"] as string | undefined,
      realm: argv["realm"] as string | undefined,
      clientId: (argv["client-id"] ?? argv["clientId"]) as string | undefined,
      output: argv["output"] as string | undefined,
    });
    return;
  }

  if (command === "profile") {
    if (subcommand === "add") {
      await runProfileAdd(argv._[2]);
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
      runProfileDelete(name);
      return;
    }
    console.error(t("cli.unknown_subcommand", { subcommand }));
    console.error(t("cli.available_subcommands"));
    process.exit(1);
  }

  if (command === "add" || !command) {
    const { spec, collection, profile } = argv;
    await runAdd(spec as string | undefined, collection as string | undefined, profile as string | undefined);
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
