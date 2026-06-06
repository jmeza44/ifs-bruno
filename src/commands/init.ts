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

  const name = args.name ?? await promptText(t("init.prompt_collection_name"), "IFS", t("init.hint_collection_name"), false);
  const host = args.host ?? await promptText(t("init.prompt_host"), "https://your-env.ifs.cloud", t("init.hint_host"), true);
  const realm = args.realm ?? await promptText(t("init.prompt_realm"), "your-realm", t("init.hint_realm"), true);
  const clientId = args.clientId ?? await promptText(t("init.prompt_client_id"), "IFS_postman", t("init.hint_client_id"), true);
  const output = args.output ?? name;

  const options: InitOptions = { host: host.replace(/\/$/, ""), realm, clientId, name };
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

async function promptText(
  message: string,
  placeholder: string,
  hint?: string,
  warnIfPlaceholder = false,
  defaultValue?: string,
): Promise<string> {
  const label = hint ? `${message}\n${pc.dim(hint)}` : message;
  const value = await p.text({
    message: label,
    placeholder,
    defaultValue,
    validate: !defaultValue ? (v) => (!(v ?? "").trim() ? t("common.required") : undefined) : undefined,
  });
  if (p.isCancel(value)) { p.cancel(t("common.cancelled")); process.exit(0); }
  const result = ((value as string | undefined) ?? "").trim() || (defaultValue ?? "");
  if (warnIfPlaceholder && result === placeholder) {
    p.log.warn(t("init.warn_placeholder", { value: placeholder }));
  }
  return result;
}
