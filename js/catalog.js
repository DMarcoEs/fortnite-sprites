// Carga, valida y aplana el catalogo de sprites.
//
// El "indice aplanado" (flat) es la lista ordenada de TODAS las entradas
// coleccionables (sprite x variante). Su ORDEN es sagrado: es lo que hace que
// los codigos para compartir sigan funcionando entre versiones del catalogo.

/** @typedef {{key:string, spriteId:string, variantId:string, sprite:object, variant:object, released:boolean}} Entry */

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
  if (problems.length) {
    throw new Error('data/sprites.json tiene errores:\n  - ' + problems.join('\n  - '));
  }

  // --- Aplanado estable ---
  /** @type {Entry[]} */
  const flat = [];
  const byKey = new Map();

  for (const sprite of raw.sprites) {
    const unreleased = new Set(sprite.unreleased ?? []);
    for (const variantId of sprite.variants) {
      const entry = {
        key: `${sprite.id}:${variantId}`,
        spriteId: sprite.id,
        variantId,
        sprite,
        variant: variants.get(variantId),
        released: !unreleased.has(variantId),
      };
      byKey.set(entry.key, entry);
      flat.push(entry);
    }
  }

  catalog = {
    catalogVersion: raw.catalogVersion,
    sprites: raw.sprites,
    variantList: raw.variants,
    rarityList: [...raw.rarities].sort((a, b) => a.order - b.order),
    seasonList: raw.seasons,
    variants, rarities, seasons,
    flat,
    byKey,
    /** Entradas ya disponibles en el juego. Es el denominador "oficial" (117). */
    totalReleased: flat.filter(e => e.released).length,
    totalAll: flat.length,
  };

  return catalog;
}

export function getCatalog() {
  if (!catalog) throw new Error('loadCatalog() debe ejecutarse primero');
  return catalog;
}
