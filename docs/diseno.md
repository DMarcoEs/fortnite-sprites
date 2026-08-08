# Diseño

## Qué hace

Define cómo se ve el sitio. La idea rectora: **estructura minimalista, color generoso**.
La interfaz aporta el mínimo de cajas, bordes y ruido; el color de cada variante hace el
trabajo pesado de identificar qué estás viendo.

**Archivos:** [`css/styles.css`](../css/styles.css) · [`js/render.js`](../js/render.js)

## Cómo funciona

### El color no vive en el CSS

Cada variante define su degradado en [`data/sprites.json`](../data/sprites.json):

```jsonc
{ "id": "gold", "name": "Gold", "color": "#f5c542", "color2": "#a8760b", … }
```

`render.js` los inyecta en cada ficha como custom properties:

```js
node.style.setProperty('--v1', entry.variant.color);
node.style.setProperty('--v2', entry.variant.color2 ?? entry.variant.color);
```

Y el CSS los consume sin saber qué variantes existen:

```css
.chip-art::before { background: linear-gradient(155deg, var(--v1), var(--v2)); }
```

**Agregar una variante nueva no requiere tocar el CSS.** Solo el JSON.

### Los tres estados

El color dice *qué variante es*; la intensidad dice *si la tienes*. Dos señales que no compiten.

| Estado | Degradado | Imagen | Botón al pie |
|---|---|---|---|
| **Me falta** | 22% de opacidad | gris, al 55% | gris, "Me falta" |
| **La tengo** | pleno | a color | con el degradado de la variante, "La tengo" |
| **Masterizada** | pleno + anillo dorado | a color | dorado, "Master" |

Las marcadas como objetivo llevan borde azul y un punto azul en la esquina. Nada de esto usa
iconos ni emojis: son formas dibujadas con CSS.

### Paleta de variantes

| Variante | Degradado | Idea |
|---|---|---|
| Base | gris azulado | neutro, es la forma normal |
| Gold | dorado → bronce | el clásico |
| Gummy | rosa → magenta | caramelo |
| Galaxy | violeta → azul noche | espacio |
| Holofoil | cian → morado | iridiscente, cambia de tono |
| Gem | cian claro → azul | cristal |
| Cube | violeta → púrpura | el Cubo |
| Quack | amarillo → ámbar | pato |

### Accesibilidad

- `prefers-reduced-motion` desactiva transiciones y el hover que levanta las fichas.
- Foco visible con `:focus-visible` en las fichas.
- Cada ficha es un `<button>` real, navegable con teclado.
- Las imágenes llevan `alt` descriptivo, y el `title` incluye el bonus de la variante y la
  fecha en que la conseguiste.
- `color-scheme: dark` para que los controles nativos combinen.

### Responsive

El grid de tarjetas usa `repeat(auto-fill, minmax(148px, 1fr))`, así que se adapta solo a
cualquier ancho. Un breakpoint en 700 px baja el mínimo a 116 px y reduce el padding.

## Decisiones y por qué

**Sin emojis, en ninguna parte.** Ni en la interfaz, ni en la documentación, ni en el
favicon. Los emojis decorativos hacen que un sitio parezca generado automáticamente. Lo que
antes marcaba un emoji ahora lo dice una palabra o una forma dibujada con CSS.

**Color pleno por variante, elegido sobre "acento sutil" y "solo al tenerla".** Con 117
entradas repartidas en 8 variantes, el color es lo que permite escanear la página de un
vistazo. Un acento sutil habría sido más elegante y menos útil.

**Atenuar en vez de ocultar lo que falta.** Ves la colección completa siempre y el progreso
se siente como ir "encendiendo" fichas. Para ver solo lo que falta está el filtro.

**La ficha es la unidad, no el sprite.** Se marca por variante, así que la variante es lo que
tiene que ser clicable y visible. El sprite es solo el agrupador.

**Oscuro y sin conmutador de tema.** Es una app de Fortnite que se usa entre partidas. Un
tema claro sería otra superficie que mantener sin que nadie lo pida.

**Sin framework de CSS.** 350 líneas cubren todo el sitio. Tailwind o Bootstrap pesarían más
que el proyecto entero y romperían la promesa de "sin build".

## Evolución

### 2026-08-08 — Sesión 4
- **Rediseño de las tarjetas al estilo de fortnite.gg**, manteniendo nuestra distribución
  agrupada por sprite y con aire entre elementos. La estructura pasó a ser: imagen grande
  sobre el degradado de su variante, nombre debajo, y un botón de estado al pie.
- **Imágenes mucho más grandes**: las tarjetas pasaron de 92 px a un grid fluido desde
  148 px, y las imágenes se re-renderizaron a 192 px. Antes se veían pequeñas y borrosas.
- **Se eliminaron todos los emojis** de la interfaz. El logo, el favicon, el icono de
  búsqueda y el marcador de objetivo son ahora formas CSS o SVG. Los estados dejaron de
  usar glifos y los dice el botón con palabras.
- El grid pasó de `flex-wrap` a `grid` con `auto-fill`, para que las tarjetas queden
  alineadas en columnas en vez de amontonarse.

### 2026-08-08 — Sesión 2
- **Rediseño completo.** Se reescribió `styles.css`.
- Las fichas pasaron de texto sobre color a **imagen del sprite sobre el degradado de su
  variante**.
- Se añadió `color2` y el sistema `--v1`/`--v2` inyectado desde JS, para que el CSS no
  necesite conocer las variantes.
- Se rediseñaron los tres estados: antes eran cambios de fondo; ahora opacidad del degradado
  + desaturación de la imagen + marca ok/master.
- Se bajó el ruido general: menos bordes, más aire, tipografía con más jerarquía, panel de
  estadísticas menos dominante.
- Se añadió soporte de `prefers-reduced-motion` y `:focus-visible`.
- Se añadió el tratamiento visual de las entradas no lanzadas.

### 2026-08-08 — Sesión 1
- Primera versión: fichas de texto con color de variante en el borde, tarjetas por sprite
  con color de rareza, tema oscuro, grid responsive.
- Ya entonces los colores salían del JSON, no del CSS.
