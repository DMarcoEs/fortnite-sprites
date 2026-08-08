# Catálogo

## Qué hace

Guarda todo lo que el sitio sabe del juego: qué sprites existen, qué variantes tiene cada
uno, cuáles ya salieron, sus rarezas, temporadas, habilidades y colores.

Es **el único archivo que hay que editar cuando Epic saca contenido nuevo**. Ni una línea
de código.

**Archivos:** [`data/sprites.json`](../data/sprites.json) · [`js/catalog.js`](../js/catalog.js)

## Cómo funciona

`catalog.js` carga el JSON, lo valida y produce **dos listas distintas** que no hay que
confundir:

| Lista | Orden | La usa | ¿Se puede reordenar? |
|---|---|---|---|
| `catalog.flat` | Presentación: `sprites[]` → `variants[]` | filtros, estadísticas, render | ✅ Sí, libremente |
| `catalog.codeIndex` | Codificación: tal cual `codeOrder[]` | **solo** `share.js` | ❌ **Jamás** |

Además expone `byKey` (mapa `"water:gold" → entrada`), los catálogos de variantes, rarezas
y temporadas, y los totales `totalReleased` / `totalAll`.

### Validación

Al cargar, si algo está mal la página muestra un banner rojo con el problema exacto en vez
de renderizar datos corruptos. Detecta:

- sprites o claves de `codeOrder` duplicados
- rarezas, temporadas o variantes que no existen
- una variante marcada como `unreleased` que no está en su lista de variantes
- **entradas en `sprites[]` que faltan en `codeOrder[]`, y viceversa**

Esa última es la importante: es la red que impide romper los links compartidos por accidente.

### Estructura

```jsonc
{
  "catalogVersion": 2,

  "variants": [
    { "id": "gold", "name": "Gold", "color": "#f5c542", "color2": "#a8760b",
      "bonus": "3x XP de Sprite por eliminacion" }
  ],
  "rarities": [ { "id": "rare", "name": "Rare", "color": "#3d8bfd", "order": 1 } ],
  "seasons":  [ { "id": "c7s3", "name": "Runners", "chapter": 7, "season": 3 } ],

  "sprites": [
    {
      "id": "water",                  // kebab-case, único, PERMANENTE
      "name": "Water Sprite",
      "rarity": "rare",               // debe existir en "rarities"
      "season": "c7s3",               // debe existir en "seasons"
      "ability": "Recupera escudo mientras estas dentro del agua.",
      "variants": ["base", "gold", "gummy", "galaxy", "holofoil", "gem", "quack"],
      "unreleased": ["gem"]           // opcional: anunciadas pero aún no jugables
    }
  ],

  "codeOrder": ["water:base", "water:gold", "…"]   // ⚠️ APPEND-ONLY
}
```

`unreleased` es lo que separa el total real del total mostrado: hoy hay **139 entradas**
de las cuales **127 ya salieron**. Las 12 pendientes aparecen atenuadas, no se pueden
marcar y no cuentan en las estadísticas.

## Cómo actualizar cuando salga contenido nuevo

### Agregar una variante a un sprite que ya existe

Es el caso más común (la tanda de Gem, por ejemplo). **Dos pasos, y el segundo es el que
la gente olvida:**

1. Añade la variante al array `variants` de ese sprite. Aquí **sí** puedes ponerla en el
   orden que se vea mejor.
2. Añade su clave **al final de `codeOrder`**. No en medio. Al final.

```jsonc
// 1) en el sprite
{ "id": "fire", …, "variants": ["base", "gold", "gummy", "galaxy", "holofoil", "gem", "cube", "quack"] }

// 2) al FINAL de codeOrder, sin importar que Fire esté al principio del archivo
"codeOrder": [ …todo lo anterior…, "fire:gem" ]
```

### Agregar un sprite nuevo

```jsonc
{
  "id": "honey", "name": "Honey Sprite", "rarity": "epic", "season": "c7s4",
  "ability": "Descripción de la habilidad.",
  "variants": ["base", "gold", "gummy", "galaxy", "gem"],
  "unreleased": ["gem"]
}
```
Y sus 5 claves (`honey:base`, `honey:gold`, …) al final de `codeOrder`.

### Cuando algo por fin sale al juego

Quita esa variante del array `unreleased`. Nada más. El contador sube solo.

### Agregar un tipo de variante nuevo

Añádelo al final del array `variants` de arriba del archivo, con su `color` y `color2`, y
sube `catalogVersion` en 1. **No hay que tocar el CSS**: los colores se inyectan desde el JSON.

### Verificar que no rompiste nada

Abre [`test.html`](../test.html) con Live Server. Debe decir **60 pasaron, 0 fallaron**.
Actualiza los totales esperados de la suite si cambiaste el conteo.

## Decisiones y por qué

**JSON aparte en vez de datos incrustados en JS.** Para que actualizar sea editar un archivo
de texto sin riesgo de romper sintaxis de código.

**`unreleased` en vez de simplemente no incluirlas.** Deja ver qué viene, y cuando sale solo
se quita la bandera. También explica por qué el número del sitio puede no coincidir con
otras páginas: unas cuentan lo anunciado y otras lo jugable.

**Colores en los datos, no en el CSS.** Una variante nueva no debería obligar a tocar tres
archivos.

**Fallar ruidosamente.** Un catálogo mal editado muestra un error claro en pantalla en vez
de renderizar a medias y dejarte adivinando.

## Evolución

### 2026-08-08 — Sesión 2
- **`catalogVersion` → 2.** Se añadió `codeOrder[]` y `catalog.codeIndex`, separando el
  orden de presentación del de codificación. Motivo completo en [compartir.md](compartir.md).
- Se añadió validación cruzada `sprites[] ↔ codeOrder[]`.
- Reconciliado contra `sprites-data.js` de staticvacant/fnsprites: **117 → 127 lanzadas**,
  25 → 30 sprites. El catálogo anterior venía de spritechecklist.org y estaba corto.
- Se añadió `color2` a cada variante para los degradados.
- Se añadió `entry.img` con la ruta de la imagen.
- Nueva temporada `c7s4` (Override) y filtro por temporada.

### 2026-08-08 — Sesión 1
- Versión inicial: 25 sprites, 117 variantes lanzadas + 1 anunciada (`punk:gem`).
- Aplanado derivado del orden de los arrays. *Este fue el defecto que la sesión 2 corrigió.*
- Validación de duplicados, rarezas, temporadas y variantes inexistentes.
