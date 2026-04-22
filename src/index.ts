import minimist from "minimist";
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
        console.error("Uso: ifs-bruno profile delete <nombre>");
        process.exit(1);
      }
      runProfileDelete(name);
      return;
    }
    console.error(`Subcomando desconocido: profile ${subcommand}`);
    console.error("Subcomandos disponibles: add, list, delete");
    process.exit(1);
  }

  if (command === "add" || !command) {
    const { spec, collection, profile } = argv;
    if (!collection) {
      console.error("Uso:");
      console.error("  ifs-bruno init     [--host <url>] [--realm <realm>] [--client-id <id>] [--output <folder>]");
      console.error("  ifs-bruno add      --spec <path.json> --collection <folder>");
      console.error("  ifs-bruno add      --profile <nombre> --collection <folder>");
      console.error("  ifs-bruno profile  add [<nombre>]");
      console.error("  ifs-bruno profile  list");
      console.error("  ifs-bruno profile  delete <nombre>");
      process.exit(1);
    }
    await runAdd(spec as string | undefined, collection as string, profile as string | undefined);
    return;
  }

  console.error(`Comando desconocido: ${command}`);
  console.error("Comandos disponibles: init, add, profile");
  process.exit(1);
}

main().catch((err: unknown) => {
  console.error("Error inesperado:", err);
  process.exit(1);
});
