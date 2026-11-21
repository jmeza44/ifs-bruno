# 4. Filtro de "categoría" de operación (ToggleGroup, no badge)

## Problema

Hoy cada fila solo muestra el método HTTP (`GET`, `POST`, etc.) como señal
visual. Pero dentro de un mismo método hay formas muy distintas de operación:
de las 491 operaciones, 271 son "GET por clave", 116 son "GET de colección",
34 son acciones custom (`Invoke action *`, vía POST) y 31 son creates
estándar. Un `POST` que crea una entidad y un `POST` que dispara
`FinishSendInvoice` se ven idénticos en la lista, pese a ser conceptualmente
muy distintos (uno es CRUD, el otro es una acción de negocio con semántica
propia).

## Propuesta (revisada)

La primera versión de este doc proponía un segundo badge por fila. Se
descartó: agrega ruido visual a cada fila sin dar control real. En su lugar,
replicar el patrón que ya existe para métodos HTTP en
`endpoint-list-filters.tsx:50-75` — un `ToggleGroup type="multiple"` con
`Set<T>` de valores activos — pero para categoría de entidad en vez de
método. Esto reutiliza un componente ya probado y le da al usuario un filtro
real (ej. apagar "Reference"/"Lookup" para ver solo lo accionable), en vez de
solo un indicador visual que hay que leer fila por fila.

Usa la misma clasificación por tier que la mejora #5 (`core-entity`,
`service-ops`, `reference`, `lookup`), derivada de qué métodos HTTP soporta
cada tag — no requiere una heurística de "shape" por operación aparte. Con
este filtro explícito, el reordenamiento automático de #5 pasa a ser
opcional: el usuario puede simplemente apagar los tiers que no le interesan
en vez de depender de que estén ordenados al fondo.

## Relación con la mejora #5

Comparten la misma clasificación de tier (`endpoint-list.ts` agrupa
operaciones por tag y determina si el tag tiene algún método de escritura).
Conviene implementarlas juntas: #5 calcula y usa el `tier` para ordenar, #4
lo usa para poblar el `ToggleGroup` y filtrar. Es la misma pasada de datos
sirviendo dos features de UI.

## Archivos que cambia

- `src/core/endpoint-list.ts` — agregar el campo derivado `tier` a `EndpointEntry` (compartido con la mejora #5; ver ese doc para el detalle de cómo se calcula).
- `src/types/spec.types.ts` / tipo `EndpointEntry` — agregar `tier` al tipo.
- `ui/frontend/src/lib/types.ts` — agregar `tier` a `EndpointListEntry`.
- `ui/frontend/src/lib/endpoint-search.ts` — definir las 4 categorías de tier como constante (paralelo a `HTTP_METHODS`), para que `endpoint-list-filters.tsx` las pueda mapear igual que hace con los métodos.
- `ui/frontend/src/components/workspace/endpoint/endpoint-list-filters.tsx` — agregar un segundo `ToggleGroup` (Core / Actions / Reference / Lookup) debajo del de métodos, con su propio `activeTiers: Set<Tier>` + `onActiveTiersChange`.
- `ui/frontend/src/components/workspace/endpoint/endpoint-list-panel.tsx` — sumar `activeTiers` al estado local (`useState`) y al filtro dentro del `useMemo` que arma `filtered`, igual que ya hace con `activeMethods`.
- `ui/server/handlers/spec.ts` — confirmar que el campo `tier` viaja sin transformarse en la respuesta que sirve la lista al frontend.

## Alcance

Medio. Cruza la frontera backend/frontend igual que antes (hay que calcular
`tier` en `endpoint-list.ts`), pero el trabajo de frontend es menor que un
badge por fila: es agregar un segundo `ToggleGroup` clonando el patrón
existente, no un componente de presentación nuevo. Si se implementa junto
con #5, el cálculo de `tier` se hace una sola vez y sirve a ambas mejoras.
