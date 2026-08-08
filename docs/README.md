# Documentación

Cada archivo cubre **una función** del proyecto y sigue la misma estructura:

1. **Qué hace** — para qué existe
2. **Cómo funciona** — la mecánica, con los archivos implicados
3. **Decisiones y por qué** — lo que se descartó y la razón
4. **Evolución** — bitácora fechada de los cambios a *esa* función

Para la vista cronológica global ve al [CHANGELOG](../CHANGELOG.md).

## Índice

| Documento | De qué trata |
|---|---|
| [catalogo.md](catalogo.md) | Modelo de datos y **cómo actualizarlo cada temporada** |
| [coleccion.md](coleccion.md) | El checklist, los tres estados y el Mastery |
| [filtros.md](filtros.md) | Búsqueda, filtros, agrupación y estadísticas |
| [compartir.md](compartir.md) | Códigos, comparación con amigos y el porqué de `codeOrder` |
| [hunt-historial.md](hunt-historial.md) | Lista de búsqueda e historial con fechas |
| [diseno.md](diseno.md) | Sistema visual y color por variante |
| [imagenes.md](imagenes.md) | Procedencia de las imágenes y cómo agregar las que falten |
| [seguridad.md](seguridad.md) | Modelo de amenazas y mitigaciones |
| [deploy.md](deploy.md) | Publicar en GitHub Pages, paso a paso |

## Mapa rápido del código

```
index.html          Vista principal (colección, hunt, historial, datos)
compare.html        Comparación con amigos
test.html           Suite de 60 pruebas — ábrela tras cada actualización
test-seed.html      Siembra una colección de ejemplo para revisar el diseño

data/sprites.json   ⭐ el único archivo a editar cada temporada
img/sprites/        127 imágenes de 96×96, auto-hospedadas

js/catalog.js       Carga, valida y aplana el catálogo (dos órdenes distintos)
js/store.js         localStorage, export/import saneado, migraciones
js/share.js         Códigos de compartir (campo de bits ↔ base64url)
js/filters.js       Búsqueda, filtros, agrupación, estadísticas
js/render.js        Pintado del DOM (sin innerHTML, a propósito)
js/app.js           Arranque de index.html
js/compare.js       Arranque de compare.html
```

## Las dos reglas que no se rompen

1. **`codeOrder` es append-only.** Nunca reordenar, renombrar ni borrar. Es lo que hace
   que un link compartido hoy siga funcionando el año que viene. → [compartir.md](compartir.md)
2. **Nada de `innerHTML`.** Todo el DOM se construye con nodos. → [seguridad.md](seguridad.md)
