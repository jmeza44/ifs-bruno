import { SwaggerSpec } from '@types-app/spec.types';
import fs from 'fs';

/** Parses and validates spec JSON already read into memory (e.g. an uploaded file's contents). */
export function parseSpec(raw: string): SwaggerSpec {
  let spec: SwaggerSpec;
  try {
    spec = JSON.parse(raw) as SwaggerSpec;
  } catch (err) {
    throw new Error(`Failed to parse JSON spec: ${(err as Error).message}`);
  }

  if (spec.swagger !== '2.0') {
    throw new Error(`Expected Swagger 2.0 spec, got: ${String(spec.swagger ?? 'unknown')}`);
  }

  return spec;
}

/** Reads and parses a spec file from disk — only valid when caller and server share a filesystem (e.g. the TUI). */
export function loadSpec(specPath: string): SwaggerSpec {
  if (!fs.existsSync(specPath)) {
    throw new Error(`Spec file not found: ${specPath}`);
  }

  const raw = fs.readFileSync(specPath, 'utf-8');
  return parseSpec(raw);
}
