# Contexto del proyecto

Documento de entrada. Si acabas de clonar el repo en otra computadora, **lee esto primero**:
en 10 minutos tienes todo lo necesario para hacer cambios sin romper nada.

- **Sitio publicado:** https://dmarcoes.github.io/fortnite-sprites/
- **Repositorio:** https://github.com/DMarcoEs/fortnite-sprites
- **Qué es:** un checklist manual de la colección de Sprites de Fortnite. Sin cuentas, sin
  servidor, sin base de datos y sin costo.

---

## 1. Estado actual

| | |
|---|---|
| Catálogo | **117 variantes** en **25 sprites**, cotejadas contra fortnite.gg |
| Posiciones reservadas | 22 (entradas retiradas, ver sección 4) |
| Imágenes | 117 PNG de 192×192, auto-hospedadas, 3.84 MB |
| Pruebas | **62**, todas en verde |
| Versión del catálogo | 3 |
| Versión de los módulos JS | `?v=4` |
| Peso del repo | ~4 MB, 143 archivos |

Lo que **no** hay y es a propósito: Node, npm, bundler, framework, dependencias, backend,
cuentas de usuario, analítica y cookies.

---

## 2. Puesta en marcha en una computadora nueva

### 2.1 Clonar

```powershell
git clone https://github.com/DMarcoEs/fortnite-sprites.git
cd fortnite-sprites
```

**No hay que instalar dependencias.** No existe `npm install` ni paso de compilación. El
repo clonado ya es el sitio completo.

### 2.2 Configurar tu identidad de Git — IMPORTANTE

```powershell
git config --global user.name  "Marco"
git config --global user.email "244985941+DMarcoEs@users.noreply.github.com"
```

**Este paso no es opcional.** Esa es tu dirección noreply de GitHub. Si commiteas con tu
correo personal desde la máquina nueva, GitHub **rechazará el push** porque tienes activado
*Block command line pushes that expose my email*. Y si algún día desactivaras ese candado,
el correo quedaría público y permanente en el historial.

Comprueba con `git log -1 --format='%ae'` después del primer commit.

### 2.3 Autenticarte con GitHub

```powershell
winget install --id GitHub.cli
```

Cierra y reabre la terminal, y luego:

```powershell
gh auth login --hostname github.com --git-protocol https --web
```

Los flags se saltan los tres menús. **Ojo:** los menús de `gh` se navegan con **flechas y
Enter**, no escribiendo la respuesta; si tecleas la opción, el texto acaba en PowerShell.

### 2.4 Servidor local

```powershell
code --install-extension ritwickdey.LiveServer
```

Luego, clic derecho en `index.html` → *Open with Live Server*.

**No abras el HTML con doble clic.** El navegador bloquea `fetch()` sobre `file://` y el
catálogo no cargará: verás un banner rojo explicándolo.

### 2.5 Páginas útiles

| Página | Para qué |
|---|---|
| `index.html` | el sitio |
| `compare.html` | comparación con amigos |
| `test.html` | las 62 pruebas — ábrela después de cada cambio |
| `test-seed.html` | siembra una colección de ejemplo para revisar el diseño |

`test.html` respalda tu colección real antes de correr y la restaura al terminar, así que
abrirla no te borra nada.

---

## 3. Arquitectura en cinco minutos

```
index.html          Vista principal: colección, buscando, historial, datos
compare.html        Comparación con amigos

data/sprites.json   EL archivo de datos. Lo único que se edita cada temporada.
img/sprites/        117 imágenes, nombradas {sprite}-{variante}.png

js/catalog.js       Carga, valida y aplana el catálogo. Produce DOS órdenes distintos.
js/store.js         localStorage, export/import saneado, migraciones de esquema
js/share.js         Códigos para compartir: campo de bits <-> base64url
js/filters.js       Búsqueda, filtros, agrupación, estadísticas
js/render.js        Pintado del DOM
js/app.js           Arranque de index.html
js/compare.js       Arranque de compare.html
```

Flujo: `app.js` llama a `loadCatalog()`, lee el estado con `store`, y en cada cambio
`store.onChange()` dispara un repintado completo. Con 117 tarjetas es instantáneo y elimina
por completo los bugs de sincronización.

### Lo único no obvio: los dos órdenes

Esto es lo que hay que entender antes de tocar nada.

```
catalog.flat        Orden de PRESENTACIÓN
                    Sale de recorrer sprites[] y, dentro de cada uno, variants[]
                    Lo usan filtros, estadísticas y render
                    Se puede reordenar libremente

catalog.codeIndex   Orden de CODIFICACIÓN
                    Sale tal cual de codeOrder[] del JSON
                    Solo lo usa share.js
                    NUNCA se reordena
```

**Por qué existen separados.** El código para compartir es un campo de bits donde *la
posición de cada entrada es su identidad*. Si `water:gold` ocupa la posición 1, todo código
que exista en el mundo asume que los bits 2-3 hablan de `water:gold`.

Al principio esa posición se derivaba del orden de los arrays. Eso aguanta que lleguen
sprites nuevos (se anexan al final), pero **no aguanta variantes nuevas**, que llegan en
medio:

```
ANTES:   … fire:holofoil, fire:cube, fire:quack, fishy:base …
                                                  posición 21

Si insertas fire:gem en su sitio "natural":
DESPUÉS: … fire:holofoil, fire:gem, fire:cube, fire:quack, fishy:base …
                             nueva      todo lo de aquí se corrió una posición
```

Las ~90 entradas siguientes se recorren y **todos los links compartidos empiezan a
decodificar sprites equivocados**, sin ningún error visible. Por eso `codeOrder` es una
lista aparte y append-only.

Detalle completo en [docs/compartir.md](docs/compartir.md).

---

## 4. Las cuatro reglas que no se rompen

### 1. `codeOrder` es append-only; lo retirado va a `retired[]`

Nunca reordenar, renombrar ni **borrar** una clave. Las nuevas se pegan al final.

Si una entrada resulta no existir en el juego: quítala de `sprites[]` y añade su clave a
`retired[]`. `catalog.js` guarda un hueco (`null`) en `codeIndex` para que todo lo posterior
conserve su posición. Hoy hay 22 posiciones reservadas justamente por esto.

Si te olvidas de `retired[]`, la validación te avisa en pantalla en vez de dejarte romper
los códigos en silencio. → [docs/catalogo.md](docs/catalogo.md)

### 2. Nada de `innerHTML`

Todo el DOM se construye con `createElement` y `textContent`. Hubo 5 usos que solo
interpolaban números —inofensivos— y se eliminaron igual, para que el patrón no exista y
nadie lo copie mañana con datos que sí vengan de fuera. → [docs/seguridad.md](docs/seguridad.md)

### 3. Nada de emojis

Ni en la interfaz, ni en la documentación, ni en el favicon. El logo, el icono de búsqueda
y el marcador de objetivo son formas dibujadas con CSS o SVG. Los estados los dicen palabras.
La suite tiene una prueba que verifica que no se vuelvan a colar. → [docs/diseno.md](docs/diseno.md)

### 4. Cero dependencias, cero build

Es la decisión de fondo del proyecto. Hace que publicar sea `git push`, que actualizar el
catálogo sea editar un JSON, y que no haya nada que se comprometa río arriba.

---

## 5. Flujos de trabajo

### Actualizar el catálogo cuando salga contenido

**Fuente autoritativa: [fortnite.gg/sprites](https://fortnite.gg/sprites).** Ver la sección
6 para saber por qué esto importa.

Agregar una variante a un sprite existente — **dos pasos, el segundo es el que se olvida**:

```jsonc
// 1) en el sprite, en el orden que se vea mejor
{ "id": "fire", …, "variants": ["base", "gold", "gummy", "galaxy", "holofoil", "gem", "cube", "quack"] }

// 2) al FINAL de codeOrder, aunque Fire esté al principio del archivo
"codeOrder": [ …todo lo anterior…, "fire:gem" ]
```

Agregar un sprite nuevo: un objeto en `sprites[]` y todas sus claves al final de `codeOrder`.

Retirar una entrada que no existe: quitarla de `sprites[]` y añadir su clave a `retired[]`.
**Nunca borrarla de `codeOrder`.**

### Agregar imágenes que falten

Origen: `https://raw.githubusercontent.com/staticvacant/fnsprites/main/sprites/{id}_{tema}.png`

Su nomenclatura no es la nuestra: `basic`→`base`, `candy`→`gummy`, `rift`→`cube`, y
`llama`/`peely`/`wick`/`vini`/`zeropoint`/`theburntpeanut` → nuestros ids largos.

```powershell
Add-Type -AssemblyName System.Drawing
Invoke-WebRequest $url -OutFile $tmp -UseBasicParsing

$src = [System.Drawing.Image]::FromFile($tmp)
$bmp = New-Object System.Drawing.Bitmap 192, 192, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g   = [System.Drawing.Graphics]::FromImage($bmp)
$g.CompositingMode   = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy   # conserva transparencia
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, 192, 192))
$bmp.Save("img/sprites/$sprite-$variante.png", [System.Drawing.Imaging.ImageFormat]::Png)
```

No hace falta instalar nada: `System.Drawing` viene con Windows. Los originales son de
512×512. Si falta una imagen el sitio muestra la inicial del sprite sobre su color, nunca
un icono roto.

### Correr las pruebas

Abre `test.html` con Live Server. Debe decir **62 pasaron, 0 fallaron**. Si cambiaste el
número de entradas, hay que actualizar los totales esperados dentro de la suite.

### Publicar

```powershell
git add -A
git commit -m "describe el cambio"
git push
```

**Si tocaste cualquier `.js`, sube el número de versión antes de commitear**: cambia `?v=4`
por `?v=5` en los `import` de `js/*.js` y en los `<script src>` de los HTML. Sin eso, los
navegadores que ya visitaron el sitio pueden quedarse con el JS viejo y el JSON nuevo, y esa
combinación muestra un banner de errores (ver sección 6).

Pages se reconstruye solo en ~1 minuto. Si se queda parado:

```powershell
gh api --method POST repos/DMarcoEs/fortnite-sprites/pages/builds
```

---

## 6. Historial de decisiones y errores

Esta sección existe para no repetir lo que ya costó rehacer.

### El catálogo se corrompió por confiar en la fuente equivocada

Se tomó el `sprites-data.js` del repo `staticvacant/fnsprites` como "más actualizado" que
spritechecklist.org, y se metieron **22 variantes que no existen** en el juego, incluidos 5
sprites de una temporada que aún no salía.

Lo grave no fue el error inicial sino ignorar la señal: al descargar las imágenes,
**justo esas 22 entradas eran las que no tenían imagen**. Se etiquetaron como "pendientes de
verificar" en lugar de leerlas como lo que eran. El catálogo estuvo mal hasta que se cotejó
contra fortnite.gg y volvió a 117, el número que siempre habían reportado los demás sitios.

**Lección: fortnite.gg es la fuente autoritativa. Y si los datos y las imágenes no
coinciden, los datos están mal.**

### El defecto de posiciones en el código compartido

Descrito en la sección 3. Se detectó **antes del primer deploy**, cuando no había ni un
código en circulación, así que arreglarlo costó cero. Después habría sido irreparable sin
romper los links de todo el mundo.

De ahí salieron `codeOrder`, y más tarde `retired[]` para poder retirar entradas sin
recorrer posiciones.

### El correo personal en los commits

Los primeros commits llevaban la dirección de Gmail como autor. Al hacer público el repo
habría quedado visible de forma permanente. Se corrigió antes del primer push reescribiendo
el historial con `git filter-branch`.

Tres capas lo protegen hoy: la dirección noreply, el historial reescrito, y
*Block command line pushes that expose my email* activado en GitHub, que rechaza el push
desde el servidor. Por eso la sección 2.2 es obligatoria en cada máquina nueva.

### El banner rojo de errores tras actualizar

GitHub Pages sirve todo con `Cache-Control: max-age=600`, pero `catalog.js` pide el JSON con
`cache: 'no-cache'`. Resultado: el navegador traía el **JSON nuevo** y el **`catalog.js`
viejo** en caché, que no entendía el campo `retired`. Esa combinación imposible mostraba una
pantalla de errores de validación.

Se arregló versionando las URLs de los módulos (`?v=4`). Por eso hay que subir el número al
cambiar JS.

### Dos scripts que rompieron cosas por ser demasiado listos

- El script que quitó los emojis del markdown también colapsaba espacios y saltos de línea,
  y fusionó filas de tablas. Hubo que restaurar desde git y rehacerlo tocando **solo** los
  caracteres de emoji.
- El script que añadió `?v=` a los imports se comió la comilla de apertura y dejó
  `from ./store.js?v=4'`. Mismo remedio.

**Lección: en transformaciones masivas de texto, cambiar lo mínimo y verificar el resultado
antes de dar por bueno el cambio.** El conteo de líneas antes/después es un chequeo barato
y muy efectivo.

---

## 7. Trabajo pendiente

**Prioridad alta — configuración de la cuenta, no del código:**

- [ ] **Protección de la rama `main`** — está sin configurar. En
      [Settings → Rules](https://github.com/DMarcoEs/fortnite-sprites/settings/rules) →
      *New ruleset* → rama `main` → activar *Restrict deletions* y *Block force pushes*.
- [ ] **2FA de la cuenta** — sin confirmar. Es la medida que más protege el proyecto: el
      único camino realista para que alguien modifique el sitio es robar la cuenta.
      [Settings → Password and authentication](https://github.com/settings/security).

**Funcionalidad:**

- [ ] **Interfaz para las notas.** `store.setNote()` existe y está probada, y las notas se
      muestran en el historial, pero no hay campo para escribirlas.
- [ ] **Editar la fecha.** Igual: `store.setDate()` funciona, falta el control en pantalla.
- [ ] **Volver a meter temporadas** cuando salga Chapter 7 Season 4. El filtro se quitó
      porque quedaba con una sola opción, pero el soporte sigue en `filters.js`
      (`filters.season`) y en el JSON (`seasons[]`).

**Ideas aparcadas:**

- Sincronización opcional entre dispositivos con Supabase. Se descartó porque añade cuentas,
  un servicio que mantener y datos personales que proteger, para resolver algo que el export
  JSON ya cubre.

---

## 8. Trampas conocidas

Cosas que ya costaron tiempo una vez.

| Trampa | Qué pasa | Qué hacer |
|---|---|---|
| Abrir el HTML con doble clic | `fetch()` sobre `file://` está bloqueado | Live Server |
| Menús de `gh` | Son de flechas; escribir la respuesta la manda a PowerShell | Usar los flags de la sección 2.3 |
| Screenshots headless en este Edge | `--screenshot` no genera el archivo | Solo se puede volcar el DOM con `--dump-dom` |
| 117 peticiones en paralelo | El CDN estrangula parte y devuelve 404 falsos | Ir por lotes de 8 |
| `[int]` en PowerShell | **Redondea**, no trunca. En JS `>> 3` sí trunca | `[int][math]::Floor()` |
| `Get-Content -Raw \| ConvertFrom-Json` | Rompe los acentos | `[System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8)` |
| Escribir JSON con `ConvertTo-Json` | Formato ilegible con sangrías enormes | Hay un formateador a medida; ver el historial de commits |

---

## 9. Cómo retomar con el asistente

Si vas a seguir usando Claude Code en la otra computadora, en la primera sesión basta con:

> Este es el repo de Sprite Tracker. Lee `CONTEXTO.md` para ponerte al día y luego
> [lo que quieras hacer].

Los archivos que dan contexto más rápido, en orden:

1. **`CONTEXTO.md`** — este documento
2. **`data/sprites.json`** — el modelo de datos completo
3. **`js/catalog.js`** — los dos órdenes y la validación
4. **`CHANGELOG.md`** — qué cambió y cuándo

Y lo que conviene decir explícitamente si el cambio toca datos o el código compartido:
**"respeta las reglas de la sección 4 de CONTEXTO.md"**.

---

## 10. Índice de la documentación

| Documento | De qué trata |
|---|---|
| [README.md](README.md) | Presentación y uso del sitio |
| [CHANGELOG.md](CHANGELOG.md) | Bitácora cronológica, una entrada por sesión |
| [docs/README.md](docs/README.md) | Índice de la documentación por función |
| [docs/catalogo.md](docs/catalogo.md) | Modelo de datos y cómo actualizarlo |
| [docs/coleccion.md](docs/coleccion.md) | Checklist, estados y Mastery |
| [docs/filtros.md](docs/filtros.md) | Búsqueda, filtros y estadísticas |
| [docs/compartir.md](docs/compartir.md) | Códigos, comparación y el porqué de `codeOrder` |
| [docs/hunt-historial.md](docs/hunt-historial.md) | Lista de búsqueda e historial |
| [docs/diseno.md](docs/diseno.md) | Sistema visual y color por variante |
| [docs/imagenes.md](docs/imagenes.md) | Procedencia y procesado de las imágenes |
| [docs/seguridad.md](docs/seguridad.md) | Modelo de amenazas y mitigaciones |
| [docs/deploy.md](docs/deploy.md) | Publicar en GitHub Pages, paso a paso |

Cada documento de `docs/` sigue la misma estructura: **Qué hace** → **Cómo funciona** →
**Decisiones y por qué** → **Evolución** (bitácora de esa función en concreto).

---

## Créditos

Proyecto personal de fan, sin relación con Epic Games. Los Sprites y sus imágenes son
propiedad de Epic Games.
