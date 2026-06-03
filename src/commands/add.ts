import React from "react";
import process from "process";
import { render } from "ink";
import { AddFlow } from "../tui/AddFlow";

export async function runAdd(specPath: string | undefined, collectionPath: string | undefined, profileName?: string): Promise<void> {
  process.stdin.resume();
  process.stdin.setRawMode(true);

  const { waitUntilExit } = render(
    React.createElement(AddFlow, { specPath, collectionPath, profileName }),
    { stdin: process.stdin }
  );

  await waitUntilExit();
}
