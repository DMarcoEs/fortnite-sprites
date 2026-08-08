// Estado del usuario: localStorage + export/import JSON.
//
// Estados por entrada, en un ciclo de clic:
//   0 = no la tengo -> 1 = obtenida -> 2 = obtenida + masterizada -> 0

export const NONE = 0;
export const OWNED = 1;
export const MASTERED = 2;

const KEY = 'fnsprites.v1';
const SCHEMA_VERSION = 1;

function emptyState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    entries: {},   // "water:gold" -> { status, date, note }
    hunt: [],      // claves marcadas como objetivo
    friends: [],   // [{ name, code, savedAt }]
    prefs: { groupBy: 'sprite', sortBy: 'rarity' },
  };
}

let state = null;
const listeners = new Set();

/** Migra estados guardados con esquemas anteriores. */
function migrate(loaded) {
  const base = emptyState();
  if (!loaded || typeof loaded !== 'object') return base;
  // Solo existe el esquema 1; los futuros se encadenan aqui.
  return {
    ...base,
    ...loaded,
    schemaVersion: SCHEMA_VERSION,
    entries: loaded.entries ?? {},
    hunt: Array.isArray(loaded.hunt) ? loaded.hunt : [],
    friends: Array.isArray(loaded.friends) ? loaded.friends : [],
    prefs: { ...base.prefs, ...(loaded.prefs ?? {}) },
  };
}

export function loadState() {
  if (state) return state;
  try {
    state = migrate(JSON.parse(localStorage.getItem(KEY)));
  } catch {
    console.warn('El estado guardado estaba corrupto; se empieza de cero.');
    state = emptyState();
  }
  return state;
}

function persist() {
  localStorage.setItem(KEY, JSON.stringify(state));
  for (const fn of listeners) fn(state);
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// --- Consultas ---

export function getStatus(key) {
  return loadState().entries[key]?.status ?? NONE;
}

export function getEntry(key) {
  return loadState().entries[key] ?? null;
}

export function isHunted(key) {
  return loadState().hunt.includes(key);
}

// --- Mutaciones ---

export function setStatus(key, status) {
  const s = loadState();
  if (status === NONE) {
    delete s.entries[key];
  } else {
    const prev = s.entries[key];
    s.entries[key] = {
      status,
      // La fecha se fija la primera vez que se obtiene y ya no se pisa.
      date: prev?.date ?? new Date().toISOString().slice(0, 10),
      note: prev?.note ?? '',
    };
    // Conseguirla la saca automaticamente de la lista de busqueda.
    s.hunt = s.hunt.filter(k => k !== key);
  }
  persist();
}

export function cycleStatus(key) {
  const next = (getStatus(key) + 1) % 3;
  setStatus(key, next);
  return next;
}

export function setDate(key, date) {
  const s = loadState();
  if (s.entries[key]) { s.entries[key].date = date; persist(); }
}

export function setNote(key, note) {
  const s = loadState();
  if (s.entries[key]) { s.entries[key].note = note; persist(); }
}

export function toggleHunt(key) {
  const s = loadState();
  s.hunt = s.hunt.includes(key) ? s.hunt.filter(k => k !== key) : [...s.hunt, key];
  persist();
}

export function setPref(name, value) {
  loadState().prefs[name] = value;
  persist();
}

// --- Amigos guardados ---

export function saveFriend(name, code) {
  const s = loadState();
  const i = s.friends.findIndex(f => f.name.toLowerCase() === name.toLowerCase());
  const friend = { name, code, savedAt: new Date().toISOString() };
  if (i >= 0) s.friends[i] = friend; else s.friends.push(friend);
  persist();
}

export function removeFriend(name) {
  const s = loadState();
  s.friends = s.friends.filter(f => f.name !== name);
  persist();
}

// --- Respaldo completo ---

export function exportJSON() {
  const blob = new Blob([JSON.stringify(loadState(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fnsprites-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Un respaldo legitimo pesa unos pocos KB; 1 MB es un techo mas que generoso. */
const MAX_IMPORT_BYTES = 1024 * 1024;

/**
 * Importa un respaldo. Sanea todo lo que entra: un archivo manipulado no debe
 * poder dejar el estado inconsistente ni meter claves que no existan.
 * @param {File} file
 * @param {Set<string>} validKeys claves del catalogo actual; lo que no este aqui se descarta
 */
export async function importJSON(file, validKeys = null) {
  if (file.size > MAX_IMPORT_BYTES) {
    throw new Error(`El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. Un respaldo real no llega a 1 MB.`);
  }

  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error('El archivo no es JSON valido.');
  }
  if (!parsed || typeof parsed !== 'object' || typeof parsed.entries !== 'object' || parsed.entries === null) {
    throw new Error('Ese archivo no parece un respaldo de Sprite Tracker.');
  }

  const clean = emptyState();
  let descartadas = 0;

  for (const [key, value] of Object.entries(parsed.entries)) {
    if (validKeys && !validKeys.has(key)) { descartadas++; continue; }
    if (!value || typeof value !== 'object') { descartadas++; continue; }

    const status = Number(value.status);
    if (!Number.isInteger(status) || status < OWNED || status > MASTERED) { descartadas++; continue; }

    clean.entries[key] = {
      status,
      date: typeof value.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.date) ? value.date : '',
      note: typeof value.note === 'string' ? value.note.slice(0, 500) : '',
    };
  }

  if (Array.isArray(parsed.hunt)) {
    clean.hunt = parsed.hunt
      .filter(k => typeof k === 'string' && (!validKeys || validKeys.has(k)))
      .slice(0, 200);
  }
  if (Array.isArray(parsed.friends)) {
    clean.friends = parsed.friends
      .filter(f => f && typeof f.name === 'string' && typeof f.code === 'string')
      .map(f => ({ name: f.name.slice(0, 40), code: f.code.slice(0, 400), savedAt: f.savedAt ?? '' }))
      .slice(0, 50);
  }
  if (parsed.prefs && typeof parsed.prefs === 'object') {
    clean.prefs = { ...clean.prefs, ...parsed.prefs };
  }

  state = clean;
  persist();
  return { importadas: Object.keys(clean.entries).length, descartadas };
}

export function resetAll() {
  state = emptyState();
  persist();
}
