import fs from "fs";
import path from "path";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { t } from "../i18n";
import { initCollection, type InitOptions } from "../core/bruno-writer";

export interface InitArgs {
  host?: string;
  realm?: string;
  clientId?: string;
  output?: string;
  name?: string;
}

export async function runInit(args: InitArgs): Promise<void> {
  p.intro(pc.bgCyan(pc.black(t("init.intro"))));

  const name = args.name ?? await promptText(t("init.prompt_collection_name"), "IFS");
  const host = args.host ?? await promptText(t("init.prompt_host"), "https://your-env.ifs.cloud");
  const realm = args.realm ?? await promptText(t("init.prompt_realm"), "your-realm");
  const clientId = args.clientId ?? await promptText(t("init.prompt_client_id"), "IFS_postman");
  const output = args.output ?? await promptText(t("init.prompt_output_folder"), name);

  const options: InitOptions = { host, realm, clientId, name };
  const outputPath = path.resolve(output);

  if (fs.existsSync(outputPath)) {
    const overwrite = await p.confirm({
      message: t("init.confirm_overwrite", { output }),
      initialValue: false,
    });

    if (p.isCancel(overwrite) || !overwrite) {
      p.cancel(t("common.aborted"));
      process.exit(0);
    }
  }

  initCollection(outputPath, options);

  p.outro(
    pc.green(t("init.outro_collection_created")) +
    `\n  ${pc.dim(outputPath)}` +
    `\n\n  ${pc.bold(t("init.outro_next_steps"))}` +
    `\n  1. ${t("init.outro_step1", { output: pc.cyan(output) })}` +
    `\n  2. ${pc.yellow("⚠")}  ${t("init.outro_step2", { clientSecret: pc.cyan("clientSecret"), env: pc.cyan("default") })}` +
    `\n  3. ${t("init.outro_step3", { auth: pc.cyan("Auth") })}` +
    `\n  4. ${t("init.outro_step4", { cmd: pc.cyan("ifs-bruno add") })}`
  );
}

async function promptText(message: string, placeholder: string): Promise<string> {
  const value = await p.text({ message, placeholder });
  if (p.isCancel(value)) { p.cancel(t("common.cancelled")); process.exit(0); }
  return (value as string).trim() || placeholder;
}
