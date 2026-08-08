// Codigos para compartir: toda la coleccion en ~50 caracteres, sin servidor.
//
// Cada entrada ocupa 2 bits (0 = no la tengo, 1 = obtenida, 2 = masterizada),
// en el orden de catalog.codeIndex — NUNCA en el de catalog.flat.
//
// codeIndex sale de codeOrder[] del JSON, que es append-only. Por eso un codigo
// viejo (mas corto) sigue decodificando bien: los bytes que faltan valen 0, y las
// entradas que se agregaron despues simplemente salen como "no la tengo".

import { NONE, MASTERED } from './store.js';

function bytesToBase64Url(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '='));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/**
 * @param {object} catalog
 * @param {(key:string)=>number} getStatusFn
 * @returns {string} codigo con formato "<version>.<payload>"
 */
export function encodeCollection(catalog, getStatusFn) {
  const n = catalog.codeIndex.length;
  const bytes = new Uint8Array(Math.ceil((n * 2) / 8));

  catalog.codeIndex.forEach((entry, i) => {
    const status = Math.min(Math.max(getStatusFn(entry.key) | 0, NONE), MASTERED);
    const bit = i * 2;
    // bit siempre es par, asi que los 2 bits nunca cruzan un byte.
    bytes[bit >> 3] |= status << (bit & 7);
  });

  return `${catalog.catalogVersion}.${bytesToBase64Url(bytes)}`;
}

/**
 * Acepta un codigo suelto o una URL completa que lo contenga.
 * @returns {{ statuses: Map<string, number>, version: number, newerCatalog: boolean }}
 */
export function decodeCollection(catalog, input) {
  const raw = String(input ?? '').trim();
  if (!raw) throw new Error('No pegaste ningun codigo.');

  // Tolera que peguen el link entero: ".../compare.html#c=1.AbC123"
  const fromUrl = /[#&?]c=([^&\s]+)/.exec(raw);
  const code = decodeURIComponent(fromUrl ? fromUrl[1] : raw);

  const parts = /^(\d+)\.([A-Za-z0-9_-]*)$/.exec(code);
  if (!parts) {
    throw new Error('Ese codigo no tiene el formato correcto. Deberia verse asi: 1.AbC123...');
  }

  const version = Number(parts[1]);
  let bytes;
  try {
    bytes = base64UrlToBytes(parts[2]);
  } catch {
    throw new Error('El codigo esta incompleto o se copio mal. Pidele a tu amigo que lo mande de nuevo.');
  }

  const maxBytes = Math.ceil((catalog.codeIndex.length * 2) / 8);
  if (bytes.length > maxBytes) {
    throw new Error('Ese codigo es de un catalogo mas nuevo que el de esta pagina. Actualiza el sitio.');
  }

  const statuses = new Map();
  catalog.codeIndex.forEach((entry, i) => {
    const bit = i * 2;
    const byte = bytes[bit >> 3] ?? 0;
    const value = (byte >> (bit & 7)) & 0b11;
    statuses.set(entry.key, value > MASTERED ? NONE : value);
  });

  return { statuses, version, newerCatalog: version > catalog.catalogVersion };
}

/** URL absoluta lista para mandar por Discord. */
export function buildShareUrl(code) {
  const base = new URL('compare.html', location.href);
  base.hash = `c=${code}`;
  return base.toString();
}

/** Lee el codigo del amigo desde el hash actual, si viene uno. */
export function codeFromLocation() {
  const m = /[#&]c=([^&]+)/.exec(location.hash);
  return m ? decodeURIComponent(m[1]) : null;
}
