import * as p from "@clack/prompts";
import { t } from "../i18n";
import type { IfsProjection } from "../core/ifs-client";

export async function selectProjection(projections: IfsProjection[]): Promise<IfsProjection> {
  const searchTerm = await p.text({
    message: t("projection_selector.search", { count: projections.length }),
    placeholder: t("projection_selector.search_placeholder"),
  });

  if (p.isCancel(searchTerm)) {
    p.cancel(t("common.cancelled"));
    process.exit(0);
  }

  let filtered = projections.filter((proj) => proj.ProjectionName);

  if (searchTerm && searchTerm.trim() !== "") {
    const term = searchTerm.trim().toLowerCase();
    filtered = filtered.filter(
      (proj) =>
        proj.ProjectionName.toLowerCase().includes(term) ||
        (proj.Description ?? "").toLowerCase().includes(term)
    );
  }

  if (filtered.length === 0) {
    p.cancel(t("projection_selector.no_match"));
    process.exit(0);
  }

  const selected = await p.select<IfsProjection>({
    message: t("projection_selector.select", {
      count: filtered.length,
      plural: filtered.length === 1 ? "" : "s",
    }),
    options: filtered.map((proj) => ({
      value: proj,
      label: proj.ProjectionName,
      hint: proj.Description ?? undefined,
    })),
  });

  if (p.isCancel(selected)) {
    p.cancel(t("common.cancelled"));
    process.exit(0);
  }

  return selected as IfsProjection;
}
