# Changelog

Bitácora cronológica del proyecto, una entrada por sesión de trabajo.
Para ver la evolución **por función** en vez de por fecha, ve a [docs/](docs/).

---

## 2026-08-08 — Sesión 5: arreglo de caché y documento de traspaso

### El banner rojo tras actualizar

Al abrir el sitio salía una pantalla de errores diciendo que `codeOrder` menciona claves que
no existen en `sprites[]`. **No era un fallo de los datos.**

GitHub Pages sirve todo con `Cache-Control: max-age=600`, pero `catalog.js` pide el JSON con
`cache: 'no-cache'`. Resultado: el navegador traía el **JSON nuevo** (con `retired[]`) y el
**`catalog.js` viejo** de la caché, que no sabía qué era ese campo. Se confirmó comparando:
el archivo publicado sí tenía el soporte; el mensaje en pantalla era el texto de la versión
anterior.

**Arreglo:** versionar las URLs de los módulos con `?v=4`, tanto en los `<script src>` como
en cada `import` relativo. El JSON se queda con `no-cache` a propósito: los datos siempre
frescos, el código se refresca al subir la versión, y ya no pueden desincronizarse.

Queda como paso obligatorio del flujo de publicación, documentado en
[docs/deploy.md](docs/deploy.md).

### CONTEXTO.md

Documento de entrada para retomar el proyecto desde otra computadora. Reúne lo que estaba
disperso o solo en la cabeza:

- Puesta en marcha en una máquina nueva, incluida la configuración obligatoria del correo
  noreply antes del primer commit.
- La arquitectura en cinco minutos, con el porqué de los dos órdenes (`flat` y `codeIndex`).
- Las cuatro reglas invariantes del proyecto.
- Recetas para actualizar el catálogo, agregar imágenes, probar y publicar.
- **Historial de decisiones y errores**, incluido por qué el catálogo se corrompió al confiar
  en la fuente equivocada y qué señal se ignoró.
- Trabajo pendiente y trampas conocidas.

---

## 2026-08-08 — Sesión 4: catálogo corregido, rediseño y sin emojis

### El catálogo tenía 22 entradas que no existen

Marco cotejó el sitio contra **fortnite.gg**, que es la fuente autoritativa, y sobraban 22
entradas. Al quitarlas el total vuelve a **117 variantes en 25 sprites**, que es justo lo que
reportan todos los demás trackers.

**La reconciliación de la sesión 2 fue un error de juicio.** Se tomó el `sprites-data.js` de
staticvacant/fnsprites como "más al día" cuando en realidad incluía variantes especulativas.
El síntoma estaba a la vista y se pasó por alto: las 12 entradas que quedaron sin imagen eran
exactamente las que no existían. Se marcaron como "pendientes de verificar" en vez de tomarlas
como la señal que eran.

Retiradas: 17 variantes (`fire:gem`, `ghost:gem`, `dream:gem`, `punk:gem`, `boss:gem`,
`boss:holofoil`, `air:gem`, `seven:gem`, `batman:gem`, `fishy:gem`, `fishy:holofoil`,
`striker:gem`, `aura:holofoil`, `lootin-llama:holofoil`, `lootin-llama:cube`,
`peeky-peely:gem`, `peeky-peely:cube`) y los 5 sprites de Season 4, que aún no salen.

### Posiciones reservadas: retirar sin romper los links

Borrar esas claves de `codeOrder` habría corrido la posición de las 47 entradas siguientes y
**corrompido en silencio todos los códigos ya compartidos**. En vez de eso se añadió el array
`retired[]`: las claves se quedan en `codeOrder` y `catalog.codeIndex` guarda un `null` en
cada hueco.

Resultado: se pueden retirar entradas para siempre sin invalidar un solo link.
`catalogVersion` sube a **3**; los códigos siguen midiendo 49 caracteres.

### Rediseño al estilo de fortnite.gg

- Tarjetas con **imagen grande sobre el degradado de su variante**, nombre debajo y botón de
  estado al pie, como en fortnite.gg — pero manteniendo la distribución agrupada por sprite y
  con aire entre elementos, en vez de amontonarlo todo.
- **Imágenes re-renderizadas a 192×192** desde los originales de 512 px. Antes se veían
  pequeñas y borrosas. Peso: 1.16 MB → 3.84 MB.
- Grid fluido (`auto-fill` desde 148 px) en vez de `flex-wrap`, para que queden alineadas.
- **117 de 117 entradas tienen imagen.** Ya no hay ninguna que dependa del fallback.

### Sin emojis

Se eliminaron de la interfaz, de la documentación y del favicon. Lo que antes marcaba un
emoji ahora lo dice una palabra o una forma dibujada con CSS: el logo, el icono de búsqueda,
el marcador de objetivo y los tres estados. La suite tiene una prueba que verifica que no
vuelvan a colarse.

### Otros

- Se quitó el filtro por temporada, que se quedó con una sola opción.
- Suite de 60 a **62 pruebas**, todas en verde.
- Se añadió el link del sitio al About del repositorio, para que no haya que entrar a un
  archivo para encontrarlo.

---

## 2026-08-08 — Sesión 3: privacidad del correo y deploy

### El correo personal en el historial de commits

Al preparar la publicación se detectó que los 2 commits llevaban la dirección de correo
personal como autor. **Al hacer público el repositorio habría quedado visible para
cualquiera, de forma permanente.** No estaba contemplado en el modelo de amenazas.

Se corrigió antes del primer push, que es la única ventana en la que se puede hacer sin
consecuencias:

- Se pasó a la dirección **noreply de GitHub** (`ID+usuario@users.noreply.github.com`).
- Se reescribieron los commits existentes con `git filter-branch`, preservando mensajes,
  fechas y contenido.
- Se activó en GitHub **Block command line pushes that expose my email**: una garantía del
  lado del servidor que rechaza cualquier push que exponga la dirección, sin depender de
  recordar configurar git en cada máquina.

Documentado en [docs/seguridad.md](docs/seguridad.md) y [docs/deploy.md](docs/deploy.md).

### Corrección de `docs/deploy.md`

El procedimiento de autenticación estaba mal redactado. Listaba las respuestas del menú de
`gh auth login` (*"→ GitHub.com → HTTPS → Y"*) como si hubiera que escribirlas, cuando ese
menú **se navega con flechas**. El resultado real fue que el texto acabó en PowerShell
(`El término 'GitHub.com' no se reconoce...`) y la autenticación nunca se completó.

- Se reemplazó por un solo comando con flags que **se salta todos los menús**:
  `gh auth login --hostname github.com --git-protocol https --web`
- Se añadió un aviso explícito sobre la navegación con flechas.
- Se añadió una vía alterna sin `gh` (web + `git push` con Git Credential Manager).
- Se amplió la tabla de problemas comunes con los errores que aparecieron de verdad.

---

## 2026-08-08 — Sesión 2: imágenes, diseño, seguridad y documentación

### Cambio estructural: `codeOrder`

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

> **Pendiente de verificar:** las 10 variantes "ya lanzadas" no tienen imagen en el repo
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
  (degradado pleno + imagen a color + ok), **masterizada** (+ anillo dorado master).
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
