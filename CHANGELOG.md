# Changelog

Bitácora cronológica del proyecto, una entrada por sesión de trabajo.
Para ver la evolución **por función** en vez de por fecha, ve a [docs/](docs/).

---

## 2026-08-08 — Sesión 2: imágenes, diseño, seguridad y documentación

### 🔴 Cambio estructural: `codeOrder`

Se detectó un defecto de diseño en el código para compartir. La posición de cada entrada
en el campo de bits **era su identidad**, y esa posición se derivaba de recorrer
`sprites[] → variants[]`. Eso aguanta que lleguen sprites nuevos (se anexan al final),
pero **no aguanta variantes nuevas**, que llegan en medio: la tanda de Gem agrega `gem`
a Fire, Ghost, Dream y Boss, sprites que están al principio del archivo. Insertarlas
habría recorrido la posición de ~90 entradas e invalidado todos los links compartidos.

**Solución:** se separó el orden de presentación del de codificación con una lista
`codeOrder[]` independiente y append-only. `catalogVersion` sube a **2**.

Se hizo ahora porque no había ningún código en circulación — el costo fue cero.
Detalle completo en [docs/compartir.md](docs/compartir.md).

### Catálogo reconciliado — el conteo estaba corto

Se contrastó contra `sprites-data.js` de [staticvacant/fnsprites](https://github.com/staticvacant/fnsprites),
que está al día con la última tanda. El catálogo propio venía de spritechecklist.org y
estaba desactualizado. Se generó un reporte de diferencias antes de aplicar nada; salió
**puramente aditivo** (nada borrado ni renombrado).

| | Antes | Después |
|---|---|---|
| Variantes lanzadas | 117 | **127** |
| Anunciadas sin lanzar | 1 | 12 |
| Sprites | 25 | 30 |

- **+10 variantes ya lanzadas que faltaban:** `fishy:gem`, `fishy:holofoil`, `striker:gem`,
  `aura:holofoil`, `boss:holofoil`, `batman:gem`, `lootin-llama:holofoil`, `lootin-llama:cube`,
  `peeky-peely:gem`, `peeky-peely:cube`.
- **+7 Gem anunciadas sin salir:** Fire, Ghost, Dream, Punk, Boss, Air, Seven.
- **+5 sprites de Chapter 7 Season 4: Override:** X-Ray, Pond, Honey, Dumpster Dive, Bullet.

> ⚠️ **Pendiente de verificar:** las 10 variantes "ya lanzadas" no tienen imagen en el repo
> de referencia, lo que sugiere que podrían estar listadas antes de tiempo. Conviene
> confirmarlas contra fortnite.gg.

### Imágenes de los sprites

- **127 de 139** entradas ya tienen imagen. Las 12 restantes son las más nuevas; el repo
  de referencia aún no las publica y caen al fallback.
- Descargadas de `raw.githubusercontent.com/staticvacant/fnsprites`, redimensionadas a
  **96×96** con `System.Drawing` conservando transparencia, y auto-hospedadas en `img/sprites/`.
- **19.7 MB → 1.16 MB** (94% menos, promedio 9.4 KB por imagen).
- Fallback obligatorio: si falta una imagen se muestra la inicial del sprite sobre el color
  de su variante. El sitio nunca enseña un ícono roto.

### Rediseño: color pleno por variante

- Estructura minimalista, color generoso: cada variante tiene su propio degradado
  (`color` + `color2`), definido **en el JSON, no en el CSS**.
- Tres estados visuales: **me falta** (degradado al 16% + imagen en gris), **la tengo**
  (degradado pleno + imagen a color + ✓), **masterizada** (+ anillo dorado ★).
  Así el color dice *qué variante es* y la intensidad dice *si la tienes*.
- Se respeta `prefers-reduced-motion`.
- Nuevo filtro por temporada.

### Seguridad

- **CSP** por `<meta>` en ambas páginas, estricta gracias a las cero dependencias externas.
- **Se eliminaron los 5 `innerHTML`** que quedaban; todo el DOM se construye con nodos.
- **Import de JSON saneado**: tope de 1 MB, se descartan claves que no existan en el
  catálogo, estados fuera de rango, fechas mal formadas, y las notas se recortan a 500 caracteres.
- El fallback de imagen se enganchó con `addEventListener`, no con el atributo `onerror`,
  porque el CSP bloquea handlers inline.

Detalle y modelo de amenazas en [docs/seguridad.md](docs/seguridad.md).

### Pruebas

Suite ampliada de 36 a **60 pruebas**, todas en verde. Las nuevas cubren el invariante de
`codeOrder`, el saneado del import y la existencia de imágenes.

Ahora vive en [test.html](test.html) y es parte del repo. **Lleva un seguro**: respalda tu
colección antes de correr y la restaura al terminar, así abrirla en el sitio publicado no
borra nada.

---

## 2026-08-08 — Sesión 1: versión inicial

Sitio estático sin build, sin dependencias y sin servidor.

- Catálogo en `data/sprites.json` (25 sprites, 117 variantes según los datos de entonces).
- Checklist por variante con ciclo de tres estados y doble progreso Colección / Mastery.
- Filtros, búsqueda, agrupación y panel de estadísticas.
- Hunt list e historial con fechas automáticas.
- Export/import JSON.
- Comparación con amigos mediante un código de 42 caracteres en el fragmento de la URL.
- 36 pruebas funcionales en verde.

**Decisión de stack:** HTML + CSS + JS vanilla con módulos ES, sin build step. El deploy a
GitHub Pages es un `git push` y actualizar el catálogo es editar un JSON. Ver
[docs/catalogo.md](docs/catalogo.md).
