# Compartir y comparar

## Qué hace

Permite mandarle tu colección entera a un amigo en un link, y ver al instante quién tiene
qué. **Sin cuentas, sin servidor y sin base de datos.**

**Archivos:** [`js/share.js`](../js/share.js) · [`js/compare.js`](../js/compare.js) · [`compare.html`](../compare.html)

## Cómo funciona

Tu colección se comprime en un **campo de bits**:

1. Cada entrada del catálogo ocupa **2 bits**: `0` no la tengo, `1` obtenida, `2` masterizada.
2. Se recorren en el orden de `catalog.codeIndex` (**nunca** el de `catalog.flat`).
3. 139 entradas × 2 bits = 278 bits = 35 bytes → base64url = **49 caracteres**.
4. Formato final: `2.BgAAAAAAABAA…` (versión de catálogo + payload).

El resultado va en `compare.html#c=<código>`. Al abrirlo, `compare.js` lo decodifica y
reparte las entradas en cuatro grupos: **solo yo / solo él / los dos / ninguno**.

Como `bit = i * 2` siempre es par, los 2 bits de una entrada nunca cruzan un byte — por eso
el empaquetado es tan simple.

### Detalles que importan

- **Va después del `#`.** Los navegadores **no mandan el fragmento al servidor**. Ni GitHub
  ve qué sprites tienes.
- **La comparación solo lee.** Nunca escribe sobre tu colección. Un link malicioso, en el
  peor de los casos, muestra datos sin sentido.
- **Acepta el link completo pegado**, no solo el código suelto.
- **Un código corrupto da un mensaje legible**, no una pantalla rota.
- Las notas y fechas **no** caben aquí — para eso está el export JSON completo.

## 🔴 Por qué existe `codeOrder`

Esta es la decisión más importante del proyecto.

En el campo de bits, **la posición de una entrada ES su identidad**. Si `water:gold` está en
la posición 1, todo código que exista en el mundo asume que el bit 2-3 habla de `water:gold`.

En la sesión 1 esa posición se derivaba de recorrer `sprites[] → variants[]`. Eso funciona
mientras el contenido nuevo llegue al final… **y las variantes nuevas no llegan al final.**

Epic sacó la tanda de Gem, que agrega `gem` a Fire, Ghost, Dream y Boss — sprites que están
al principio del archivo:

```
ANTES:  … fire:base, fire:gold, fire:gummy, fire:galaxy, fire:holofoil, fire:cube, fire:quack, fishy:base …
                                                                                    ↑ posición 21

DESPUÉS de insertar fire:gem en su sitio "natural":
        … fire:base, fire:gold, fire:gummy, fire:galaxy, fire:holofoil, fire:gem, fire:cube, fire:quack, fishy:base …
                                                                          ↑ nueva     ↑ todo lo de aquí en adelante
                                                                                        se corrió una posición
```

Las ~90 entradas posteriores se recorren. **Todos los links compartidos empezarían a
decodificar sprites equivocados**, y sin ningún error visible: simplemente enseñarían datos
incorrectos.

### La solución

Se separaron los dos órdenes:

```jsonc
"sprites":   [ … ]   // orden de PRESENTACIÓN — editable a gusto
"codeOrder": [ … ]   // orden de CODIFICACIÓN — append-only, sagrado
```

Ahora `fire:gem` se muestra junto a las demás variantes de Fire (posición 19 de la vista)
pero se codifica en la **posición 118**, al final, donde no molesta a nadie.

Un código viejo simplemente es más corto; los bytes que faltan valen 0 y las entradas
nuevas salen como "no la tengo". `catalog.js` valida que las dos listas contengan
exactamente el mismo conjunto de claves.

**Se arregló antes del primer deploy, cuando no había ni un código en circulación.
Después habría sido irreparable sin romper los links de todo el mundo.**

La suite tiene una prueba dedicada: fabrica un código de la época de 118 entradas y
verifica que decodifica idéntico contra el catálogo de 139.

## Decisiones y por qué

**Campo de bits en vez de JSON en la URL.** Un JSON con 139 claves da miles de caracteres;
esto da 49. Cabe en cualquier chat sin que nadie lo trunque.

**2 bits por entrada en vez de 1.** Permite distinguir *masterizada* de simplemente
*obtenida*, que es un eje de progreso real del juego.

**base64url en vez de base64.** Los caracteres `+` y `/` se rompen dentro de una URL.

**Prefijo de versión.** Si algún día el formato cambia, un código viejo se puede detectar
y tratar aparte en vez de decodificarse mal en silencio.

**Sin backend, ni siquiera opcional.** Se evaluó Supabase para sincronizar entre
dispositivos. Se descartó por ahora: añade cuentas, un servicio que mantener y datos
personales que proteger, para resolver algo que el export JSON ya cubre.

## Evolución

### 2026-08-08 — Sesión 2
- **Se cambió la base de la codificación de `catalog.flat` a `catalog.codeIndex`.** Es el
  cambio descrito arriba; sin él, la reconciliación del catálogo habría roto todos los links.
- `catalogVersion` → 2, códigos de 42 → 49 caracteres (139 entradas en vez de 118).
- Se validan códigos más largos que el catálogo (vienen de una versión más nueva del sitio).
- Se quitó `innerHTML` de la vista de comparación.
- Los grupos ahora muestran la miniatura de cada sprite.

### 2026-08-08 — Sesión 1
- Versión inicial: campo de bits, base64url, 42 caracteres, comparación en cuatro grupos,
  amigos guardados y "copiar como texto" para Discord.
- Se eligió el fragmento de la URL sobre el query string, por privacidad.
