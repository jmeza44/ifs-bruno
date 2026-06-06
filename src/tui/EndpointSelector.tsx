import React, { useState, useMemo } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import type { EndpointEntry } from "../types/tool.types";
import type { Operation, ParameterObject, SwaggerSpec, PathItem } from "../types/spec.types";

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];

const METHOD_COLORS: Record<HttpMethod, string> = {
  get: "green",
  post: "blue",
  put: "yellow",
  patch: "cyan",
  delete: "red",
};

interface Props {
  entries: EndpointEntry[];
  spec: SwaggerSpec;
  onSubmit: (selected: EndpointEntry[]) => void;
  onCancel: () => void;
}

function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.slice(0, max - 1) + "…";
}

function getOperation(spec: SwaggerSpec, entry: EndpointEntry): Operation | undefined {
  const pathItem = spec.paths[entry.path] as PathItem | undefined;
  return pathItem?.[entry.method as HttpMethod];
}

export function EndpointSelector({ entries, spec, onSubmit, onCancel }: Props) {
  const { stdout } = useStdout();
  const termWidth = stdout?.columns ?? 80;
  // left panel is 55% wide; subtract borders (2), padding (2), checkbox+space (2), method+space (7)
  const pathMax = Math.max(10, Math.floor(termWidth * 0.55) - 13);

  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [keyword, setKeyword] = useState("");
  const [activeMethods, setActiveMethods] = useState<Set<HttpMethod>>(new Set(HTTP_METHODS));
  const [mode, setMode] = useState<"list" | "search">("list");


  const filtered = useMemo(() => {
    const term = keyword.toLowerCase();
    return entries.filter((e) => {
      if (!activeMethods.has(e.method as HttpMethod)) return false;
      if (!term) return true;
      return (
        e.path.toLowerCase().includes(term) ||
        e.summary.toLowerCase().includes(term) ||
        e.operationId.toLowerCase().includes(term)
      );
    });
  }, [entries, keyword, activeMethods]);

  const safeCursor = Math.min(cursor, Math.max(0, filtered.length - 1));
  const current = filtered[safeCursor];
  const operation = current ? getOperation(spec, current) : undefined;
  const params = (operation?.parameters ?? []) as ParameterObject[];
  const responses = Object.keys(operation?.responses ?? {});

  function entryKey(e: EndpointEntry) {
    return `${e.method}:${e.path}`;
  }

  useInput((input, key) => {
    if (mode === "search") {
      if (key.escape) {
        if (!keyword) { onCancel(); return; }
        setMode("list");
        setCursor(0);
        return;
      }
      if (key.return) {
        setMode("list");
        setCursor(0);
        return;
      }
      if (key.backspace || key.delete) {
        setKeyword((k) => k.slice(0, -1));
        return;
      }
      if (input && !key.ctrl && !key.meta) {
        setKeyword((k) => k + input);
      }
      return;
    }

    // list mode
    if (key.escape) { onCancel(); return; }
    if (input === "/") { setMode("search"); return; }
    if (input === "a") {
      if (selected.size === filtered.length) {
        setSelected(new Set());
      } else {
        setSelected(new Set(filtered.map(entryKey)));
      }
      return;
    }

    // method toggles
    const methodKeys: Record<string, HttpMethod> = { g: "get", p: "post", u: "put", c: "patch", d: "delete" };
    if (methodKeys[input]) {
      const m = methodKeys[input]!;
      setActiveMethods((prev) => {
        const next = new Set(prev);
        next.has(m) ? next.delete(m) : next.add(m);
        return next;
      });
      setCursor(0);
      return;
    }

    if (key.upArrow) { setCursor((c) => Math.max(0, c - 1)); return; }
    if (key.downArrow) { setCursor((c) => Math.min(filtered.length - 1, c + 1)); return; }
    if (key.pageUp) { setCursor((c) => Math.max(0, c - 10)); return; }
    if (key.pageDown) { setCursor((c) => Math.min(filtered.length - 1, c + 10)); return; }

    if (input === " " && current) {
      const k = entryKey(current);
      setSelected((prev) => {
        const next = new Set(prev);
        next.has(k) ? next.delete(k) : next.add(k);
        return next;
      });
      return;
    }

    if (key.return) {
      if (selected.size === 0) return;
      const result = entries.filter((e) => selected.has(entryKey(e)));
      onSubmit(result);
    }
  });

  const visibleCount = 18;
  const scrollOffset = Math.max(0, safeCursor - Math.floor(visibleCount / 2));
  const visible = filtered.slice(scrollOffset, scrollOffset + visibleCount);

  return (
    <Box flexDirection="column" height={28}>
      {/* header */}
      <Box gap={2} paddingX={1} marginBottom={1}>
        <Text bold>Endpoints</Text>
        <Text dimColor>{filtered.length}/{entries.length} shown · {selected.size} selected</Text>
        <Box flexGrow={1} />
        {HTTP_METHODS.map((m) => (
          <Text key={m} color={activeMethods.has(m) ? METHOD_COLORS[m] : undefined} dimColor={!activeMethods.has(m)}>
            {m.toUpperCase()[0]}={m.toUpperCase()}
          </Text>
        ))}
      </Box>

      {/* search bar */}
      <Box paddingX={1} marginBottom={1}>
        <Text dimColor>{mode === "search" ? "▶ " : "/ "}</Text>
        <Text>{keyword || (mode === "search" ? "" : "type / to search...")}{mode === "search" ? "█" : ""}</Text>
      </Box>

      {/* main panels */}
      <Box flexDirection="row" flexGrow={1} gap={1}>
        {/* left: list */}
        <Box flexDirection="column" width="55%" borderStyle="single" borderColor="gray" paddingX={1}>
          {visible.length === 0 ? (
            <Text dimColor>No endpoints match.</Text>
          ) : (
            visible.map((e, i) => {
              const absIdx = scrollOffset + i;
              const isCursor = absIdx === safeCursor;
              const isSelected = selected.has(entryKey(e));
              const method = e.method as HttpMethod;
              return (
                <Box key={entryKey(e)} gap={1}>
                  <Text color={isSelected ? "green" : "gray"}>{isSelected ? "●" : "○"}</Text>
                  <Text bold={isCursor} color={isCursor ? "white" : undefined} backgroundColor={isCursor ? "blue" : undefined}>
                    <Text color={METHOD_COLORS[method]}>{e.method.toUpperCase().padEnd(6)}</Text>
                    <Text>{truncate(e.path, pathMax)}</Text>
                  </Text>
                </Box>
              );
            })
          )}
        </Box>

        {/* right: detail */}
        <Box flexDirection="column" width="45%" borderStyle="single" borderColor="gray" paddingX={1} gap={1}>
          {current ? (
            <>
              <Box gap={1}>
                <Text color={METHOD_COLORS[current.method as HttpMethod]} bold>
                  {current.method.toUpperCase()}
                </Text>
                <Text bold wrap="wrap">{current.path}</Text>
              </Box>
              {operation?.summary && <Text dimColor wrap="wrap">{operation.summary}</Text>}
              {operation?.description && operation.description !== operation.summary && (
                <Text dimColor wrap="wrap">{truncate(operation.description.split("\n")[0]!, 80)}</Text>
              )}
              {params.length > 0 && (
                <Box flexDirection="column" gap={0}>
                  <Text bold dimColor>Parameters</Text>
                  {params.slice(0, 8).map((p, i) => (
                    <Box key={`${p.name}-${i}`} gap={1}>
                      <Text color={p.required ? "yellow" : "gray"}>{p.required ? "●" : "○"}</Text>
                      <Text>{p.name}</Text>
                      <Text dimColor>({p.in})</Text>
                    </Box>
                  ))}
                  {params.length > 8 && <Text dimColor>  …+{params.length - 8} more</Text>}
                </Box>
              )}
              {responses.length > 0 && (
                <Box flexDirection="column">
                  <Text bold dimColor>Responses</Text>
                  <Text dimColor>{responses.join("  ")}</Text>
                </Box>
              )}
              {operation?.operationId && (
                <Text dimColor>ID: {operation.operationId}</Text>
              )}
            </>
          ) : (
            <Text dimColor>No endpoints match.</Text>
          )}
        </Box>
      </Box>

      {/* footer */}
      <Box paddingX={1} marginTop={1} gap={3}>
        <Text dimColor>↑↓ navigate</Text>
        <Text dimColor>space select</Text>
        <Text dimColor>a select all</Text>
        <Text dimColor>/ search</Text>
        <Text dimColor>g=GET p=POST u=PUT c=PATCH d=DELETE toggle</Text>
        <Text dimColor>enter confirm</Text>
        <Text dimColor>esc go back</Text>
        {selected.size === 0 && mode === "list" && (
          <Text color="yellow">select at least one endpoint</Text>
        )}
      </Box>
    </Box>
  );
}
