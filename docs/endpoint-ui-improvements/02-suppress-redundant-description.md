# 2. Ocultar summary/description cuando son ruido mecánico

## Problema

En el 93.7% de las operaciones (460/491), `description` es idéntico a
`summary`. El panel de detalle ya oculta `description` si es *literalmente*
igual a `summary` (`endpoint-detail-panel.tsx:165`), pero el `summary` que
queda es casi siempre texto generado mecánicamente por IFS
(`"Get entity from X by key."`, `"Invoke action Y"`) que no aporta nada sobre
el método + tag que ya se ven en el header. Ocupa una sección entera
("Description") para repetir lo obvio.

## Propuesta

Detectar los patrones mecánicos conocidos de IFS (`Get entit* from`,
`Invoke action`, `Add new entity to`, `Update entity in`, `Delete entity
from`) con una función simple, y no renderizar la sección "Description"
cuando el summary matchea uno de esos patrones. Si en algún caso el summary
trae texto adicional real (fuera del patrón), sí se muestra. Esto libera
espacio en el panel para información que hoy compite por lugar (parámetros,
responses).

## Archivos que cambia

- `ui/frontend/src/components/workspace/endpoint/endpoint-detail-panel.tsx` — la condición que decide si renderizar la sección "Description" (líneas ~158-171).
- Posiblemente un nuevo archivo pequeño `ui/frontend/src/lib/endpoint-summary.ts` con la función `isGenericSummary(summary, tag)` para no ensuciar el componente con regexes inline.

## Alcance

Bajo. Cambio puramente de presentación en un componente; no toca el modelo de
datos (`EndpointDetail` sigue trayendo `summary`/`description` igual). Riesgo
principal: si IFS cambia el wording exacto de sus templates en otra
projection, el patrón podría no matchear — no rompe nada, solo deja de
ocultar (fallback seguro).
