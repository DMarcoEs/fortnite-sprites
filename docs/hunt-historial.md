# Lista de búsqueda e historial

## Qué hace

Dos funciones pequeñas que cierran el ciclo: **antes** de la partida decides qué buscas,
**después** queda registrado cuándo lo conseguiste.

**Archivos:** [`js/store.js`](../js/store.js) · [`js/render.js`](../js/render.js)

## Cómo funciona

### Buscando ahora

- **Clic derecho** sobre cualquier ficha la marca o desmarca como objetivo.
- Las marcadas llevan  y borde azul en toda la colección, no solo en su pestaña.
- La pestaña **Buscando** las junta con el nombre del sprite visible.
- El filtro *"En mi lista de búsqueda"* hace lo mismo sin cambiar de pestaña.

**Al marcar una como obtenida, sale sola de la lista.** Está en `setStatus()`, no en la
interfaz: conseguir algo es dejar de buscarlo, y no debería costar un clic extra.

### Historial

Línea de tiempo de todo lo conseguido, de lo más reciente a lo más antiguo, con la
miniatura, el nombre, la variante en su color, master si está masterizada y la nota si escribiste
alguna.

La fecha se guarda **automáticamente** al marcar algo como obtenido, en formato `AAAA-MM-DD`,
y **no se pisa** si luego lo masterizas.

Solo aparecen las entradas con fecha. Las importadas de un código compartido no la tienen
(el código solo lleva estados, ver [compartir.md](compartir.md)), así que no ensucian tu
historial con datos falsos.

## Decisiones y por qué

**Clic derecho en vez de un botón aparte.** Un segundo botón por ficha habría duplicado los
objetivos de clic en 139 entradas para una acción ocasional. El menú contextual estaba libre.
El coste es que **no es descubrible**, así que se dice explícitamente en la leyenda, en el
`title` de cada ficha y en el estado vacío de la pestaña.

**Fecha automática, no un formulario.** Si registrar algo costara escribir una fecha, nadie
lo haría. Se pone sola y se puede corregir después.

**Se guarda la primera fecha.** Interesa cuándo lo conseguiste, no cuándo lo tocaste por
última vez.

**Sin historial de eventos.** Se guarda una fecha por entrada, no un registro de cada
cambio. Un log completo pesaría más y respondería preguntas que nadie hace.

## Limitaciones conocidas

- La nota se guarda y se muestra, pero **todavía no hay interfaz para escribirla**.
  `store.setNote()` existe y está probado; falta el campo en pantalla.
- La fecha no se puede editar desde la interfaz, aunque `store.setDate()` ya funciona.

Ambas son deliberadas: se prefirió tener el resto pulido antes que añadir formularios que
quizá no se usen. Si al usarlo hacen falta, son un rato de trabajo.

## Evolución

### 2026-08-08 — Sesión 2
- El historial ahora muestra la miniatura de cada sprite.
- La fecha se movió a la derecha de cada fila, más limpio.
- El `title` de cada ficha incluye la fecha en que la conseguiste.
- El estado vacío explica cómo marcar objetivos, porque el clic derecho no es descubrible.
- La hunt list importada se limita a 200 entradas y se filtra contra el catálogo
  (ver [seguridad.md](seguridad.md)).

### 2026-08-08 — Sesión 1
- Hunt list por clic derecho, con retirada automática al conseguir la variante.
- Historial con fecha automática, orden descendente y soporte de notas en el modelo.
