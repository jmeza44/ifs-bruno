import fs from "fs";
import path from "path";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { t } from "../i18n";
import { loadSpec } from "../core/spec-loader";
import { RequestBuilder } from "../core/request-builder";
import { loadCollection, upsertRequests } from "../core/bruno-writer";
import { buildEndpointList, selectEndpoints } from "../tui/endpoint-selector";
import { selectProjection } from "../tui/projection-selector";
import { getProfile, listCollections, saveCollection, type CollectionEntry } from "../core/profile-store";
import { fetchProjections, fetchOpenApiSpec } from "../core/ifs-client";
import type { Operation, SwaggerSpec } from "../types/spec.types";

const OTHER_OPTION = "__other__";

function formatLastUsed(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

async function promptCollectionPath(): Promise<string> {
  const input = await p.text({ message: t("add.prompt_collection_path"), placeholder: "collections/TEST-AUTH" });
  if (p.isCancel(input)) { p.cancel(t("common.cancelled")); process.exit(0); }
  return path.resolve((input as string).trim());
}

async function resolveCollectionPath(collectionPath: string | undefined): Promise<string> {
  if (collectionPath) return collectionPath;

  const saved = listCollections().filter((c) => fs.existsSync(path.join(c.path, "opencollection.yml")));

  if (saved.length === 0) return promptCollectionPath();

  const options = [
    ...saved.map((c: CollectionEntry) => ({
      value: c.path,
      label: c.path,
      hint: formatLastUsed(c.lastUsed),
    })),
    { value: OTHER_OPTION, label: t("add.collection_other") },
  ];

  const selected = await p.select({ message: t("add.prompt_select_collection"), options });
  if (p.isCancel(selected)) { p.cancel(t("common.cancelled")); process.exit(0); }

  if (selected === OTHER_OPTION) return promptCollectionPath();

  return selected as string;
}

export async function runAdd(specPath: string | undefined, collectionPath: string | undefined, profileName?: string): Promise<void> {
  p.intro(pc.bgCyan(pc.black(t("add.intro"))));

  const resolvedCollection = await resolveCollectionPath(collectionPath);

  const specSpinner = p.spinner();
  let spec: SwaggerSpec;

  if (profileName) {
    const profile = getProfile(profileName);
    if (!profile) {
      p.cancel(t("add.profile_not_found", { name: profileName }));
      process.exit(1);
    }

    specSpinner.start(t("add.connecting", { host: profile.host }));
    let projections;
    try {
      projections = await fetchProjections(profile);
      specSpinner.stop(t("add.projections_available", { count: projections.length }));
    } catch (err) {
      specSpinner.stop(t("add.connect_error"));
      p.cancel((err as Error).message);
      process.exit(1);
    }

    const projection = await selectProjection(projections);

    specSpinner.start(t("add.loading_spec", { name: projection.ProjectionName }));
    try {
      spec = await fetchOpenApiSpec(profile, projection.ProjectionName);
      specSpinner.stop(
        t("add.spec_loaded", { title: pc.bold(spec.info.title), count: Object.keys(spec.paths).length })
      );
    } catch (err) {
      specSpinner.stop(t("add.spec_load_error"));
      p.cancel((err as Error).message);
      process.exit(1);
    }
  } else {
    if (!specPath) {
      p.cancel(t("add.need_spec_or_profile"));
      process.exit(1);
    }

    specSpinner.start(t("add.loading_spec_file"));
    try {
      spec = loadSpec(specPath);
      specSpinner.stop(
        t("add.spec_file_loaded", { title: pc.bold(spec.info.title), count: Object.keys(spec.paths).length })
      );
    } catch (err) {
      specSpinner.stop(t("add.spec_file_error"));
      p.cancel((err as Error).message);
      process.exit(1);
    }
  }

  try {
    loadCollection(resolvedCollection);
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
    message: t("add.confirm_add"),
    initialValue: true,
  });

  if (p.isCancel(confirmed) || !confirmed) {
    p.cancel(t("common.aborted"));
    process.exit(0);
  }

  const builder = new RequestBuilder(spec!);

  const builtRequests = selected.map((entry, index) => {
    const operation = (spec!.paths[entry.path] as Record<string, Operation>)[entry.method];
    return builder.build(entry.path, entry.method, operation, index + 1);
  });

  let result;
  try {
    result = upsertRequests(resolvedCollection, spec!.info.title, builtRequests);
  } catch (err) {
    p.cancel(t("add.write_error", { message: (err as Error).message }));
    process.exit(1);
  }

  saveCollection(resolvedCollection);

  p.outro(
    pc.green(t("add.outro_done", { created: result.created, updated: result.updated })) +
    `\n  ${pc.dim(resolvedCollection)}/${spec!.info.title}/`
  );
}
