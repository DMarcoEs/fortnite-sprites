// Carga, valida y aplana el catalogo de sprites.
//
// Hay DOS ordenes distintos y no hay que confundirlos:
//
//   catalog.flat       Orden de PRESENTACION. Sale de recorrer sprites[] y, dentro
//                      de cada uno, su array variants[]. Se puede reordenar libremente.
//                      Lo usan los filtros, las estadisticas y el render.
//
//   catalog.codeIndex  Orden de CODIFICACION. Sale tal cual de codeOrder[] del JSON.
//                      Es APPEND-ONLY: la posicion de cada entrada es su identidad
//                      dentro del codigo para compartir. Solo lo usa share.js.
//
// Separarlos es lo que permite que Epic agregue una variante en medio (como la tanda
// de Gem, que se mete en Fire y Ghost) sin invalidar los codigos ya compartidos.

/** @typedef {{key:string, spriteId:string, variantId:string, sprite:object, variant:object, released:boolean, img:string}} Entry */

let catalog = null;

export async function loadCatalog() {
  if (catalog) return catalog;

  const res = await fetch('data/sprites.json', { cache: 'no-cache' });
  if (!res.ok) {
    throw new Error(
      `No se pudo cargar data/sprites.json (HTTP ${res.status}). ` +
      `Si abriste el archivo con doble clic, el navegador bloquea fetch(): usa Live Server.`
    );
  }
  const raw = await res.json();

  const variants = new Map(raw.variants.map(v => [v.id, v]));
  const rarities = new Map(raw.rarities.map(r => [r.id, r]));
  const seasons = new Map(raw.seasons.map(s => [s.id, s]));

  // --- Validacion: falla ruidosamente en vez de mostrar datos corruptos ---
  const problems = [];
  const seenSprites = new Set();

  for (const s of raw.sprites) {
    if (seenSprites.has(s.id)) problems.push(`sprite duplicado: "${s.id}"`);
    seenSprites.add(s.id);

    if (!rarities.has(s.rarity)) problems.push(`"${s.id}" usa una rareza inexistente: "${s.rarity}"`);
    if (!seasons.has(s.season)) problems.push(`"${s.id}" usa una temporada inexistente: "${s.season}"`);

    const seenVariants = new Set();
    for (const v of s.variants) {
      if (!variants.has(v)) problems.push(`"${s.id}" usa una variante inexistente: "${v}"`);
      if (seenVariants.has(v)) problems.push(`"${s.id}" repite la variante "${v}"`);
      seenVariants.add(v);
    }
    for (const v of s.unreleased ?? []) {
      if (!seenVariants.has(v)) problems.push(`"${s.id}" marca como no lanzada "${v}", que no esta en sus variantes`);
    }
  }

  // --- Aplanado en orden de presentacion ---
  /** @type {Entry[]} */
  const flat = [];
  const byKey = new Map();

  for (const sprite of raw.sprites) {
    const unreleased = new Set(sprite.unreleased ?? []);
    for (const variantId of sprite.variants) {
      const key = `${sprite.id}:${variantId}`;
      const entry = {
        key,
        spriteId: sprite.id,
        variantId,
        sprite,
        variant: variants.get(variantId),
        released: !unreleased.has(variantId),
        img: `img/sprites/${sprite.id}-${variantId}.png`,
      };
      byKey.set(key, entry);
      flat.push(entry);
    }
  }

  // --- Validacion critica de codeOrder ---
  // Si esto se rompe, los codigos ya compartidos decodifican sprites equivocados.
  const codeOrder = raw.codeOrder ?? [];
  const seenInCode = new Set();
  const codeIndex = [];

  for (const key of codeOrder) {
    if (seenInCode.has(key)) {
      problems.push(`codeOrder repite la clave "${key}"`);
      continue;
    }
    seenInCode.add(key);
    const entry = byKey.get(key);
    if (!entry) {
      problems.push(`codeOrder menciona "${key}", que no existe en sprites[]`);
      continue;
    }
    codeIndex.push(entry);
  }
  for (const entry of flat) {
    if (!seenInCode.has(entry.key)) {
      problems.push(`"${entry.key}" existe en sprites[] pero falta en codeOrder (agregala AL FINAL)`);
    }
  }

  if (problems.length) {
    throw new Error('data/sprites.json tiene errores:\n  - ' + problems.join('\n  - '));
  }

  catalog = {
    catalogVersion: raw.catalogVersion,
    sprites: raw.sprites,
    variantList: raw.variants,
    rarityList: [...raw.rarities].sort((a, b) => a.order - b.order),
    seasonList: raw.seasons,
    variants, rarities, seasons,
    flat,       // presentacion
    codeIndex,  // codificacion (append-only)
    byKey,
    /** Entradas ya disponibles en el juego. Es el denominador que se muestra. */
    totalReleased: flat.filter(e => e.released).length,
    totalAll: flat.length,
  };

  return catalog;
}

export function getCatalog() {
  if (!catalog) throw new Error('loadCatalog() debe ejecutarse primero');
  return catalog;
}
