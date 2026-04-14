import fs from "fs";
import path from "path";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { initCollection, type InitOptions } from "../core/bruno-writer";

export interface InitArgs {
  host?: string;
  realm?: string;
  clientId?: string;
  output?: string;
  name?: string;
}

export async function runInit(args: InitArgs): Promise<void> {
  p.intro(pc.bgCyan(pc.black(" ifs-insomnia init ")));

  const name = args.name ?? await promptText("Nombre de la colección", "IFS");
  const host = args.host ?? await promptText("Host de IFS", "https://your-env.ifs.cloud");
  const realm = args.realm ?? await promptText("Nombre del realm de Keycloak", "your-realm");
  const clientId = args.clientId ?? await promptText("Client ID", "IFS_postman");
  const output = args.output ?? await promptText("Carpeta de destino", name);

  const options: InitOptions = { host, realm, clientId, name };
  const outputPath = path.resolve(output);

  if (fs.existsSync(outputPath)) {
    const overwrite = await p.confirm({
      message: `${output} ya existe. ¿Continuar de todas formas?`,
      initialValue: false,
    });

    if (p.isCancel(overwrite) || !overwrite) {
      p.cancel("Abortado.");
      process.exit(0);
    }
  }

  initCollection(outputPath, options);

  p.outro(
    pc.green("Colección creada.") +
    `\n  ${pc.dim(outputPath)}` +
    `\n\n  ${pc.bold("Próximos pasos:")}` +
    `\n  1. Abrí la carpeta ${pc.cyan(output)} en Bruno` +
    `\n  2. ${pc.yellow("⚠")}  Configurá ${pc.cyan("clientSecret")} en el ambiente ${pc.cyan("default")} desde la UI de Bruno` +
    `\n  3. Ejecutá ${pc.cyan("Auth")} para obtener el access token` +
    `\n  4. Usa ${pc.cyan("ifs-insomnia add")} para agregar endpoints de specs IFS`
  );
}

async function promptText(message: string, placeholder: string): Promise<string> {
  const value = await p.text({ message, placeholder });
  if (p.isCancel(value)) { p.cancel("Cancelado."); process.exit(0); }
  return (value as string).trim() || placeholder;
}

