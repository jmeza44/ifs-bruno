import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useApp, useStdout } from "ink";
import fs from "fs";
import path from "path";
import { t } from "../i18n";
import { loadSpec } from "../core/spec-loader";
import { RequestBuilder } from "../core/request-builder";
import { loadCollection, upsertRequests } from "../core/bruno-writer";
import { buildEndpointList } from "./endpoint-selector";
import { EndpointSelector } from "./EndpointSelector";
import { getProfile, listCollections, saveCollection, type CollectionEntry } from "../core/profile-store";
import { fetchProjections, fetchOpenApiSpec, type IfsProjection } from "../core/ifs-client";
import type { SwaggerSpec, Operation } from "../types/spec.types";
import type { EndpointEntry } from "../types/tool.types";

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase =
  | { id: "collection" }
  | { id: "collection-input" }
  | { id: "loading-projections"; collection: string }
  | { id: "select-projection"; collection: string; projections: IfsProjection[] }
  | { id: "loading-spec"; collection: string; projection: string; projections: IfsProjection[] }
  | { id: "loading-spec-file"; collection: string; specPath: string }
  | { id: "select-endpoints"; collection: string; spec: SwaggerSpec; entries: EndpointEntry[]; prev: Phase }
  | { id: "confirm"; collection: string; spec: SwaggerSpec; selected: EndpointEntry[] }
  | { id: "writing"; collection: string; spec: SwaggerSpec; selected: EndpointEntry[] }
  | { id: "done"; collection: string; spec: SwaggerSpec; created: number; updated: number }
  | { id: "error"; message: string }
  | { id: "cancelled" };

export interface AddFlowProps {
  specPath?: string;
  collectionPath?: string;
  profileName?: string;
}

// ─── Small reusable components ───────────────────────────────────────────────

function Spinner({ label }: { label: string }) {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % frames.length), 80);
    return () => clearInterval(id);
  }, []);
  return (
    <Box gap={1}>
      <Text color="cyan">{frames[frame]}</Text>
      <Text>{label}</Text>
    </Box>
  );
}

// ─── Collection selector ─────────────────────────────────────────────────────

function CollectionSelect({ onSelect }: { onSelect: (p: string) => void }) {
  const saved = listCollections().filter((c) => fs.existsSync(path.join(c.path, "opencollection.yml")));
  const options = [
    ...saved.map((c: CollectionEntry) => c.path),
    "__other__",
  ];
  const [cursor, setCursor] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) setCursor((c) => Math.max(0, c - 1));
    if (key.downArrow) setCursor((c) => Math.min(options.length - 1, c + 1));
    if (key.return) onSelect(options[cursor]!);
  });

  return (
    <Box flexDirection="column" gap={1} paddingX={2}>
      <Text bold>{t("add.prompt_select_collection")}</Text>
      {options.map((opt, i) => {
        const isCursor = i === cursor;
        const entry = saved[i];
        const label = opt === "__other__" ? t("add.collection_other") : opt;
        const hint = entry
          ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.lastUsed))
          : undefined;
        return (
          <Box key={opt} gap={1}>
            <Text color={isCursor ? "cyan" : "gray"}>{isCursor ? "›" : " "}</Text>
            <Text color={isCursor ? "white" : undefined}>{label}</Text>
            {hint && <Text dimColor>{hint}</Text>}
          </Box>
        );
      })}
    </Box>
  );
}

// ─── Collection path input ────────────────────────────────────────────────────

function CollectionInput({ onSubmit }: { onSubmit: (p: string) => void }) {
  const [value, setValue] = useState("");

  useInput((input, key) => {
    if (key.return) { onSubmit(path.resolve(value.trim() || ".")); return; }
    if (key.backspace || key.delete) { setValue((v) => v.slice(0, -1)); return; }
    if (input && !key.ctrl && !key.meta) setValue((v) => v + input);
  });

  return (
    <Box flexDirection="column" gap={1} paddingX={2}>
      <Text bold>{t("add.prompt_collection_path")}</Text>
      <Box gap={1}>
        <Text dimColor>›</Text>
        <Text>{value || <Text dimColor>collections/TEST-AUTH</Text>}█</Text>
      </Box>
    </Box>
  );
}

// ─── Projection selector ──────────────────────────────────────────────────────

function ProjectionSelect({ projections, onSelect }: { projections: IfsProjection[]; onSelect: (p: IfsProjection) => void }) {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"search" | "select">("search");
  const [cursor, setCursor] = useState(0);
  const { stdout } = useStdout();
  // header(1) + gap(1) + search(1) + gap(1) + select-label(1) + pagination(1) + paddingY(2) = 8 fixed lines
  const visibleCount = Math.max(2, Math.floor(((stdout?.rows ?? 24) - 8) / 2));


  const filtered = projections.filter((p) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return p.ProjectionName.toLowerCase().includes(term) || (p.Description ?? "").toLowerCase().includes(term);
  });

  useInput((input, key) => {
    if (mode === "search") {
      if (key.return) { setMode("select"); setCursor(0); return; }
      if (key.backspace || key.delete) { setSearch((s) => s.slice(0, -1)); return; }
      if (input && !key.ctrl && !key.meta) setSearch((s) => s + input);
      return;
    }
    if (key.upArrow) setCursor((c) => Math.max(0, c - 1));
    if (key.downArrow) setCursor((c) => Math.min(filtered.length - 1, c + 1));
    if (key.return && filtered[cursor]) onSelect(filtered[cursor]!);
    if (key.escape) { setMode("search"); }
  });

  return (
    <Box flexDirection="column" gap={1} paddingX={2}>
      <Box gap={1}>
        <Text bold>{t("projection_selector.search", { count: projections.length })}</Text>
        <Text dimColor>{t("projection_selector.search_hint")}</Text>
      </Box>
      <Box gap={1}>
        <Text dimColor>{mode === "search" ? "›" : " "}</Text>
        <Text>{search || <Text dimColor>{t("projection_selector.search_placeholder")}</Text>}{mode === "search" ? "█" : ""}</Text>
      </Box>
      {mode === "select" && (
        <Box flexDirection="column" marginTop={1}>
          <Text dimColor>{t("projection_selector.select", { count: filtered.length, plural: filtered.length === 1 ? "" : "s" })}</Text>
          {(() => {
            const offset = Math.max(0, cursor - Math.floor(visibleCount / 2));
            const visible = filtered.slice(offset, offset + visibleCount);
            return (
              <>
                {visible.map((proj, i) => {
                  const absIdx = offset + i;
                  const isCursor = absIdx === cursor;
                  return (
                    <Box key={proj.ProjectionName} flexDirection="column">
                      <Box gap={1}>
                        <Text color={isCursor ? "cyan" : "gray"}>{isCursor ? "›" : " "}</Text>
                        <Text color={isCursor ? "white" : undefined} bold={isCursor}>{proj.ProjectionName}</Text>
                      </Box>
                      {proj.Description && (
                        <Box paddingLeft={2}>
                          <Text dimColor wrap="wrap">{proj.Description.replace(/\s+/g, " ").trim()}</Text>
                        </Box>
                      )}
                    </Box>
                  );
                })}
                {filtered.length > visibleCount && (
                  <Text dimColor>  {cursor + 1}/{filtered.length}</Text>
                )}
              </>
            );
          })()}
        </Box>
      )}
    </Box>
  );
}

// ─── Confirm screen ───────────────────────────────────────────────────────────

function Confirm({ selected, onConfirm, onCancel }: { selected: EndpointEntry[]; onConfirm: () => void; onCancel: () => void }) {
  const [choice, setChoice] = useState(true);

  useInput((input, key) => {
    if (key.leftArrow || key.rightArrow) setChoice((c) => !c);
    if (input === "y") { setChoice(true); }
    if (input === "n") { setChoice(false); }
    if (key.return) { choice ? onConfirm() : onCancel(); }
    if (key.escape) onCancel();
  });

  return (
    <Box flexDirection="column" gap={1} paddingX={2}>
      <Text bold>{selected.length} endpoint(s) selected:</Text>
      {selected.slice(0, 8).map((e) => (
        <Text key={`${e.method}:${e.path}`} dimColor>  [{e.method.toUpperCase()}] {e.path}</Text>
      ))}
      {selected.length > 8 && <Text dimColor>  …+{selected.length - 8} more</Text>}
      <Box gap={2} marginTop={1}>
        <Text>{t("add.confirm_add")}</Text>
        <Text color={choice ? "green" : "gray"} bold={choice}>● Yes</Text>
        <Text color={!choice ? "red" : "gray"} bold={!choice}>○ No</Text>
      </Box>
      <Text dimColor>← → toggle  enter confirm  esc cancel</Text>
    </Box>
  );
}

// ─── Main flow ────────────────────────────────────────────────────────────────

export function AddFlow({ specPath, collectionPath, profileName }: AddFlowProps) {
  const { exit } = useApp();

  const initialPhase = (): Phase => {
    if (collectionPath) {
      if (profileName) return { id: "loading-projections", collection: collectionPath };
      if (specPath) return { id: "loading-spec-file", collection: collectionPath, specPath };
    }
    return { id: "collection" };
  };

  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [log, setLog] = useState<string[]>([]);

  function addLog(msg: string) {
    setLog((l) => [...l, msg]);
  }

  // Side effects triggered by phase transitions
  useEffect(() => {
    if (phase.id === "loading-projections") {
      let cancelled = false;
      const profile = getProfile(profileName!);
      if (!profile) { setPhase({ id: "error", message: t("add.profile_not_found", { name: profileName }) }); return; }
      addLog(t("add.connecting", { host: profile.host }));
      fetchProjections(profile)
        .then((projections) => {
          if (cancelled) return;
          addLog(t("add.projections_available", { count: projections.length }));
          setPhase({ id: "select-projection", collection: phase.collection, projections });
        })
        .catch((err: Error) => { if (!cancelled) setPhase({ id: "error", message: err.message }); });
      return () => { cancelled = true; };
    }

    if (phase.id === "loading-spec") {
      let cancelled = false;
      const profile = getProfile(profileName!);
      if (!profile) { setPhase({ id: "error", message: t("add.profile_not_found", { name: profileName }) }); return; }
      addLog(t("add.loading_spec", { name: phase.projection }));
      fetchOpenApiSpec(profile, phase.projection)
        .then((spec) => {
          if (cancelled) return;
          const entries = buildEndpointList(spec);
          setLog([]);
          setPhase({ id: "select-endpoints", collection: phase.collection, spec, entries, prev: { id: "select-projection", collection: phase.collection, projections: phase.projections } });
        })
        .catch((err: Error) => { if (!cancelled) setPhase({ id: "error", message: err.message }); });
      return () => { cancelled = true; };
    }

    if (phase.id === "loading-spec-file") {
      addLog(t("add.loading_spec_file"));
      try {
        const spec = loadSpec(phase.specPath);
        addLog(t("add.spec_file_loaded", { title: spec.info.title, count: Object.keys(spec.paths).length }));
        const entries = buildEndpointList(spec);
        setLog([]);
        setPhase({ id: "select-endpoints", collection: phase.collection, spec, entries, prev: { id: "collection" } });
      } catch (err) {
        setPhase({ id: "error", message: (err as Error).message });
      }
    }

    if (phase.id === "writing") {
      try {
        loadCollection(phase.collection);
        const builder = new RequestBuilder(phase.spec);
        const builtRequests = phase.selected.map((entry, index) => {
          const operation = (phase.spec.paths[entry.path] as Record<string, Operation>)[entry.method];
          return builder.build(entry.path, entry.method, operation, index + 1);
        });
        const result = upsertRequests(phase.collection, phase.spec.info.title, builtRequests);
        saveCollection(phase.collection);
        setPhase({ id: "done", collection: phase.collection, spec: phase.spec, created: result.created, updated: result.updated });
      } catch (err) {
        setPhase({ id: "error", message: (err as Error).message });
      }
    }

    if (phase.id === "done" || phase.id === "error" || phase.id === "cancelled") {
      setTimeout(exit, 100);
    }
  }, [phase.id]);

  // Collection selection: if collectionPath given but need projections/spec
  function handleCollectionSelected(selected: string) {
    if (selected === "__other__") {
      setPhase({ id: "collection-input" });
      return;
    }
    advanceFromCollection(selected);
  }

  function advanceFromCollection(collection: string) {
    if (profileName) setPhase({ id: "loading-projections", collection });
    else if (specPath) setPhase({ id: "loading-spec-file", collection, specPath });
    else setPhase({ id: "error", message: t("add.need_spec_or_profile") });
  }

  return (
    <Box flexDirection="column" gap={1} paddingY={1}>
      {/* Header */}
      <Box paddingX={2}>
        <Text backgroundColor="cyan" color="black"> {t("add.intro")} </Text>
      </Box>

      {/* Log lines */}
      {log.map((line, i) => (
        <Box key={i} paddingX={2} gap={1}>
          <Text color="green">✓</Text>
          <Text dimColor>{line}</Text>
        </Box>
      ))}

      {/* Active phase */}
      {phase.id === "collection" && (
        <CollectionSelect onSelect={handleCollectionSelected} />
      )}

      {phase.id === "collection-input" && (
        <CollectionInput onSubmit={(p) => advanceFromCollection(p)} />
      )}

      {(phase.id === "loading-projections" || phase.id === "loading-spec" || phase.id === "loading-spec-file" || phase.id === "writing") && (
        <Box paddingX={2}>
          <Spinner label={
            phase.id === "loading-projections" ? t("add.connecting", { host: "" }) :
            phase.id === "loading-spec" ? t("add.loading_spec", { name: phase.projection }) :
            phase.id === "loading-spec-file" ? t("add.loading_spec_file") :
            "Writing files..."
          } />
        </Box>
      )}

      {phase.id === "select-projection" && (
        <ProjectionSelect
          projections={phase.projections}
          onSelect={(proj) => setPhase({ id: "loading-spec", collection: phase.collection, projection: proj.ProjectionName, projections: phase.projections })}
        />
      )}

      {/* Known limitation: navigating back to select-projection and selecting any projection
          causes EndpointSelector to freeze (input stops responding). Root cause is an Ink
          bug where useInput's setRawMode cleanup fires after the new mount's setup when the
          parent re-renders during the phase transition, leaving raw mode disabled.
          Workaround: press Enter to unfreeze. */}
      {phase.id === "select-endpoints" && (
        <EndpointSelector
          entries={phase.entries}
          spec={phase.spec}
          onSubmit={(selected) => setPhase({ id: "confirm", collection: phase.collection, spec: phase.spec, selected })}
          onCancel={() => setPhase(phase.prev)}
        />
      )}

      {phase.id === "confirm" && (
        <Confirm
          selected={phase.selected}
          onConfirm={() => setPhase({ id: "writing", collection: phase.collection, spec: phase.spec, selected: phase.selected })}
          onCancel={() => setPhase({ id: "cancelled" })}
        />
      )}

      {phase.id === "done" && (
        <Box paddingX={2} flexDirection="column" gap={1}>
          <Text color="green">✓ {t("add.outro_done", { created: phase.created, updated: phase.updated })}</Text>
          <Text dimColor>{path.join(phase.collection, phase.spec.info.title)}{path.sep}</Text>
        </Box>
      )}

      {phase.id === "error" && (
        <Box paddingX={2}>
          <Text color="red">✗ {phase.message}</Text>
        </Box>
      )}

      {phase.id === "cancelled" && (
        <Box paddingX={2}>
          <Text dimColor>{t("common.cancelled")}</Text>
        </Box>
      )}
    </Box>
  );
}
