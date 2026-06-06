import fs from "fs";
import path from "path";
import pc from "picocolors";

type ValidationError = { message: string };

function fail(message: string): never {
  console.error(pc.red("✗") + " " + message);
  process.exit(1);
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateAddArgs(args: {
  spec?: string;
  collection?: string;
  profile?: string;
}): void {
  if (args.spec) {
    if (!fs.existsSync(args.spec)) {
      fail(`Spec file not found: ${args.spec}`);
    }
    if (!args.spec.endsWith(".json")) {
      fail(`Spec file must be a JSON file: ${args.spec}`);
    }
  }

  if (args.collection) {
    const resolved = path.resolve(args.collection);
    const parent = path.dirname(resolved);
    if (!fs.existsSync(parent)) {
      fail(`Collection parent folder does not exist: ${parent}`);
    }
  }
}

export function validateInitArgs(args: {
  host?: string;
  output?: string;
}): void {
  if (args.host && !isValidUrl(args.host)) {
    fail(`Invalid host URL: ${args.host}\n  Expected format: https://acme.ifs.cloud`);
  }

  if (args.output) {
    const resolved = path.resolve(args.output);
    const parent = path.dirname(resolved);
    if (!fs.existsSync(parent)) {
      fail(`Output parent folder does not exist: ${parent}`);
    }
  }
}

export function validateProfileAddArgs(args: { host?: string }): void {
  if (args.host && !isValidUrl(args.host)) {
    fail(`Invalid host URL: ${args.host}\n  Expected format: https://acme.ifs.cloud`);
  }
}
