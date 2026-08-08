# Imágenes

## Qué hace

Muestra la imagen real de cada sprite en su ficha, en vez de solo texto y color.

**Archivos:** `img/sprites/` · [`js/catalog.js`](../js/catalog.js) (asigna `entry.img`) ·
[`js/render.js`](../js/render.js) (función `thumb()`)

## Cómo funciona

- Se auto-hospedan **127 PNG de 96×96** en `img/sprites/`, con el nombre
  `{spriteId}-{variantId}.png` — por ejemplo `zero-point-quack.png`.
- `catalog.js` le pone a cada entrada su ruta: `entry.img`.
- `render.js` la pinta con `<img loading="lazy" decoding="async">`.

### El fallback

12 de las 139 entradas **no tienen imagen**: son las más nuevas y el repo de origen aún no
las ha publicado. Cuando una imagen da 404, `thumb()` la reemplaza por la inicial del sprite
sobre el color de su variante.

El sitio nunca enseña un ícono roto. El manejador se engancha con `addEventListener('error')`
y **no** con el atributo `onerror`, porque el CSP bloquea handlers inline
(ver [seguridad.md](seguridad.md)).

### Las 12 que faltan hoy

```
fishy:holofoil   fishy:gem      air:gem        aura:holofoil
striker:gem      boss:holofoil  seven:gem      batman:gem
lootin-llama:holofoil   lootin-llama:cube
peeky-peely:gem         peeky-peely:cube
```

> 💡 10 de estas están marcadas como **ya lanzadas** en el catálogo pero no tienen imagen en
> el repo de referencia. Puede ser que estén listadas antes de tiempo. Vale la pena
> confirmarlas contra fortnite.gg.

## Cómo agregar las que falten

Las imágenes se bajaron con un script de PowerShell que **no requiere instalar nada**
(`System.Drawing` viene con Windows). El script vive fuera del repo; esta es la receta para
reconstruirlo:

```powershell
Add-Type -AssemblyName System.Drawing
$base = "https://raw.githubusercontent.com/staticvacant/fnsprites/main/sprites"

# su nomenclatura no es la nuestra
$spriteBack  = @{ "lootin-llama"="llama"; "peeky-peely"="peely"; "john-wick"="wick"
                  "vini-jr"="vini"; "zero-point"="zeropoint"; "burnt-peanut"="theburntpeanut" }
$variantBack = @{ "base"="basic"; "gummy"="candy"; "cube"="rift" }

# por cada entrada que falte:
Invoke-WebRequest "$base/$suyoSprite`_$suyaVariante.png" -OutFile $tmp -UseBasicParsing

$src = [System.Drawing.Image]::FromFile($tmp)
$bmp = New-Object System.Drawing.Bitmap 96, 96, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g   = [System.Drawing.Graphics]::FromImage($bmp)
$g.CompositingMode   = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy   # conserva transparencia
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, 96, 96))
$bmp.Save("img/sprites/$nuestroSprite-$nuestraVariante.png", [System.Drawing.Imaging.ImageFormat]::Png)
```

`CompositingMode::SourceCopy` es lo que evita que el fondo transparente salga negro.

También sirve descargarlas a mano, redimensionarlas y guardarlas con el nombre correcto:
el sitio no necesita nada más que el archivo en su sitio.

## Resultado del procesado

| | |
|---|---|
| Descargadas | 127 de 139 |
| Peso original | 19.7 MB |
| **Peso final** | **1.16 MB** |
| Reducción | 94% |
| Promedio | 9.4 KB |
| Más pesada | 18.6 KB (`xray-base.png`) |

## Procedencia y derechos

Los Sprites y sus imágenes son **propiedad de Epic Games**. Este es un proyecto de fan sin
ánimo de lucro, que es la base sobre la que operan todos los trackers de la comunidad. Se
acredita en el pie de ambas páginas y en el [README](../README.md).

Las imágenes se tomaron del repo público [staticvacant/fnsprites](https://github.com/staticvacant/fnsprites).
Ese repo no declara licencia sobre su código, pero tampoco es dueño de las imágenes: son
assets del juego.

## Decisiones y por qué

**Auto-hospedar en vez de enlazar al repo ajeno.** Enlazar a `raw.githubusercontent.com`
habría pesado 0 en el repo, pero el sitio dependería de que otra persona no renombre ni
borre nada, y consumiría ancho de banda ajeno. 1.16 MB es un precio barato por no depender
de nadie.

**96×96 en vez de los 128 originales.** Se muestran a 78 px (64 en móvil), así que 96 da
margen para pantallas de alta densidad sin desperdiciar peso. Fue lo que llevó 19.7 MB a
1.16 MB.

**PNG en vez de WebP.** WebP pesaría ~30% menos, pero .NET Framework no trae encoder WebP
y meter una herramienta externa habría roto la promesa de "no hay que instalar nada". No
compensa por 300 KB.

**Renombradas a nuestra nomenclatura.** El origen usa `basic`, `candy` y `rift`; nosotros
`base`, `gummy` y `cube`. Traducirlas al descargar evita tener que recordar dos vocabularios
para siempre.

**Fallback obligatorio.** El catálogo va por delante de las imágenes cuando sale contenido
nuevo. Es el estado normal, no una excepción, y el diseño lo asume.

## Evolución

### 2026-08-08 — Sesión 2
- Se añadieron las imágenes al proyecto: 127 archivos, 1.16 MB.
- Se añadió `entry.img` en `catalog.js` y la función `thumb()` en `render.js`.
- Se implementó el fallback por `addEventListener`, compatible con CSP.
- Las miniaturas se usan también en el historial y en la vista de comparación.

### 2026-08-08 — Sesión 1
- Sin imágenes: las fichas eran texto sobre el color de la variante.
