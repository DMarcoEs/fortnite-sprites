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

export async function importJSON(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed.entries !== 'object') {
    throw new Error('Ese archivo no parece un respaldo de Sprite Tracker.');
  }
  state = migrate(parsed);
  persist();
  return Object.keys(state.entries).length;
}

export function resetAll() {
  state = emptyState();
  persist();
}
