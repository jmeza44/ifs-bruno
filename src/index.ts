import minimist from "minimist";
import { runAdd } from "./commands/add";
import { runInit } from "./commands/init";

const argv = minimist(process.argv.slice(2), {
  string: ["spec", "collection", "host", "realm", "client-id", "output"],
  alias: {
    s: "spec",
    c: "collection",
    o: "output",
  },
});

const command = argv._[0];

async function main(): Promise<void> {
  if (command === "init") {
    await runInit({
      host: argv["host"] as string | undefined,
      realm: argv["realm"] as string | undefined,
      clientId: argv["client-id"] as string | undefined,
      output: argv["output"] as string | undefined,
    });
    return;
  }

  if (command === "add" || !command) {
    const { spec, collection } = argv;
    if (!spec || !collection) {
      console.error("Uso:");
      console.error("  ifs-insomnia init [--host <url>] [--realm <realm>] [--client-id <id>] [--output <folder>]");
      console.error("  ifs-insomnia add  --spec <path.json> --collection <path.yaml>");
      process.exit(1);
    }
    await runAdd(spec as string, collection as string);
    return;
  }

  console.error(`Comando desconocido: ${command}`);
  console.error("Comandos disponibles: init, add");
  process.exit(1);
}

main().catch((err: unknown) => {
  console.error("Error inesperado:", err);
  process.exit(1);
});
