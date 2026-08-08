# ✨ Sprite Tracker

Checklist para la colección de **Sprites de Fortnite**. Sin cuentas, sin servidor, sin costo.

- **127 variantes lanzadas** repartidas en **30 sprites**, más 12 anunciadas que aún no salen.
- Doble progreso: **Colección** (¿la tengo?) y **Mastery** (¿nivel 5 y extraída?).
- **Comparación con amigos sin login**: tu colección entera cabe en un código de 49 caracteres.
- Filtros, búsqueda, lista de búsqueda e historial con fechas.
- Imagen real de cada sprite, con el color de su variante.

## Cómo se usa

**Marcar** — cada variante es un botón que cicla con un clic:

| Clic | Estado |
|---|---|
| 1 | ✓ **La tengo** |
| 2 | ★ **Master** (nivel 5 + extraída) |
| 3 | vuelve a **Me falta** |

**Clic derecho** la agrega a tu lista de búsqueda 🎯. Al conseguirla sale sola.

**Comparar** — *Datos → Copiar link* y mándaselo a un amigo. Al abrirlo verá al instante
quién tiene qué, en cuatro grupos: solo yo / solo él / los dos / ninguno. Que te pase el
suyo de vuelta y comparas tú también.

**Respaldar** — *Datos → Exportar JSON* guarda todo: estados, fechas, notas, hunt list y
amigos. El código compartido solo lleva estados; el JSON lleva el resto.

> ⚠️ Tus marcas viven en el `localStorage` de este navegador. Si borras los datos de
> navegación, las pierdes. Exporta de vez en cuando.

## Desarrollo local

Sin build, sin dependencias, sin `npm install`. Pero **no abras `index.html` con doble
clic**: el navegador bloquea `fetch()` sobre `file://` y el catálogo no cargará.

```
code --install-extension ritwickdey.LiveServer
```

Luego clic derecho en `index.html` → *Open with Live Server*.

| Página | Para qué |
|---|---|
| `index.html` | el sitio |
| `compare.html` | comparación con amigos |
| `test.html` | **60 pruebas** — ábrela tras cada cambio del catálogo |
| `test-seed.html` | siembra una colección de ejemplo para revisar el diseño |

`test.html` respalda tu colección antes de correr y la restaura al terminar: abrirla no
borra nada.

## Actualizar cada temporada

Todo el catálogo vive en **`data/sprites.json`**. No hace falta tocar código.

**La regla que no se rompe:** `codeOrder` es **append-only**. Nunca reordenar, renombrar ni
borrar una clave; las nuevas se pegan **al final**. Es lo que hace que un link compartido
hoy siga funcionando el año que viene.

El procedimiento completo está en **[docs/catalogo.md](docs/catalogo.md)**.

## Documentación

- **[CHANGELOG.md](CHANGELOG.md)** — qué cambió y cuándo
- **[docs/](docs/)** — un documento por función, cada uno con su bitácora de evolución

Empieza por [docs/README.md](docs/README.md).

## Publicar

Paso a paso en **[docs/deploy.md](docs/deploy.md)**. Resumen: `gh repo create … --push`,
activar Pages desde `main` / root, y listo. Después, publicar cambios es `git push`.

## Créditos y derechos

Proyecto personal de fan, **sin relación con Epic Games**.

Los Sprites y sus imágenes son propiedad de Epic Games. Datos e imágenes contrastados con
[staticvacant/fnsprites](https://github.com/staticvacant/fnsprites),
[spritecatch.com](https://spritecatch.com/sprites/),
[spritechecklist.org](https://spritechecklist.org/all-sprites/) y fortnite.gg.
