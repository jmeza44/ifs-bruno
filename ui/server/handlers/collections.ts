import fs from "fs";
import path from "path";
import { initCollection, type InitOptions } from "../../../src/core/bruno-writer.ts";
import { readCollectionFolders } from "../../../src/core/collection-reader.ts";
import {
  listCollections,
  saveCollection,
} from "../../../src/core/profile-store.ts";
import { checkInitArgs } from "../../../src/validate-args.ts";
import { err, ok, route } from "../json.ts";

export const getCollections = route(() => {
  return ok({ collections: listCollections() });
});

export const getCollectionEndpoints = route((req) => {
  const url = new URL(req.url);
  const collectionPath = url.searchParams.get("path");
  if (!collectionPath) {
    return err("path query parameter is required", 400);
  }

  const resolvedPath = path.resolve(collectionPath);
  if (!fs.existsSync(resolvedPath)) {
    return err(`Collection not found: ${resolvedPath}`, 404);
  }

  return ok({ folders: readCollectionFolders(resolvedPath) });
});

export const postCollectionSelect = route(async (req) => {
  const body = (await req.json()) as { path?: string };
  if (!body.path) {
    return err("path is required", 400);
  }

  const resolvedPath = path.resolve(body.path);
  if (!fs.existsSync(resolvedPath)) {
    return err(`Collection not found: ${resolvedPath}`, 404);
  }
  if (!fs.existsSync(path.join(resolvedPath, "opencollection.yml"))) {
    return err(`Not a Bruno collection — opencollection.yml not found in: ${resolvedPath}`, 404);
  }

  saveCollection(resolvedPath);
  return ok({ path: resolvedPath });
});

interface InitBody {
  name?: string;
  host?: string;
  realm?: string;
  clientId?: string;
  output?: string;
}

export const postCollectionInit = route(async (req) => {
  const url = new URL(req.url);
  const overwrite = url.searchParams.get("overwrite") === "true";

  const body = (await req.json()) as InitBody;
  const { name, host, realm, clientId } = body;
  const output = body.output ?? name;

  const { ok: valid, errors } = checkInitArgs({ host, output });
  if (!valid) {
    return err(errors.join("; "), 400);
  }

  if (!name || !host || !realm || !clientId || !output) {
    return err("name, host, realm, clientId and output are required", 400);
  }

  const outputPath = path.resolve(output);
  if (fs.existsSync(outputPath) && !overwrite) {
    return err(`Output already exists: ${outputPath}`, 409);
  }

  const options: InitOptions = { host: host.replace(/\/$/, ""), realm, clientId, name };
  initCollection(outputPath, options);

  return ok({ path: outputPath }, 201);
});
