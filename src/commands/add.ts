import * as p from "@clack/prompts";
import pc from "picocolors";
import { loadSpec } from "../core/spec-loader";
import { RequestBuilder } from "../core/request-builder";
import { loadCollection, upsertRequests } from "../core/bruno-writer";
import { buildEndpointList, selectEndpoints } from "../tui/endpoint-selector";
import type { Operation } from "../types/spec.types";

export async function runAdd(specPath: string, collectionPath: string): Promise<void> {
  p.intro(pc.bgCyan(pc.black(" ifs-insomnia ")));

  const specSpinner = p.spinner();
  specSpinner.start("Loading spec...");

  let spec;
  try {
    spec = loadSpec(specPath);
    specSpinner.stop(
      `Loaded ${pc.bold(spec.info.title)}  —  ${Object.keys(spec.paths).length} paths`
    );
  } catch (err) {
    specSpinner.stop("Failed to load spec");
    p.cancel((err as Error).message);
    process.exit(1);
  }

  try {
    loadCollection(collectionPath);
  } catch (err) {
    p.cancel((err as Error).message);
    process.exit(1);
  }

  const entries = buildEndpointList(spec);
  const selected = await selectEndpoints(entries);

  p.note(
    selected.map((e) => `  ${e.displayLabel}`).join("\n"),
    `${selected.length} endpoint(s) selected`
  );

  const confirmed = await p.confirm({
    message: "Add these endpoints to the collection?",
    initialValue: true,
  });

  if (p.isCancel(confirmed) || !confirmed) {
    p.cancel("Aborted.");
    process.exit(0);
  }

  const builder = new RequestBuilder(spec);

  const builtRequests = selected.map((entry, index) => {
    const operation = (spec.paths[entry.path] as Record<string, Operation>)[entry.method];
    return builder.build(entry.path, entry.method, operation, index + 1);
  });

  let result;
  try {
    result = upsertRequests(collectionPath, spec.info.title, builtRequests);
  } catch (err) {
    p.cancel(`Failed to write requests: ${(err as Error).message}`);
    process.exit(1);
  }

  p.outro(
    pc.green(`Done!  ${result.created} created, ${result.updated} updated`) +
    `\n  ${pc.dim(collectionPath)}/${spec.info.title}/`
  );
}
