import * as p from "@clack/prompts";
import type { IfsProjection } from "../core/ifs-client";

export async function selectProjection(projections: IfsProjection[]): Promise<IfsProjection> {
  const searchTerm = await p.text({
    message: `Buscar projection  (${projections.length} disponibles):`,
    placeholder: "e.g. WorkTask, PurchaseOrder",
  });

  if (p.isCancel(searchTerm)) {
    p.cancel("Cancelado.");
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
    p.cancel("Ninguna projection coincide con la búsqueda.");
    process.exit(0);
  }

  const selected = await p.select<IfsProjection>({
    message: `Seleccioná una projection  (${filtered.length} resultado${filtered.length === 1 ? "" : "s"}):`,
    options: filtered.map((proj) => ({
      value: proj,
      label: proj.ProjectionName,
      hint: proj.Description ?? undefined,
    })),
  });

  if (p.isCancel(selected)) {
    p.cancel("Cancelado.");
    process.exit(0);
  }

  return selected as IfsProjection;
}
