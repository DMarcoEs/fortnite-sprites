# Filtros y estadísticas

## Qué hace

Encontrar rápido lo que buscas entre 117 entradas, y ver el progreso desglosado.

**Archivos:** [`js/filters.js`](../js/filters.js) · [`js/render.js`](../js/render.js)

## Cómo funciona

### Cadena de filtrado

`filterEntries()` recorre `catalog.flat` y aplica en orden: búsqueda de texto → rareza →
variante → temporada → estado. Después `groupEntries()` agrupa y ordena el resultado.

| Control | Opciones |
|---|---|
| Búsqueda | por nombre de sprite o de variante, sin distinguir mayúsculas |
| Rareza | Rare · Epic · Legendary · Mythic |
| Variante | las 8 |
| Estado | todos · me faltan · ya los tengo · masterizados · en búsqueda |
| Agrupar por | sprite · variante · rareza |
| Orden | rareza · A-Z |

Agrupar y ordenar se guardan en `prefs`; el resto se reinicia en cada visita — son
búsquedas del momento, no preferencias.

Cuando agrupas por variante o por rareza, las fichas muestran también el nombre del sprite,
porque el título del grupo ya no lo dice.

### Estadísticas

`computeStats()` devuelve, en una sola pasada:

- **Colección** — obtenidas / lanzadas, con porcentaje
- **Mastery** — sprites masterizados / 30 (ver [coleccion.md](coleccion.md))
- **Desglose por rareza** — barra por cada una
- **Desglose por variante** — barra por cada una

> **Las entradas no lanzadas no cuentan.** El denominador es siempre `totalReleased` (127),
> no `totalAll`. Si contaran, tu porcentaje bajaría cada vez que Epic anuncia algo,
> lo cual es absurdo.

Cada barra usa el color de su rareza o variante, tomado del JSON.

## Decisiones y por qué

**Filtros en la barra, no en un panel plegable.** Con seis controles cabe todo en una fila
y se ve el estado del filtrado sin abrir nada.

**Se repinta todo en cada cambio.** Con 117 fichas la diferencia es imperceptible y evita
por completo los bugs de sincronización de un renderizado incremental. Si el catálogo
creciera mucho, aquí es donde habría que optimizar.

**Agrupar por variante como opción de primera clase.** "¿Cuántas Gold me faltan?" es una
pregunta natural en un juego donde las variantes son la parte difícil.

**El desglose por variante en el panel principal.** Revela dónde está tu cuello de botella
mucho mejor que el total.

## Evolución

### 2026-08-08 — Sesión 4
- **Se quitó el filtro por temporada.** Al retirar los sprites de Season 4 quedó una sola
  temporada, y un desplegable con una opción solo estorba. El código que lo soporta sigue en
  `filters.js` para cuando salga la siguiente.
- Los denominadores pasaron de 127 a **117**.

### 2026-08-08 — Sesión 2
- **Nuevo filtro por temporada**, necesario al entrar Chapter 7 Season 4.
- Los desgloses se recalcularon sobre 127 lanzadas en vez de 117.
- Las estadísticas se pintan sin `innerHTML` (ver [seguridad.md](seguridad.md)).
- Al agrupar por variante o rareza, las fichas muestran el nombre del sprite.
- El contador de cada grupo ahora ignora las entradas no lanzadas.

### 2026-08-08 — Sesión 1
- Búsqueda, filtros de rareza/variante/estado, agrupación y orden.
- `computeStats()` con doble progreso y desgloses.
- Se decidió excluir las no lanzadas del denominador.
