# 5. Ordenar la lista por relevancia real (writability), no alfabéticamente

## Problema (revisado con análisis de datos)

La propuesta original era detectar el patrón `Reference_*Lov` y mandarlo al
final. Analizando el spec completo con Python encontré una señal mucho más
fuerte y exacta que ese patrón de naming: **qué métodos HTTP soporta cada
entidad**.

De los 105 tags del spec:

| Categoría | Tags | Operaciones | Métodos |
|---|---|---|---|
| **core-entity** (sin prefijo `Reference_`/`Lookup_`) | 10 | 199 | GET + POST/PATCH/DELETE |
| **service-ops** (`Service Operations - *`) | 2 | 100 | acciones/funciones de negocio (POST) |
| **reference** (`Reference_*`) | 90 | 186 | solo GET (183 GET, 3 PUT sueltos) |
| **lookup** (`Lookup_*`, catálogos ISO genéricos) | 3 | 6 | solo GET |

La correlación es exacta, no aproximada: **de los 105 tags, exactamente 10
tienen algún método de escritura (POST/PATCH/DELETE), y son exactamente los
10 tags "core-entity"** — cero solapamiento con `Reference_`/`Lookup_`. Es
una partición limpia del spec: las entidades que el usuario puede crear o
modificar son las relevantes; el resto es dato de referencia de solo lectura
para poblar esas entidades (dropdowns, catálogos). El patrón `*Lov` original
solo capturaba 12 de esos 90 tags de referencia — dejaba afuera 78 entidades
igual de "no accionables" como `Reference_CustomerTaxInfo` o
`Reference_SalesPart`.

## Propuesta

Ordenar la lista completa en 4 niveles (tiers), no solo "LOV al final":

1. **Core entities** — ordenadas por cantidad de operaciones descendente (más
   operaciones ≈ superficie más grande de la entidad; `CustomerOrderInvHeadSet`
   con 75 ops queda primera).
2. **Service Operations** — acciones/funciones de negocio (`Invoke action X`),
   no son entidades navegables pero sí acciones que el usuario ejecuta.
3. **Reference_\*** — lookups específicos del dominio de esta projection.
4. **Lookup_\*** — catálogos genéricos (ISO country/currency/unit), los menos
   específicos del dominio, al final de todo.

Dentro de cada tier se mantiene el orden/relevancia existente (alfabético o
por búsqueda). Es el mismo tipo de cambio que la versión anterior del doc:
un comparador adicional en el `useMemo` que arma `filtered`, sin tocar el
virtualizador ni el modelo de datos.

## Archivos que cambia

- `ui/frontend/src/lib/endpoint-search.ts` — nueva función `classifyEndpointTier(tag)` (o similar) que devuelve el número de tier según el prefijo del tag, y un comparador `compareByRelevanceTier` para usar junto a (o en reemplazo de) `sortByRelevance`.
- `ui/frontend/src/components/workspace/endpoint/endpoint-list-panel.tsx` — aplicar el nuevo comparador en el `useMemo` que calcula `filtered`, definiendo si el tier gana siempre o solo cuando no hay término de búsqueda activo (con búsqueda activa, probablemente conviene que gane la relevancia de texto, no el tier).
- **Importante**: esta clasificación depende de qué métodos definió el spec para cada tag — no puede derivarse solo del `path` en el frontend como en las mejoras #1/#6. Necesita el listado de operaciones por tag ya calculado, algo que hoy arma `buildEndpointList` en `src/core/endpoint-list.ts`. Conviene evaluar si el tier se calcula ahí (junto al resto de `EndpointEntry`) en vez de re-derivarlo en el cliente a partir de entries sueltas — mismo trade-off de diseño que quedó anotado en la mejora #4.

## Alcance

Bajo-medio. La lógica en sí es simple (un mapa de tag → tier), pero a
diferencia de la versión anterior del doc, calcular el tier requiere conocer
los métodos de *todas* las operaciones de un tag, no solo el nombre del tag
en la fila actual — por eso probablemente conviene precalcularlo una vez en
`endpoint-list.ts` en vez de recalcularlo en cada render del panel. Sigue sin
tocar el virtualizador; reversible con solo quitar el comparador.
