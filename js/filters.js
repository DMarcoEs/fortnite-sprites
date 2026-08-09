// Busqueda, filtros, orden y calculo de estadisticas.

import { NONE, OWNED, MASTERED } from './store.js?v=4';

export const defaultFilters = () => ({
  search: '',
  rarity: 'all',
  variant: 'all',
  season: 'all',
  status: 'all',   // all | missing | owned | mastered | hunt
  groupBy: 'sprite', // sprite | variant | rarity
  sortBy: 'rarity',  // rarity | name
});

/** Aplica los filtros al indice aplanado. */
export function filterEntries(catalog, filters, ctx) {
  const q = filters.search.trim().toLowerCase();

  return catalog.flat.filter(e => {
    if (q && !e.sprite.name.toLowerCase().includes(q) && !e.variant.name.toLowerCase().includes(q)) return false;
    if (filters.rarity !== 'all' && e.sprite.rarity !== filters.rarity) return false;
    if (filters.variant !== 'all' && e.variantId !== filters.variant) return false;
    if (filters.season !== 'all' && e.sprite.season !== filters.season) return false;

    const status = ctx.getStatus(e.key);
    switch (filters.status) {
      case 'missing':  return status === NONE;
      case 'owned':    return status >= OWNED;
      case 'mastered': return status === MASTERED;
      case 'hunt':     return ctx.isHunted(e.key);
      default:         return true;
    }
  });
}

/** Agrupa las entradas ya filtradas segun groupBy. Devuelve [{id, title, meta, entries}]. */
export function groupEntries(catalog, entries, filters) {
  const groups = new Map();

  const push = (id, makeGroup, entry) => {
    if (!groups.has(id)) groups.set(id, { id, ...makeGroup(), entries: [] });
    groups.get(id).entries.push(entry);
  };

  for (const e of entries) {
    if (filters.groupBy === 'variant') {
      push(e.variantId, () => ({
        title: e.variant.name,
        meta: e.variant.bonus,
        color: e.variant.color,
      }), e);
    } else if (filters.groupBy === 'rarity') {
      const r = catalog.rarities.get(e.sprite.rarity);
      push(e.sprite.rarity, () => ({ title: r.name, meta: '', color: r.color }), e);
    } else {
      const r = catalog.rarities.get(e.sprite.rarity);
      push(e.spriteId, () => ({
        title: e.sprite.name,
        meta: e.sprite.ability,
        color: r.color,
        rarity: e.sprite.rarity,
        sprite: e.sprite,
      }), e);
    }
  }

  const list = [...groups.values()];

  if (filters.groupBy === 'sprite') {
    if (filters.sortBy === 'name') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      const order = id => catalog.rarities.get(id).order;
      list.sort((a, b) => order(a.rarity) - order(b.rarity) || a.title.localeCompare(b.title));
    }
  } else if (filters.groupBy === 'variant') {
    const order = new Map(catalog.variantList.map((v, i) => [v.id, i]));
    list.sort((a, b) => order.get(a.id) - order.get(b.id));
  } else {
    list.sort((a, b) => catalog.rarities.get(a.id).order - catalog.rarities.get(b.id).order);
  }

  return list;
}

/**
 * Progreso global y desgloses. Solo cuenta entradas ya lanzadas en el juego,
 * para que el denominador coincida con el que manejan los demas sitios (117).
 */
export function computeStats(catalog, getStatus) {
  const blank = () => ({ owned: 0, mastered: 0, total: 0 });
  const stats = {
    collection: blank(),
    byRarity: new Map(catalog.rarityList.map(r => [r.id, { ...blank(), name: r.name, color: r.color }])),
    byVariant: new Map(catalog.variantList.map(v => [v.id, { ...blank(), name: v.name, color: v.color }])),
    // Mastery de sprites: un sprite cuenta si masterizaste su variante Base.
    masteredSprites: 0,
    totalSprites: catalog.sprites.length,
  };

  for (const e of catalog.flat) {
    if (!e.released) continue;
    const status = getStatus(e.key);
    for (const bucket of [stats.collection, stats.byRarity.get(e.sprite.rarity), stats.byVariant.get(e.variantId)]) {
      bucket.total++;
      if (status >= OWNED) bucket.owned++;
      if (status === MASTERED) bucket.mastered++;
    }
  }

  for (const sprite of catalog.sprites) {
    if (getStatus(`${sprite.id}:base`) === MASTERED) stats.masteredSprites++;
  }

  return stats;
}

export const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);
