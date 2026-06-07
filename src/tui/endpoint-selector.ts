import React from "react";
import process from "process";
import { render } from "ink";
import type { SwaggerSpec } from "../types/spec.types";
import type { EndpointEntry } from "../types/tool.types";
import { EndpointSelector } from "./EndpointSelector";
import { buildEndpointList } from "../core/endpoint-list";

export { buildEndpointList } from "../core/endpoint-list";

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
