// Vista de comparacion: mi coleccion vs. la de un amigo, todo en el navegador.
//
// El codigo del amigo viaja en el fragmento de la URL (despues del #), que los
// navegadores NO mandan al servidor. Ni GitHub ve que sprites tienen.
// Esta vista solo lee: nunca escribe sobre tu coleccion.

import { loadCatalog } from './catalog.js';
import * as store from './store.js';
import { OWNED } from './store.js';
import { encodeCollection, decodeCollection, buildShareUrl, codeFromLocation } from './share.js';
import { toast, el, thumb } from './render.js';
import { pct } from './filters.js';

const $ = sel => document.querySelector(sel);

const BUCKETS = [
  { id: 'mine',   title: 'Solo yo lo tengo',   hint: 'Presume estos.' },
  { id: 'theirs', title: 'Solo él lo tiene',   hint: 'Estos te faltan a ti.' },
  { id: 'both',   title: 'Los dos lo tenemos', hint: '' },
  { id: 'none',   title: 'Ninguno lo tiene',   hint: 'A cazar juntos.' },
];

function fraction(num, den) {
  return el('div', { className: 'stat-value' }, [
    document.createTextNode(String(num)),
    el('span', { className: 'den', textContent: ` / ${den}` }),
  ]);
}

async function copy(text, okMessage) {
  try {
    await navigator.clipboard.writeText(text);
    toast(okMessage);
  } catch {
    toast('El navegador bloqueo el portapapeles. Copialo a mano.', true);
  }
}

async function main() {
  let catalog;
  try {
    catalog = await loadCatalog();
  } catch (err) {
    const banner = $('#error');
    banner.hidden = false;
    banner.textContent = err.message;
    return;
  }

  store.loadState();
  $('#my-code').value = encodeCollection(catalog, store.getStatus);

  // ---------- Amigos guardados ----------
  function refreshFriends() {
    const friends = store.loadState().friends;
    const select = $('#saved-friends');
    select.hidden = friends.length === 0;
    select.replaceChildren(new Option('Amigos guardados…', ''));
    for (const f of friends) select.append(new Option(f.name, f.code));
  }
  refreshFriends();

  $('#saved-friends').addEventListener('change', ev => {
    if (!ev.target.value) return;
    $('#their-code').value = ev.target.value;
    $('#friend-name').value = ev.target.selectedOptions[0].textContent;
    compare();
  });

  $('#save-friend').addEventListener('click', () => {
    const name = $('#friend-name').value.trim();
    const code = $('#their-code').value.trim();
    if (!name || !code) return toast('Necesito el nombre y el codigo del amigo.', true);
    store.saveFriend(name, code);
    refreshFriends();
    toast(`${name} guardado`);
  });

  // ---------- Comparacion ----------
  let lastResult = null;

  function compare() {
    let decoded;
    try {
      decoded = decodeCollection(catalog, $('#their-code').value);
    } catch (err) {
      toast(err.message, true);
      return;
    }
    if (decoded.newerCatalog) {
      toast('Ojo: ese codigo viene de un catalogo mas nuevo. Las entradas nuevas no se compararan.', true);
    }

    const groups = { mine: [], theirs: [], both: [], none: [] };
    for (const entry of catalog.flat) {
      if (!entry.released) continue;
      const mine = store.getStatus(entry.key) >= OWNED;
      const theirs = (decoded.statuses.get(entry.key) ?? 0) >= OWNED;
      groups[mine && theirs ? 'both' : mine ? 'mine' : theirs ? 'theirs' : 'none'].push(entry);
    }

    lastResult = groups;
    renderResult(groups);
  }

  function renderResult(groups) {
    $('#placeholder').hidden = true;
    $('#result').hidden = false;

    const friend = $('#friend-name').value.trim() || 'Tu amigo';
    const total = catalog.totalReleased;
    const myCount = groups.mine.length + groups.both.length;
    const theirCount = groups.theirs.length + groups.both.length;
    const diff = myCount - theirCount;

    $('#summary').replaceChildren(
      el('div', { className: 'stat' }, [
        el('div', { className: 'stat-label', textContent: 'Tu coleccion' }),
        fraction(myCount, total),
        el('div', { className: 'bar' }, [el('i', { style: `width:${pct(myCount, total)}%` })]),
      ]),
      el('div', { className: 'stat' }, [
        el('div', { className: 'stat-label', textContent: friend }),
        fraction(theirCount, total),
        el('div', { className: 'bar' }, [el('i', { style: `width:${pct(theirCount, total)}%; background:var(--warn)` })]),
      ]),
      el('div', { className: 'stat' }, [
        el('div', { className: 'stat-label', textContent: 'Diferencia' }),
        el('div', { className: 'stat-value', textContent: diff === 0 ? 'Empate' : `${diff > 0 ? '+' : ''}${diff}` }),
        el('div', {
          className: 'stat-sub',
          textContent: diff === 0 ? 'Van iguales' : diff > 0 ? 'Vas ganando' : 'Vas abajo',
        }),
      ]),
      el('div', { className: 'stat' }, [
        el('div', { className: 'stat-label', textContent: 'Entre los dos' }),
        fraction(total - groups.none.length, total),
        el('div', { className: 'stat-sub', textContent: `Les faltan ${groups.none.length} a ambos` }),
      ]),
    );

    $('#buckets').replaceChildren(...BUCKETS.map(b => {
      const list = groups[b.id];
      return el('section', { className: `bucket bucket-${b.id}` }, [
        el('h3', {}, [
          el('span', { textContent: b.title }),
          el('span', { className: 'count', textContent: String(list.length) }),
        ]),
        b.hint ? el('div', { style: 'font-size:.77rem;color:var(--text-mute)', textContent: b.hint }) : null,
        list.length
          ? el('ul', {}, list.map(e => el('li', {}, [
              thumb(e),
              el('span', { textContent: e.sprite.name.replace(' Sprite', '') }),
              el('span', { className: 'v', textContent: e.variant.name, style: `color:${e.variant.color}` }),
            ])))
          : el('div', { className: 'empty', textContent: 'Nada por aqui.' }),
      ]);
    }));
  }

  $('#do-compare').addEventListener('click', compare);
  $('#their-code').addEventListener('keydown', ev => { if (ev.key === 'Enter') compare(); });

  $('#copy-code').addEventListener('click', () => copy($('#my-code').value, 'Codigo copiado'));
  $('#copy-link').addEventListener('click', () => copy(buildShareUrl($('#my-code').value), 'Link copiado'));

  $('#copy-text').addEventListener('click', () => {
    if (!lastResult) return;
    const friend = $('#friend-name').value.trim() || 'Tu amigo';
    const line = e => `${e.sprite.name.replace(' Sprite', '')} (${e.variant.name})`;
    const section = (title, list) =>
      `**${title}** — ${list.length}\n${list.length ? list.map(e => `· ${line(e)}`).join('\n') : '· nada'}`;

    copy([
      `Comparacion de Sprites - yo vs. ${friend}`,
      section('Solo yo lo tengo', lastResult.mine),
      section(`Solo ${friend} lo tiene`, lastResult.theirs),
      section('Nos faltan a los dos', lastResult.none),
    ].join('\n\n'), 'Comparacion copiada, pegala en Discord');
  });

  // Si llegaron por un link compartido, compara solo.
  const incoming = codeFromLocation();
  if (incoming) {
    $('#their-code').value = incoming;
    compare();
  }
}

main();
