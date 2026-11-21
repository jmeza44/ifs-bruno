# 3. Incluir operationId y summary en el ranking de búsqueda

## Corrección sobre el análisis anterior

Dije que `operationId` "no se usa como filtro". Verificado en
`endpoint-list-panel.tsx:41-45`: el **filtro** sí matchea contra `path`,
`summary` y `operationId`. Lo que sí es cierto es que el **ranking de
relevancia** (`sortByRelevance` en `ui/frontend/src/lib/endpoint-search.ts`)
solo considera `path` (línea 25: `rankEndpointMatch(a.path, term)`). Entonces
si buscás `"FinishSendInvoice"`, el resultado aparece en la lista (el filtro
lo encuentra) pero puede quedar ordenado abajo, después de paths que
contienen la palabra por casualidad, porque el ranking ignora dónde matcheó.

## Propuesta

Extender `rankEndpointMatch` para que compare contra `path`, `operationId` y
`summary`, quedándose con el mejor rank de los tres (exact > starts-with >
contains) en vez de mirar solo `path`. Así una búsqueda por nombre de acción
sube al tope igual que una búsqueda por path.

## Archivos que cambia

- `ui/frontend/src/lib/endpoint-search.ts` — `rankEndpointMatch` y `sortByRelevance` (recibir el entry completo, no solo `path`, para poder comparar los tres campos).
- `ui/frontend/src/components/workspace/endpoint/endpoint-list-panel.tsx` — la llamada a `sortByRelevance(matched, search)` no cambia de forma, pero conviene revisar que `matched` ya trae `summary`/`operationId` (los trae).

## Alcance

Muy bajo. Cambio aislado a una función pura con comportamiento bien definido;
fácil de cubrir con un test unitario si el proyecto tiene tests para
`endpoint-search.ts`.
