import React from "react";
import process from "process";
import { render } from "ink";
import type { SwaggerSpec, PathItem, Operation } from "../types/spec.types";
import type { EndpointEntry } from "../types/tool.types";
import { EndpointSelector } from "./EndpointSelector";

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;

export function buildEndpointList(spec: SwaggerSpec): EndpointEntry[] {
  const entries: EndpointEntry[] = [];

  for (const [pathTemplate, pathItem] of Object.entries(spec.paths)) {
    for (const method of HTTP_METHODS) {
      const operation = (pathItem as PathItem)[method] as Operation | undefined;
      if (!operation) continue;

      const tag = operation.tags?.[0] ?? "Untagged";
      const summary = (operation.summary ?? operation.operationId ?? pathTemplate).trim();
      const operationId = operation.operationId ?? "";
      const displayLabel = `[${method.toUpperCase()}] ${pathTemplate} — ${summary}`;

      entries.push({ path: pathTemplate, method, tag, summary, operationId, displayLabel });
    }
  }

  return entries;
}

export function selectEndpoints(entries: EndpointEntry[], spec: SwaggerSpec): Promise<EndpointEntry[]> {
  return new Promise((resolve, reject) => {
    let result: { ok: true; value: EndpointEntry[] } | { ok: false } | undefined;

    process.stdin.resume();
    process.stdin.setRawMode(true);

    const instance = render(
      React.createElement(EndpointSelector, {
        entries,
        spec,
        onSubmit: (selected) => { result = { ok: true, value: selected }; },
        onCancel: () => { result = { ok: false }; },
      }),
      { stdin: process.stdin }
    );

    instance.waitUntilExit().then(() => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      if (result?.ok) resolve(result.value);
      else reject(new Error("cancelled"));
    }).catch(reject);
  });
}
