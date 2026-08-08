# Seguridad

## Qué hace

Protege el sitio y tu colección. Antes que nada, la calibración honesta:

> **No hay servidor, ni base de datos, ni cuentas, ni dinero de por medio.** GitHub Pages
> sirve archivos estáticos desde un CDN. No hay backend que hackear ni datos de otras
> personas que filtrar: tus marcas viven solo en tu navegador.

La superficie de ataque es chica, pero no es cero. Esto es lo que hay y lo que se hizo.

## Modelo de amenazas

| Amenaza | Riesgo real | Qué la mitiga |
|---|---|---|
| Que alguien edite tu sitio | **El vector serio** | 2FA + branch protection |
| Tirar el sitio (DoS) | Prácticamente nulo | Lo sirve el CDN de GitHub |
| XSS por el código de un amigo | Bajo, pero es la única entrada externa | Sin `innerHTML` + CSP |
| Un respaldo JSON manipulado | Bajo | Import saneado |
| Cadena de suministro | **Nulo** | Cero dependencias |
| Fuga de datos personales | Nulo | No se recoge ninguno |

## "Que no me lo editen"

Un repo público deja a cualquiera **leer** el código, nunca escribirlo. Solo tú puedes hacer
push. Aun así:

- **Activa 2FA en tu cuenta de GitHub.** Es el único camino realista por el que alguien
  tomaría control del sitio: robándote la cuenta, no atacando la página.
- **Protege la rama `main`**: bloquear force-push y borrado.
- **No agregues colaboradores.** Si alguien quiere aportar, que mande un pull request.
- Los forks son copias independientes. Nadie modifica tu sitio desde uno.
- GitHub Pages en repo privado exige plan de pago. Público no implica riesgo de edición.

Los pasos concretos están en [deploy.md](deploy.md).

## "Que no lo tiren o lo malogren"

### DoS
Lo sirve el CDN de GitHub, con su capacidad y su protección. No es algo que tú puedas
configurar mal ni que un atacante pueda saturar desde tu lado.

### XSS

El único punto donde entra texto ajeno es **el código que te pasa un amigo**. Ese código se
decodifica a puros números (0, 1 o 2), así que no hay inyección posible ni aunque venga
manipulado. Aun así se endureció:

- **Cero `innerHTML` en todo el proyecto.** Todo el DOM se construye con `createElement` y
  `textContent`. En la sesión 1 quedaban 5 usos que solo interpolaban números — inofensivos,
  pero se eliminaron para que **el patrón no exista** y nadie lo copie mañana con datos que
  sí vengan de fuera.
- **CSP por `<meta>`** en ambas páginas:
  ```
  default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline';
  img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'
  ```
  Al no haber dependencias externas, la política puede ser estricta sin romper nada.
- **El fallback de imagen usa `addEventListener`, no el atributo `onerror`.** Un `onerror=`
  en el HTML es script inline y el CSP lo bloquearía.

#### Limitaciones que conviene conocer

- **`style-src` necesita `'unsafe-inline'`.** El color de cada variante se inyecta como
  atributo `style`, que es exactamente lo que esa directiva controla. La alternativa sería
  generar hojas de estilo con nonce, imposible en un sitio estático sin servidor. El riesgo
  es bajo: inyectar CSS no ejecuta código, y sin `innerHTML` no hay forma de meter estilos
  ajenos.
- **`frame-ancestors` no funciona por `<meta>`**, solo por cabecera HTTP, y GitHub Pages no
  permite cabeceras propias. Es decir, no hay defensa completa contra que alguien embeba la
  página en un iframe. Para un sitio sin login ni acciones sensibles el impacto es
  despreciable: no hay nada que robar mediante clickjacking.

### Import de JSON

Un archivo manipulado no puede dejar el estado inconsistente. `store.importJSON()`:

- **rechaza** archivos de más de 1 MB (un respaldo real pesa unos pocos KB)
- **rechaza** JSON inválido o sin la forma esperada
- **descarta** claves que no existan en el catálogo actual
- **descarta** estados que no sean 1 o 2
- **limpia** fechas que no cumplan `AAAA-MM-DD`
- **recorta** las notas a 500 caracteres
- **limita** la hunt list a 200 entradas y los amigos a 50
- **avisa** cuántas entradas se descartaron

### Cadena de suministro

Cero dependencias, cero `npm install`, cero CDN. **Nada que se comprometa río arriba.** Es
la mayor ventaja de seguridad de haber elegido este stack, y probablemente lo que más
protege al proyecto a largo plazo.

## Privacidad

- Todo vive en el `localStorage` de tu navegador. Nada sale a internet.
- El código del amigo viaja en el **fragmento** de la URL (después del `#`), que los
  navegadores **no envían al servidor**. Ni GitHub ve qué sprites tienes.
- La comparación se calcula íntegramente en tu navegador.
- No hay analítica, ni cookies, ni rastreadores.

## Un riesgo que sí es tuyo

**Perder la colección.** No es un ataque, es lo más probable que te pase: borrar los datos
del navegador, cambiar de computadora o usar otro navegador. Por eso existe **Datos →
Exportar JSON**. Hazlo de vez en cuando.

La suite de pruebas ([`test.html`](../test.html)) manipula el estado guardado mientras corre,
así que **respalda tu colección al empezar y la restaura al terminar**, incluso si cierras
la pestaña a media prueba.

## Evolución

### 2026-08-08 — Sesión 2
- Se añadió CSP por `<meta>` a `index.html` y `compare.html`.
- Se eliminaron los 5 `innerHTML` restantes (`render.js` ×2, `compare.js` ×3).
- Se saneó por completo `importJSON()`: tope de tamaño, validación de forma, filtrado
  contra el catálogo, recorte de campos y reporte de descartes.
- El fallback de imagen se enganchó por `addEventListener` para no depender de handlers inline.
- Se añadió `maxlength` al nombre de amigo y `rel`/`autocomplete` donde correspondía.
- Se añadió el seguro de respaldo-y-restauración a la suite de pruebas.
- Se documentó el modelo de amenazas y, explícitamente, las dos limitaciones del CSP.

### 2026-08-08 — Sesión 1
- Decisión de fondo: sitio estático, sin backend, sin cuentas y sin dependencias.
- El código compartido se puso en el fragmento de la URL por privacidad.
- La vista de comparación se diseñó de solo lectura desde el principio.
