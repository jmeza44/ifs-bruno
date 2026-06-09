import fs from "fs";
import path from "path";
import { initCollection, type InitOptions } from "../../../src/core/bruno-writer.ts";
import { readCollectionDetails, readCollectionFolders } from "../../../src/core/collection-reader.ts";
import {
  listCollections,
  saveCollection,
} from "../../../src/core/profile-store.ts";
import { checkInitArgs } from "../../../src/validate-args.ts";
import { err, fieldErr, ok, route } from "../json.ts";

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

export const getCollectionDetails = route((req) => {
  const url = new URL(req.url);
  const collectionPath = url.searchParams.get("path");
  if (!collectionPath) {
    return err("path query parameter is required", 400);
  }

  const resolvedPath = path.resolve(collectionPath);
  if (!fs.existsSync(resolvedPath)) {
    return err(`Collection not found: ${resolvedPath}`, 404);
  }

  const details = readCollectionDetails(resolvedPath);
  if (!details) {
    return err(`Collection details not found: ${resolvedPath}`, 404);
  }

  return ok(details);
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

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Required";
  if (!host) fieldErrors.host = "Required";
  else if (!checkInitArgs({ host }).ok) fieldErrors.host = "Must be a valid URL, e.g. https://acme.ifs.cloud";
  if (!realm) fieldErrors.realm = "Required";
  if (!clientId) fieldErrors.clientId = "Required";
  if (output && !checkInitArgs({ output }).ok) fieldErrors.output = "Parent folder does not exist";

  if (Object.keys(fieldErrors).length > 0) {
    return fieldErr(fieldErrors);
  }

  const outputPath = path.resolve(output);
  if (fs.existsSync(outputPath) && !overwrite) {
    return err(`Output already exists: ${outputPath}`, 409);
  }

  const options: InitOptions = { host: host.replace(/\/$/, ""), realm, clientId, name };
  initCollection(outputPath, options);

  return ok({ path: outputPath }, 201);
});
