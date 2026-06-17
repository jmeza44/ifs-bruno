import fs from 'fs';
import type { SwaggerSpec } from '../types/spec.types';

export function loadSpec(specPath: string): SwaggerSpec {
  if (!fs.existsSync(specPath)) {
    throw new Error(`Spec file not found: ${specPath}`);
  }

  const raw = fs.readFileSync(specPath, 'utf-8');

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
