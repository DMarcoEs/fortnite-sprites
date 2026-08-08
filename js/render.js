// Pintado del DOM: estadisticas, grid de variantes, hunt list e historial.

import { NONE, OWNED, MASTERED, getStatus, getEntry, isHunted, loadState } from './store.js';
import { filterEntries, groupEntries, computeStats, pct } from './filters.js';

const STATUS_LABEL = { [NONE]: 'Falta', [OWNED]: 'Tengo', [MASTERED]: 'Master' };

const el = (tag, props = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), props);
  for (const c of [].concat(children)) if (c != null) node.append(c);
  return node;
};

export function toast(message, isError = false) {
  document.querySelector('.toast')?.remove();
  const t = el('div', { className: `toast${isError ? ' error' : ''}`, textContent: message });
  document.body.append(t);
  setTimeout(() => t.remove(), isError ? 5200 : 2600);
}

// ===== Estadisticas =====

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
      el('div', { className: 'stat-value', innerHTML: `${s.collection.owned}<small> / ${s.collection.total}</small>` }),
      el('div', { className: 'stat-sub', textContent: `${pct(s.collection.owned, s.collection.total)}% completado` }),
      el('div', { className: 'bar' }, [el('i', { style: `width:${pct(s.collection.owned, s.collection.total)}%` })]),
    ]),
    el('div', { className: 'stat' }, [
      el('div', { className: 'stat-label', textContent: 'Mastery' }),
      el('div', { className: 'stat-value', innerHTML: `${s.masteredSprites}<small> / ${s.totalSprites}</small>` }),
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

// ===== Grid =====

function chip(entry, handlers) {
  const status = getStatus(entry.key);
  const node = el('button', {
    className: `chip${isHunted(entry.key) ? ' hunted' : ''}${entry.released ? '' : ' unreleased'}`,
    type: 'button',
    title: entry.released
      ? `${entry.sprite.name} — ${entry.variant.name}\n${entry.variant.bonus}\n\nClic: cambiar estado · Clic derecho: marcar como objetivo`
      : `${entry.variant.name} aun no se ha lanzado en el juego`,
  }, [
    el('span', { className: 'chip-name', textContent: entry.variant.name }),
    el('span', { className: 'chip-state', textContent: entry.released ? STATUS_LABEL[status] : 'Proximamente' }),
  ]);

  node.dataset.status = status;
  node.dataset.key = entry.key;
  node.style.setProperty('--chip-color', entry.variant.color);

  if (entry.released) {
    node.addEventListener('click', () => handlers.onCycle(entry.key));
    node.addEventListener('contextmenu', ev => { ev.preventDefault(); handlers.onHunt(entry.key); });
  }
  return node;
}

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

  root.replaceChildren(...groups.map(g => {
    const owned = g.entries.filter(e => getStatus(e.key) >= OWNED).length;
    const rarity = g.rarity ? catalog.rarities.get(g.rarity) : null;

    return el('section', { className: 'group', style: `--group-color:${g.color}` }, [
      el('div', { className: 'group-head' }, [
        el('h3', { className: 'group-title', textContent: g.title }),
        rarity ? el('span', { className: 'pill', textContent: rarity.name, style: `color:${rarity.color}` }) : null,
        el('span', { className: 'group-count', textContent: `${owned}/${g.entries.length}` }),
        g.meta ? el('p', { className: 'group-meta', textContent: g.meta }) : null,
      ]),
      el('div', { className: 'variants' }, g.entries.map(e => chip(e, handlers))),
    ]);
  }));
}

// ===== Hunt list =====

export function renderHunt(catalog, root, handlers) {
  const keys = loadState().hunt;

  if (!keys.length) {
    root.replaceChildren(el('div', { className: 'empty-state' }, [
      el('span', { className: 'big', textContent: '🎯' }),
      el('div', { textContent: 'Tu lista de busqueda esta vacia.' }),
      el('div', { style: 'font-size:.85rem;margin-top:6px',
        textContent: 'Haz clic derecho sobre cualquier variante en la Coleccion para marcarla como objetivo.' }),
    ]));
    return;
  }

  root.replaceChildren(el('div', { className: 'variants' },
    keys.map(k => catalog.byKey.get(k)).filter(Boolean).map(e => {
      const node = chip(e, handlers);
      node.prepend(el('span', {
        className: 'chip-name',
        textContent: e.sprite.name.replace(' Sprite', ''),
        style: 'font-size:.7rem;color:var(--text-mute);font-weight:500',
      }));
      return node;
    })));
}

// ===== Historial =====

export function renderHistory(catalog, root) {
  const rows = Object.entries(loadState().entries)
    .map(([key, data]) => ({ key, ...data, entry: catalog.byKey.get(key) }))
    .filter(r => r.entry && r.date)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (!rows.length) {
    root.replaceChildren(el('div', { className: 'empty-state' }, [
      el('span', { className: 'big', textContent: '📖' }),
      el('div', { textContent: 'Todavia no has registrado ningun sprite.' }),
    ]));
    return;
  }

  root.replaceChildren(el('ul', { className: 'timeline' }, rows.map(r => el('li', {}, [
    el('span', { className: 'date', textContent: r.date }),
    el('span', {}, [
      el('span', { textContent: `${r.entry.sprite.name} · ` }),
      el('span', { textContent: r.entry.variant.name, style: `color:${r.entry.variant.color};font-weight:600` }),
      r.status === MASTERED ? el('span', { textContent: '  ⭐ master', style: 'color:var(--gold);font-size:.78rem' }) : null,
      r.note ? el('div', { textContent: r.note, style: 'color:var(--text-mute);font-size:.8rem' }) : null,
    ]),
  ]))));
}
