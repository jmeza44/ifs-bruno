import * as p from "@clack/prompts";
import { t } from "../i18n";
import type { SwaggerSpec, PathItem, Operation } from "../types/spec.types";
import type { EndpointEntry } from "../types/tool.types";

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

export async function selectEndpoints(entries: EndpointEntry[]): Promise<EndpointEntry[]> {
  const tags = [...new Set(entries.map((e) => e.tag))].sort();

  const selectedTag = await p.select({
    message: t("endpoint_selector.select_tag", { tags: tags.length, total: entries.length }),
    options: [
      { value: "__ALL__", label: t("endpoint_selector.all_endpoints", { count: entries.length }) },
      ...tags.map((tag) => {
        const count = entries.filter((e) => e.tag === tag).length;
        return { value: tag, label: `${tag}  (${count})` };
      }),
    ],
    maxItems: 12,
  });

  if (p.isCancel(selectedTag)) {
    p.cancel(t("common.cancelled"));
    process.exit(0);
  }

  let filtered =
    selectedTag === "__ALL__" ? entries : entries.filter((e) => e.tag === selectedTag);

  const selectedMethods = await p.multiselect<string>({
    message: t("endpoint_selector.filter_method"),
    options: HTTP_METHODS.map((m) => ({ value: m, label: m.toUpperCase() })),
    initialValues: [...HTTP_METHODS],
    required: true,
  });

  if (p.isCancel(selectedMethods)) {
    p.cancel(t("common.cancelled"));
    process.exit(0);
  }

  filtered = filtered.filter((e) => (selectedMethods as string[]).includes(e.method));

  const searchTerm = await p.text({
    message: t("endpoint_selector.filter_keyword"),
    placeholder: t("endpoint_selector.filter_placeholder"),
  });

  if (p.isCancel(searchTerm)) {
    p.cancel(t("common.cancelled"));
    process.exit(0);
  }

  if (searchTerm && searchTerm.trim() !== "") {
    const term = searchTerm.trim().toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.path.toLowerCase().includes(term) ||
        e.summary.toLowerCase().includes(term) ||
        e.operationId.toLowerCase().includes(term)
    );
  }

  if (filtered.length === 0) {
    p.cancel(t("endpoint_selector.no_match"));
    process.exit(0);
  }

  const selected = await p.multiselect<EndpointEntry>({
    message: t("endpoint_selector.select_endpoints", {
      count: filtered.length,
      plural: filtered.length === 1 ? "" : "s",
    }),
    options: filtered.map((e) => ({
      value: e,
      label: e.displayLabel,
      hint: e.operationId,
    })),
    maxItems: 12,
    required: true,
  });

  if (p.isCancel(selected)) {
    p.cancel(t("common.cancelled"));
    process.exit(0);
  }

  return selected as EndpointEntry[];
}
