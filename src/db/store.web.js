/**
 * store.web — IndexedDB-backed local storage for the website build.
 *
 * The twin of store.native.js; same exports, same shapes, so nothing above this
 * layer knows which one it is talking to.
 *
 * IndexedDB rather than expo-sqlite's web build: SQLite on web needs
 * SharedArrayBuffer, which needs COOP/COEP response headers, which a plain
 * static host will not always let you set. IndexedDB needs nothing, has a quota
 * measured in hundreds of MB, and is available in every target browser.
 *
 * localStorage is not an option here either — cached logos are data URIs and
 * would blow through its ~5 MB ceiling with a handful of images.
 */

const DB_NAME = 'xegqr';
const DB_VERSION = 1;
const CODES = 'saved_codes';
const IMAGES = 'cached_images';

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable in this browser'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (event.oldVersion < 1) {
        const codes = db.createObjectStore(CODES, { keyPath: 'id' });
        codes.createIndex('updatedOn', 'updatedOn');
        const images = db.createObjectStore(IMAGES, { keyPath: 'id' });
        images.createIndex('lastUsedOn', 'lastUsedOn');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

function tx(db, storeName, mode) {
  return db.transaction(storeName, mode).objectStore(storeName);
}

function promisify(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function initStorage() {
  await openDb();
}

// --- Saved codes -----------------------------------------------------------

export async function allCodes() {
  const db = await openDb();
  const rows = await promisify(tx(db, CODES, 'readonly').getAll());
  return rows.sort((a, b) => (b.updatedOn ?? 0) - (a.updatedOn ?? 0));
}

export async function getCode(id) {
  const db = await openDb();
  return (await promisify(tx(db, CODES, 'readonly').get(id))) ?? null;
}

export async function putCode(code) {
  const db = await openDb();
  await promisify(tx(db, CODES, 'readwrite').put(code));
  return code;
}

export async function deleteCode(id) {
  const db = await openDb();
  await promisify(tx(db, CODES, 'readwrite').delete(id));
}

// --- Cached images ---------------------------------------------------------

export async function putImage(image) {
  const db = await openDb();
  await promisify(tx(db, IMAGES, 'readwrite').put(image));
  return image;
}

export async function getImage(id) {
  const db = await openDb();
  return (await promisify(tx(db, IMAGES, 'readonly').get(id))) ?? null;
}

export async function allImages() {
  const db = await openDb();
  const rows = await promisify(tx(db, IMAGES, 'readonly').getAll());
  return rows.sort((a, b) => (b.lastUsedOn ?? 0) - (a.lastUsedOn ?? 0));
}

/** Metadata only — strips the data URIs so a gallery listing stays cheap. */
export async function allImageMeta() {
  const rows = await allImages();
  return rows.map(({ dataUri, ...meta }) => meta);
}

export async function touchImage(id, when) {
  const db = await openDb();
  const store = tx(db, IMAGES, 'readwrite');
  const existing = await promisify(store.get(id));
  if (existing) await promisify(store.put({ ...existing, lastUsedOn: when }));
}

export async function deleteImage(id) {
  const db = await openDb();
  await promisify(tx(db, IMAGES, 'readwrite').delete(id));
}

export async function totalImageBytes() {
  const rows = await allImageMeta();
  return rows.reduce((sum, r) => sum + (r.bytes ?? 0), 0);
}

export async function clearAll() {
  const db = await openDb();
  await promisify(tx(db, CODES, 'readwrite').clear());
  await promisify(tx(db, IMAGES, 'readwrite').clear());
}
