// Bootstrap de la vista principal: conecta catalogo, estado, filtros y DOM.

import { loadCatalog } from './catalog.js';
import * as store from './store.js';
import { defaultFilters } from './filters.js';
import { renderStats, renderGroups, renderHunt, renderHistory, toast } from './render.js';
import { encodeCollection, buildShareUrl } from './share.js';

const $ = sel => document.querySelector(sel);

async function copy(text, okMessage) {
  try {
    await navigator.clipboard.writeText(text);
    toast(okMessage);
  } catch {
    toast('El navegador bloqueo el portapapeles. Copialo a mano del recuadro.', true);
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

  const filters = { ...defaultFilters(), ...store.loadState().prefs };

  // --- Poblar los selects desde el catalogo, no a mano en el HTML ---
  for (const r of catalog.rarityList) {
    $('#f-rarity').append(new Option(r.name, r.id));
  }
  for (const v of catalog.variantList) {
    $('#f-variant').append(new Option(v.name, v.id));
  }
  for (const s of catalog.seasonList) {
    $('#f-season').append(new Option(`${s.name} (C${s.chapter}S${s.season})`, s.id));
  }
  $('#f-group').value = filters.groupBy;
  $('#f-sort').value = filters.sortBy;

  const pendientes = catalog.totalAll - catalog.totalReleased;
  $('#catalog-info').textContent =
    `Catalogo v${catalog.catalogVersion}: ${catalog.sprites.length} sprites y ` +
    `${catalog.totalReleased} variantes lanzadas` +
    (pendientes ? ` (+${pendientes} anunciadas que aun no salen).` : '.');

  // --- Pintado ---
  const handlers = {
    onCycle: key => { store.cycleStatus(key); },
    onHunt: key => {
      store.toggleHunt(key);
      toast(store.isHunted(key) ? 'Agregado a tu lista de busqueda' : 'Quitado de tu lista de busqueda');
    },
  };

  function renderAll() {
    renderStats(catalog, $('#stats'));
    renderGroups(catalog, filters, $('#groups'), handlers);
    renderHunt(catalog, $('#hunt'), handlers);
    renderHistory(catalog, $('#historial'));
    $('#my-code').value = encodeCollection(catalog, store.getStatus);
  }

  store.onChange(renderAll);
  renderAll();

  // --- Filtros ---
  const bind = (sel, prop, persistAs) => {
    $(sel).addEventListener('input', ev => {
      filters[prop] = ev.target.value;
      if (persistAs) store.setPref(persistAs, ev.target.value); // setPref ya repinta
      else renderGroups(catalog, filters, $('#groups'), handlers);
    });
  };
  bind('#search', 'search');
  bind('#f-rarity', 'rarity');
  bind('#f-variant', 'variant');
  bind('#f-season', 'season');
  bind('#f-status', 'status');
  bind('#f-group', 'groupBy', 'groupBy');
  bind('#f-sort', 'sortBy', 'sortBy');

  // --- Pestanas ---
  document.querySelectorAll('.nav a[data-tab]').forEach(link => {
    link.addEventListener('click', ev => {
      ev.preventDefault();
      document.querySelectorAll('.nav a[data-tab]').forEach(a => a.classList.toggle('active', a === link));
      document.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== link.dataset.tab; });
    });
  });

  // --- Compartir ---
  $('#copy-code').addEventListener('click', () => copy($('#my-code').value, 'Codigo copiado'));
  $('#copy-link').addEventListener('click', () => copy(buildShareUrl($('#my-code').value), 'Link copiado, ya puedes mandarlo'));

  // --- Respaldo ---
  $('#export').addEventListener('click', () => { store.exportJSON(); toast('Respaldo descargado'); });
  $('#import-btn').addEventListener('click', () => $('#import').click());
  $('#import').addEventListener('change', async ev => {
    const file = ev.target.files[0];
    if (!file) return;
    if (!confirm('Importar reemplaza por completo lo que tengas guardado ahora. ¿Continuar?')) {
      ev.target.value = '';
      return;
    }
    try {
      // Solo se aceptan claves que existan en el catalogo actual.
      const validKeys = new Set(catalog.byKey.keys());
      const { importadas, descartadas } = await store.importJSON(file, validKeys);
      toast(descartadas
        ? `Importadas ${importadas} variantes (${descartadas} entradas invalidas se descartaron)`
        : `Respaldo importado: ${importadas} variantes`);
    } catch (err) {
      toast(`No se pudo importar: ${err.message}`, true);
    }
    ev.target.value = '';
  });

  $('#reset').addEventListener('click', () => {
    if (confirm('Esto borra toda tu coleccion de este navegador y no se puede deshacer. ¿Seguro?')) {
      store.resetAll();
      toast('Coleccion borrada');
    }
  });
}

main();
