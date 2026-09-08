import * as SQLite from 'expo-sqlite';

/**
 * store.native — SQLite-backed local storage for Android/iOS.
 *
 * Pairs with store.web.js (IndexedDB); Metro picks the right one per platform,
 * and both export the same interface so nothing above this layer branches on
 * Platform. The interface is deliberately small — records and blobs, no query
 * language — because that is the common denominator the two engines share.
 *
 * Schema changes go through SCHEMA_VERSION and the migration ladder in
 * `migrate`, the same PRAGMA user_version pattern NetXeg uses.
 *
 * Cached logo images live in this database as data URIs rather than as files on
 * disk. At the sizes involved (a couple of MB, capped) the simplicity of one
 * store with one delete path is worth more than the marginal efficiency of a
 * file-per-image, and it keeps parity with the web implementation.
 */

const DB_NAME = 'xegqr.db';
const SCHEMA_VERSION = 1;

let dbPromise = null;

async function migrate(db) {
  const row = await db.getFirstAsync('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current >= SCHEMA_VERSION) return;

  if (current < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS saved_codes (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        values_json TEXT NOT NULL,
        style_json TEXT NOT NULL,
        created_on INTEGER NOT NULL,
        updated_on INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS cached_images (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT,
        mime_type TEXT,
        data_uri TEXT NOT NULL,
        bytes INTEGER NOT NULL,
        width INTEGER,
        height INTEGER,
        created_on INTEGER NOT NULL,
        last_used_on INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_saved_codes_updated ON saved_codes(updated_on DESC);
      CREATE INDEX IF NOT EXISTS idx_cached_images_used ON cached_images(last_used_on DESC);
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync('PRAGMA journal_mode = WAL');
      await migrate(db);
      return db;
    })();
  }
  return dbPromise;
}

export async function initStorage() {
  await getDb();
}

// --- Saved codes -----------------------------------------------------------

function rowToCode(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    payload: row.payload,
    values: safeParse(row.values_json, {}),
    style: safeParse(row.style_json, {}),
    createdOn: row.created_on,
    updatedOn: row.updated_on,
  };
}

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

export async function allCodes() {
  const db = await getDb();
  const rows = await db.getAllAsync('SELECT * FROM saved_codes ORDER BY updated_on DESC');
  return rows.map(rowToCode);
}

export async function getCode(id) {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM saved_codes WHERE id = ?', [id]);
  return row ? rowToCode(row) : null;
}

export async function putCode(code) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO saved_codes (id, name, type, payload, values_json, style_json, created_on, updated_on)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       type = excluded.type,
       payload = excluded.payload,
       values_json = excluded.values_json,
       style_json = excluded.style_json,
       updated_on = excluded.updated_on`,
    [
      code.id,
      code.name,
      code.type,
      code.payload,
      JSON.stringify(code.values ?? {}),
      JSON.stringify(code.style ?? {}),
      code.createdOn,
      code.updatedOn,
    ]
  );
  return code;
}

export async function deleteCode(id) {
  const db = await getDb();
  await db.runAsync('DELETE FROM saved_codes WHERE id = ?', [id]);
}

// --- Cached images ---------------------------------------------------------

function rowToImage(row, withData) {
  const image = {
    id: row.id,
    name: row.name,
    mimeType: row.mime_type,
    bytes: row.bytes,
    width: row.width,
    height: row.height,
    createdOn: row.created_on,
    lastUsedOn: row.last_used_on,
  };
  if (withData) image.dataUri = row.data_uri;
  return image;
}

export async function putImage(image) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO cached_images (id, name, mime_type, data_uri, bytes, width, height, created_on, last_used_on)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET last_used_on = excluded.last_used_on`,
    [
      image.id,
      image.name ?? null,
      image.mimeType ?? null,
      image.dataUri,
      image.bytes,
      image.width ?? null,
      image.height ?? null,
      image.createdOn,
      image.lastUsedOn,
    ]
  );
  return image;
}

export async function getImage(id) {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT * FROM cached_images WHERE id = ?', [id]);
  return row ? rowToImage(row, true) : null;
}

/** Metadata for every cached image, newest use first. Excludes the data URIs. */
export async function allImageMeta() {
  const db = await getDb();
  const rows = await db.getAllAsync(
    'SELECT id, name, mime_type, bytes, width, height, created_on, last_used_on FROM cached_images ORDER BY last_used_on DESC'
  );
  return rows.map((r) => rowToImage(r, false));
}

export async function allImages() {
  const db = await getDb();
  const rows = await db.getAllAsync('SELECT * FROM cached_images ORDER BY last_used_on DESC');
  return rows.map((r) => rowToImage(r, true));
}

export async function touchImage(id, when) {
  const db = await getDb();
  await db.runAsync('UPDATE cached_images SET last_used_on = ? WHERE id = ?', [when, id]);
}

export async function deleteImage(id) {
  const db = await getDb();
  await db.runAsync('DELETE FROM cached_images WHERE id = ?', [id]);
}

export async function totalImageBytes() {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT COALESCE(SUM(bytes), 0) AS total FROM cached_images');
  return row?.total ?? 0;
}

export async function clearAll() {
  const db = await getDb();
  await db.execAsync('DELETE FROM saved_codes; DELETE FROM cached_images;');
}
