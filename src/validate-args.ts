import fs from "fs";
import path from "path";
import pc from "picocolors";

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

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

function result(errors: string[]): ValidationResult {
  return { ok: errors.length === 0, errors };
}

export function checkAddArgs(args: {
  spec?: string;
  collection?: string;
  profile?: string;
}): ValidationResult {
  const errors: string[] = [];

  if (args.spec) {
    if (!fs.existsSync(args.spec)) {
      errors.push(`Spec file not found: ${args.spec}`);
    } else if (!args.spec.endsWith(".json")) {
      errors.push(`Spec file must be a JSON file: ${args.spec}`);
    }
  }

  if (args.collection) {
    const resolved = path.resolve(args.collection);
    const parent = path.dirname(resolved);
    if (!fs.existsSync(parent)) {
      errors.push(`Collection parent folder does not exist: ${parent}`);
    }
  }

  return result(errors);
}

export function checkInitArgs(args: {
  host?: string;
  output?: string;
}): ValidationResult {
  const errors: string[] = [];

  if (args.host && !isValidUrl(args.host)) {
    errors.push(`Invalid host URL: ${args.host}\n  Expected format: https://acme.ifs.cloud`);
  }

  if (args.output) {
    const resolved = path.resolve(args.output);
    const parent = path.dirname(resolved);
    if (!fs.existsSync(parent)) {
      errors.push(`Output parent folder does not exist: ${parent}`);
    }
  }

  return result(errors);
}

export function checkProfileAddArgs(args: { host?: string }): ValidationResult {
  const errors: string[] = [];

  if (args.host && !isValidUrl(args.host)) {
    errors.push(`Invalid host URL: ${args.host}\n  Expected format: https://acme.ifs.cloud`);
  }

  return result(errors);
}

export function validateAddArgs(args: {
  spec?: string;
  collection?: string;
  profile?: string;
}): void {
  const { ok, errors } = checkAddArgs(args);
  if (!ok) {
    fail(errors.join("\n"));
  }
}

export function validateInitArgs(args: {
  host?: string;
  output?: string;
}): void {
  const { ok, errors } = checkInitArgs(args);
  if (!ok) {
    fail(errors.join("\n"));
  }
}

export function validateProfileAddArgs(args: { host?: string }): void {
  const { ok, errors } = checkProfileAddArgs(args);
  if (!ok) {
    fail(errors.join("\n"));
  }
}
