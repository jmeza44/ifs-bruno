# 6. Resumen de key parameters en el panel de detalle

## Problema

El panel de detalle muestra el path completo en el header
(`endpoint-detail-panel.tsx:106-108`), y para operaciones con composite keys
grandes (21 ops con 4-7 parámetros de key) eso significa forzar al usuario a
leer una URL de cientos de caracteres armada con `Company='{X}',InvoiceId=
{Y},...` antes de entender qué identifica al recurso. La sección
"Parameters" de abajo sí lista cada parámetro individualmente, pero recién
después de haber tenido que procesar la URL cruda arriba.

## Propuesta

Cuando el path tenga más de N parámetros de key (mismo umbral que en la
mejora #1), mostrar en el header un resumen tipo "6 key parameters" en vez
del path completo, con el path crudo disponible vía `title` (tooltip) o un
toggle "show raw path". Los parámetros individuales siguen listados con
detalle en la sección "Parameters" existente, que ya tiene el formato
nombre + tipo + requerido — no se duplica esa información, solo se evita
repetirla de forma ilegible en el header.

## Archivos que cambia

- `ui/frontend/src/components/workspace/endpoint/endpoint-detail-panel.tsx` — el bloque de header que renderiza `endpoint.path` (líneas ~106-108), agregar la lógica condicional de resumen.
- Reutiliza la misma función de conteo de keys que la mejora #1 — conviene extraerla a un helper compartido (p.ej. `ui/frontend/src/lib/endpoint-path.ts`) en vez de duplicarla entre `endpoint-list-row.tsx` y `endpoint-detail-panel.tsx`.

## Alcance

Bajo, y depende de la mejora #1 si se quiere compartir el helper de conteo
(recomendado hacerlas juntas por eso). Cambio de presentación puro, sin
tocar datos ni contrato.
