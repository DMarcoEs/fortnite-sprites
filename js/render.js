// Pintado del DOM: estadisticas, fichas de variante, hunt list e historial.
//
// Todo se construye con createElement/textContent. No se usa innerHTML en
// ninguna parte, a proposito: asi no existe el patron que alguien pueda copiar
// mañana con datos que si vengan de fuera. Ver docs/seguridad.md.

import { NONE, OWNED, MASTERED, getStatus, getEntry, isHunted, loadState } from './store.js';
import { filterEntries, groupEntries, computeStats, pct } from './filters.js';

export const el = (tag, props = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), props);
  for (const c of [].concat(children)) if (c != null) node.append(c);
  return node;
};

export function toast(message, isError = false) {
  document.querySelector('.toast')?.remove();
  const t = el('div', { className: `toast${isError ? ' error' : ''}`, textContent: message });
  document.body.append(t);
  setTimeout(() => t.remove(), isError ? 5500 : 2600);
}

/** "43 / 117" sin innerHTML: el denominador va en su propio <span>. */
function fraction(num, den) {
  return el('div', { className: 'stat-value' }, [
    document.createTextNode(String(num)),
    el('span', { className: 'den', textContent: ` / ${den}` }),
  ]);
}

/**
 * Miniatura de una entrada. Si la imagen no existe (una variante recien
 * anunciada, por ejemplo) cae a la inicial del sprite sobre su color.
 */
export function thumb(entry, cls = '') {
  const img = el('img', {
    src: entry.img,
    alt: `${entry.sprite.name} ${entry.variant.name}`,
    loading: 'lazy',
    decoding: 'async',
    className: cls,
  });
  img.addEventListener('error', () => {
    img.replaceWith(el('div', {
      className: `fallback ${cls}`.trim(),
      textContent: entry.sprite.name.charAt(0),
      title: 'Todavia no hay imagen de esta variante',
    }));
  }, { once: true });
  return img;
}

// ===================== Estadisticas =====================

function breakdown(map) {
  return el('div', { className: 'breakdown' }, [...map.values()]
    .filter(b => b.total > 0)
    .map(b => el('div', { className: 'breakdown-row' }, [
      el('span', { className: 'name', textContent: b.name }),
      el('div', { className: 'bar' }, [
        el('i', { style: `width:${pct(b.owned, b.total)}%; background:${b.color}` }),
      ]),
      el('span', { className: 'num', textContent: `${b.owned}/${b.total}` }),
    ])));
}

export function renderStats(catalog, root) {
  const s = computeStats(catalog, getStatus);
  root.replaceChildren(
    el('div', { className: 'stat' }, [
      el('div', { className: 'stat-label', textContent: 'Coleccion' }),
      fraction(s.collection.owned, s.collection.total),
      el('div', { className: 'stat-sub', textContent: `${pct(s.collection.owned, s.collection.total)}% completado` }),
      el('div', { className: 'bar' }, [el('i', { style: `width:${pct(s.collection.owned, s.collection.total)}%` })]),
    ]),
    el('div', { className: 'stat' }, [
      el('div', { className: 'stat-label', textContent: 'Mastery' }),
      fraction(s.masteredSprites, s.totalSprites),
      el('div', { className: 'stat-sub', textContent: `${s.collection.mastered} variantes masterizadas` }),
      el('div', { className: 'bar' }, [
        el('i', { style: `width:${pct(s.masteredSprites, s.totalSprites)}%; background:var(--gold)` }),
      ]),
    ]),
    el('div', { className: 'stat' }, [
      el('div', { className: 'stat-label', textContent: 'Por rareza' }), breakdown(s.byRarity),
    ]),
    el('div', { className: 'stat' }, [
      el('div', { className: 'stat-label', textContent: 'Por variante' }), breakdown(s.byVariant),
    ]),
  );
}

// ===================== Ficha de variante =====================

function chip(entry, handlers, showSpriteName = false) {
  const status = getStatus(entry.key);
  const saved = getEntry(entry.key);

  const tip = entry.released
    ? `${entry.sprite.name} — ${entry.variant.name}\n${entry.variant.bonus}` +
      (saved?.date ? `\nObtenida el ${saved.date}` : '') +
      `\n\nClic: cambiar estado · Clic derecho: marcar objetivo`
    : `${entry.variant.name} de ${entry.sprite.name}\nAnunciada, todavia no esta en el juego`;

  const node = el('button', {
    className: `chip${isHunted(entry.key) ? ' hunted' : ''}${entry.released ? '' : ' unreleased'}`,
    type: 'button',
    title: tip,
  }, [
    el('div', { className: 'chip-art' }, [thumb(entry)]),
    el('span', {
      className: 'chip-name',
      textContent: showSpriteName
        ? `${entry.sprite.name.replace(' Sprite', '')} ${entry.variant.name}`
        : entry.variant.name,
    }),
  ]);

  node.dataset.status = status;
  node.dataset.key = entry.key;
  // El color de la variante sale del JSON, no del CSS.
  node.style.setProperty('--v1', entry.variant.color);
  node.style.setProperty('--v2', entry.variant.color2 ?? entry.variant.color);

  if (entry.released) {
    node.addEventListener('click', () => handlers.onCycle(entry.key));
    node.addEventListener('contextmenu', ev => { ev.preventDefault(); handlers.onHunt(entry.key); });
  }
  return node;
}

// ===================== Grid =====================

export function renderGroups(catalog, filters, root, handlers) {
  const entries = filterEntries(catalog, filters, { getStatus, isHunted });

  if (!entries.length) {
    root.replaceChildren(el('div', { className: 'empty-state' }, [
      el('span', { className: 'big', textContent: '🫧' }),
      el('div', { textContent: 'Ningun sprite coincide con esos filtros.' }),
    ]));
    return;
  }

  const groups = groupEntries(catalog, entries, filters);
  const grouping = filters.groupBy;

  root.replaceChildren(...groups.map(g => {
    const released = g.entries.filter(e => e.released);
    const owned = released.filter(e => getStatus(e.key) >= OWNED).length;
    const rarity = g.rarity ? catalog.rarities.get(g.rarity) : null;

    return el('section', { className: 'group' }, [
      el('div', { className: 'group-head' }, [
        el('h3', { className: 'group-title', textContent: g.title }),
        rarity ? el('span', { className: 'pill', textContent: rarity.name, style: `color:${rarity.color}` }) : null,
        el('span', { className: 'group-count', textContent: `${owned}/${released.length}` }),
      ]),
      g.meta ? el('p', { className: 'group-meta', textContent: g.meta }) : null,
      el('div', { className: 'variants' },
        g.entries.map(e => chip(e, handlers, grouping !== 'sprite'))),
    ]);
  }));
}

// ===================== Hunt list =====================

export function renderHunt(catalog, root, handlers) {
  const keys = loadState().hunt;

  if (!keys.length) {
    root.replaceChildren(el('div', { className: 'empty-state' }, [
      el('span', { className: 'big', textContent: '🎯' }),
      el('div', { textContent: 'Tu lista de busqueda esta vacia.' }),
      el('div', { className: 'sub',
        textContent: 'Haz clic derecho sobre cualquier variante en la Coleccion para marcarla como objetivo.' }),
    ]));
    return;
  }

  root.replaceChildren(el('div', { className: 'variants' },
    keys.map(k => catalog.byKey.get(k)).filter(Boolean).map(e => chip(e, handlers, true))));
}

// ===================== Historial =====================

export function renderHistory(catalog, root) {
  const rows = Object.entries(loadState().entries)
    .map(([key, data]) => ({ key, ...data, entry: catalog.byKey.get(key) }))
    .filter(r => r.entry && r.date)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (!rows.length) {
    root.replaceChildren(el('div', { className: 'empty-state' }, [
      el('span', { className: 'big', textContent: '📖' }),
      el('div', { textContent: 'Todavia no has registrado ningun sprite.' }),
      el('div', { className: 'sub', textContent: 'La fecha se guarda sola al marcar una variante como obtenida.' }),
    ]));
    return;
  }

  root.replaceChildren(el('ul', { className: 'timeline' }, rows.map(r => el('li', {}, [
    thumb(r.entry),
    el('span', {}, [
      el('span', { textContent: `${r.entry.sprite.name.replace(' Sprite', '')} · ` }),
      el('span', { textContent: r.entry.variant.name, style: `color:${r.entry.variant.color};font-weight:600` }),
      r.status === MASTERED ? el('span', { textContent: '  ★', style: 'color:var(--gold)' }) : null,
      r.note ? el('div', { textContent: r.note, style: 'color:var(--text-mute);font-size:.78rem' }) : null,
    ]),
    el('span', { className: 'date', textContent: r.date }),
  ]))));
}
