# 1. Colapsar paths con composite keys largas

## Problema

41% de los endpoints (202/491) tiene un path de más de 80 caracteres; 20% supera
los 120. El caso extremo es `GetAmounts(...)` con **570 caracteres** y 17
parámetros de key en una sola línea. El fix reciente (`5bbd507`, wrap en vez de
truncar) evita que el texto se corte, pero para compuestos de 4+ keys (21 ops)
el wrap solo evita el corte — sigue siendo una pared de texto sin estructura
que hay que leer entera para entender qué identifica al recurso.

## Propuesta

En la fila de la lista, cuando el path tenga más de N parámetros de key (por
ejemplo 3), no imprimir la URL completa: mostrar el segmento base
(`/GetAmounts`) seguido de un badge compacto tipo `{17 keys}`. El path completo
sigue disponible vía `title` (tooltip) como ya ocurre hoy. Paths simples (0-3
keys, que son el 84% de los casos) se muestran igual que ahora, sin cambios.

## Archivos que cambia

- `ui/frontend/src/components/workspace/endpoint/endpoint-list-row.tsx` — lógica de render condicional del path (nueva función o componente pequeño para contar/formatear las keys).
- `ui/frontend/src/lib/types.ts` — opcionalmente, si se decide precalcular el conteo de keys en vez de derivarlo en el render (agregar campo a `EndpointListEntry`).
- Sin cambios en backend: el conteo se puede derivar del string `path` en el cliente con una regex simple (`.match(/='\{|=\{/g)`), no requiere tocar `src/core/endpoint-list.ts`.

## Alcance

Bajo. Un solo componente de presentación, sin cambios de datos ni de contrato
API. Reversible con un flag de "expandir siempre" si el resumen resulta
confuso en la práctica.
