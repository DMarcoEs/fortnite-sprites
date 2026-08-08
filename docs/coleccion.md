# Colección

## Qué hace

El checklist en sí: marcar qué variantes tienes y cuáles has masterizado. Es el corazón
del sitio.

**Archivos:** [`js/store.js`](../js/store.js) · [`js/render.js`](../js/render.js) · [`index.html`](../index.html)

## Cómo funciona

### Los tres estados

Cada ficha cicla con un clic:

| Clic | Estado | Valor |
|---|---|---|
| 1 | ✓ **La tengo** | `OWNED` = 1 |
| 2 | ★ **Masterizada** | `MASTERED` = 2 |
| 3 | vuelve a **Me falta** | `NONE` = 0 |

**Clic derecho** la marca como objetivo (ver [hunt-historial.md](hunt-historial.md)).

Las entradas **no lanzadas** no se pueden marcar: no tiene sentido registrar algo que aún
no existe en el juego.

### Los dos ejes de progreso

El juego tiene dos progresiones distintas y el sitio las lleva separadas:

- **Colección** — cuántas variantes tienes, sobre el total de lanzadas. Hoy `X / 127`.
- **Mastery** — cuántos *sprites* has masterizado, sobre 30. En el juego se mastariza
  subiendo un sprite a nivel 5 y **extrayéndolo vivo**.

> **Cómo se cuenta el Mastery:** un sprite cuenta como masterizado si marcaste su variante
> **Base** como ★. Es una convención del sitio: el juego mastariza el sprite, no la variante,
> y Base es la que todos los sprites tienen. Marcar ★ en una Gold cuenta para "variantes
> masterizadas" del subtítulo, pero no para el contador de 30.

### Dónde se guarda

En `localStorage`, clave `fnsprites.v1`:

```jsonc
{
  "schemaVersion": 1,
  "entries": {
    "water:gold": { "status": 1, "date": "2026-08-05", "note": "en Sweaty Sands" }
  },
  "hunt": ["grim:cube"],
  "friends": [{ "name": "Pedro", "code": "2.AbC…" }],
  "prefs": { "groupBy": "sprite", "sortBy": "rarity" }
}
```

Las entradas en `NONE` **no se guardan**: se borran del objeto. Así el archivo solo crece
con lo que realmente tienes.

`store.js` mantiene el estado en memoria y notifica los cambios con `onChange()`, que
dispara el repintado. Al cargar, `migrate()` rellena los campos que falten para que un
respaldo viejo nunca rompa la app.

## Decisiones y por qué

**Un botón de tres estados en vez de dos casillas.** Un clic para lo normal, dos para el
caso menos frecuente. Dos casillas por ficha habrían duplicado los objetivos de clic en 139
entradas.

**La fecha se fija sola y no se pisa.** Se guarda la primera vez que marcas algo como
obtenido; volver a masterizarlo no la cambia. Interesa cuándo lo conseguiste, no cuándo lo
tocaste por última vez.

**Sin cuentas ni nube.** Todo local. Para cambiar de dispositivo está el export JSON, y para
comparar está el código compartido. Ver [compartir.md](compartir.md).

**`schemaVersion` desde el día uno.** Aunque solo exista la versión 1, el punto de enganche
para migrar ya está puesto. Cambiar el formato después sin él significa romperle el guardado
a alguien.

**Las no lanzadas se ven pero no se marcan.** Deja ver qué viene sin permitir estados
imposibles.

## Evolución

### 2026-08-08 — Sesión 2
- El total de referencia pasó de **117 a 127** variantes lanzadas, y el de Mastery de 25 a
  **30 sprites**, tras reconciliar el catálogo.
- Las fichas ahora muestran la imagen del sprite.
- El `title` de cada ficha incluye la fecha en que la conseguiste.
- `importJSON()` se saneó por completo (ver [seguridad.md](seguridad.md)) y ahora devuelve
  `{ importadas, descartadas }` en vez de un número suelto.
- Se quitó la función muerta `replaceStatuses()`.

### 2026-08-08 — Sesión 1
- Ciclo de tres estados, doble progreso Colección / Mastery.
- Persistencia en `localStorage` con `schemaVersion` y `migrate()`.
- Fecha automática al obtener, notas por entrada.
- Export/import JSON y "borrar todo" con confirmación.
