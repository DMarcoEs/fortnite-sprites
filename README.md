# ✨ Sprite Tracker

Checklist manual para la colección de **Sprites de Fortnite**. Sin cuentas, sin servidor, sin costo.

- **117 variantes** repartidas en **25 sprites** (Chapter 7 Season 3: Runners).
- Doble eje de progreso: **Colección** (¿la tengo?) y **Mastery** (¿la subí a nivel 5 y la extraje?).
- **Comparación con amigos** sin login: tu colección entera cabe en un código de 42 caracteres.
- Filtros, búsqueda, lista de búsqueda ("hunt list") e historial con fechas.

## Cómo usarlo

**Marcar sprites** — En la pestaña *Colección*, cada variante es un botón que cicla entre tres estados:

| Clic | Estado |
|---|---|
| 1 | ✅ **Tengo** |
| 2 | ⭐ **Master** (nivel 5 + extraída) |
| 3 | vuelve a **Falta** |

**Clic derecho** sobre cualquier variante la agrega a tu lista de búsqueda 🎯. Al marcarla como obtenida sale sola de la lista.

**Comparar con un amigo** — Ve a *Datos* → *Copiar link* y mándaselo. Al abrirlo verá al instante quién tiene qué, repartido en cuatro grupos: solo yo / solo él / los dos / ninguno. Que te pase el suyo de vuelta y comparas tú también. Ninguno de los dos crea cuenta.

**Respaldo** — *Datos* → *Exportar JSON* guarda todo (estados, fechas, notas, hunt list y amigos). El código de compartir solo lleva los estados; el JSON lleva el resto.

## Dónde se guardan los datos

En el `localStorage` de tu navegador, bajo la clave `fnsprites.v1`. No sale nada a internet: la comparación se calcula en tu propio navegador a partir del código pegado. Si borras los datos del navegador, pierdes la colección — por eso existe el export.

## Desarrollo local

No hay build, ni dependencias, ni `npm install`. Pero **no abras `index.html` con doble clic**: el navegador bloquea `fetch()` sobre `file://` y el catálogo no cargará.

Usa la extensión **Live Server** de VS Code:

```
code --install-extension ritwickdey.LiveServer
```

Luego clic derecho en `index.html` → *Open with Live Server*.

## ⚠️ Cómo actualizar el catálogo cada temporada

Todo el catálogo vive en **`data/sprites.json`**. No hace falta tocar código.

**La regla que no se rompe: el archivo es _append-only_.**

- ✅ **Agregar** sprites y variantes **al final** de sus arrays.
- ❌ **Nunca** renombrar, reordenar ni borrar un `id` que ya exista.

El motivo: el código para compartir es un campo de bits donde **la posición de cada entrada es su identidad**. Si reordenas el archivo, todos los códigos generados antes empiezan a decodificar sprites equivocados. Respetando la regla, un código viejo sigue funcionando para siempre y las entradas nuevas simplemente salen como "no la tengo".

### Agregar un sprite nuevo

```jsonc
{
  "id": "honey",                    // kebab-case, único, permanente
  "name": "Honey Sprite",
  "rarity": "epic",                 // debe existir en "rarities"
  "season": "c7s4",                 // debe existir en "seasons"
  "ability": "Descripción de la habilidad.",
  "variants": ["base", "gold", "gummy", "galaxy", "gem"],
  "unreleased": ["gem"]             // opcional: anunciadas pero aún no jugables
}
```

`unreleased` es lo que hace que el total diga 117 y no 118: el **Punk Sprite** tiene 6 variantes, pero su *Gem* todavía no sale en el juego. Las entradas no lanzadas se muestran atenuadas y no cuentan en las estadísticas.

Si agregas un **tipo de variante nuevo**, añádelo al final del array `variants` de arriba del archivo y sube `catalogVersion` en 1.

Al recargar la página, `catalog.js` valida el archivo y te avisa en pantalla si hay ids duplicados, rarezas inexistentes o variantes mal escritas.

## Estructura

```
index.html          Vista principal (colección, hunt, historial, datos)
compare.html        Vista de comparación con amigos
data/sprites.json   ⭐ el único archivo a editar cada temporada
css/styles.css
js/catalog.js       Carga, valida y aplana el catálogo
js/store.js         localStorage, export/import, migraciones
js/share.js         Códigos de compartir (campo de bits ↔ base64url)
js/filters.js       Búsqueda, filtros, agrupación, estadísticas
js/render.js        Pintado del DOM
js/app.js           Bootstrap de index.html
js/compare.js       Bootstrap de compare.html
```

## Fuentes de los datos

Catálogo contrastado contra [spritecatch.com](https://spritecatch.com/sprites/), [spritechecklist.org](https://spritechecklist.org/all-sprites/) y [spritelocker.com](https://spritelocker.com/).

---

Proyecto personal sin relación con Epic Games.
