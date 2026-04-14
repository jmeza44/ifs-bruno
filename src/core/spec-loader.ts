import fs from "fs";
import path from "path";
import type { SwaggerSpec } from "../types/spec.types";

export function loadSpec(specPath: string): SwaggerSpec {
  const absolutePath = path.resolve(specPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Spec file not found: ${absolutePath}`);
  }

  const raw = fs.readFileSync(absolutePath, "utf-8");

  let spec: SwaggerSpec;
  try {
    spec = JSON.parse(raw) as SwaggerSpec;
  } catch (err) {
    throw new Error(`Failed to parse JSON spec: ${(err as Error).message}`);
  }

  if (spec.swagger !== "2.0") {
    throw new Error(`Expected Swagger 2.0 spec, got: ${String(spec.swagger ?? "unknown")}`);
  }

  return spec;
}
