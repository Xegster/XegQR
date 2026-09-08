import * as ImagePicker from 'expo-image-picker';
import * as store from '../db/store';
import generateId from '../utils/generateId';

/**
 * imageCache — picking logo images, and deciding which of them are worth
 * keeping on the device.
 *
 * The size rule is deliberate and worth stating plainly, because it is the
 * opposite of what most apps do: an over-limit image is still fully usable for
 * generating a code right now. Only *caching* it is skipped. Blocking the
 * picker would punish someone for a one-off 8 MB photo they were never going to
 * reuse; declining to cache it costs them nothing today and keeps the store
 * from filling with images nobody wants back.
 *
 * Everything is local. Nothing here uploads, and cached images do not survive a
 * reinstall — that is an accepted trade, not an oversight.
 */

export const DEFAULT_CACHE_LIMIT_BYTES = 2 * 1024 * 1024; // 2 MB per image
export const DEFAULT_TOTAL_CACHE_BYTES = 50 * 1024 * 1024; // 50 MB across all images

/** Bytes of raw data behind a base64 payload, without decoding it. */
export function base64Bytes(base64) {
  const clean = String(base64 ?? '').replace(/^data:[^,]*,/, '');
  if (!clean) return 0;
  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  return Math.floor((clean.length * 3) / 4) - padding;
}

export function formatBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Open the system image picker.
 * Returns null when the user cancels or denies permission; otherwise an asset
 * with a `dataUri` usable directly as an SVG image href on both platforms.
 */
export async function pickImage() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { error: 'Permission to access photos was denied.' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
    base64: true,
    exif: false,
  });

  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  const mimeType = asset.mimeType || 'image/png';
  // Native gives back a file:// uri plus base64; web gives a data uri already.
  const dataUri = asset.base64
    ? `data:${mimeType};base64,${asset.base64}`
    : asset.uri;

  return {
    dataUri,
    mimeType,
    name: asset.fileName || 'image',
    width: asset.width ?? null,
    height: asset.height ?? null,
    bytes: asset.fileSize ?? base64Bytes(asset.base64 ?? dataUri),
  };
}

/**
 * Cache a picked image, unless it is too big.
 *
 * Always resolves — an over-limit image is a normal outcome, not a failure, and
 * the caller shows the reason rather than an error.
 * Returns `{ cached, id, reason }`.
 */
export async function cacheImage(asset, options = {}) {
  const perImageLimit = options.perImageLimit ?? DEFAULT_CACHE_LIMIT_BYTES;
  const totalLimit = options.totalLimit ?? DEFAULT_TOTAL_CACHE_BYTES;

  if (!asset?.dataUri) {
    return { cached: false, id: null, reason: 'Nothing to cache.' };
  }

  if (asset.bytes > perImageLimit) {
    return {
      cached: false,
      id: null,
      reason: `Too large to save (${formatBytes(asset.bytes)}, limit ${formatBytes(perImageLimit)}). You can still use it in this code.`,
    };
  }

  const used = await store.totalImageBytes();
  if (used + asset.bytes > totalLimit) {
    // Evict least-recently-used entries until the new image fits, rather than
    // refusing it — the newest pick is the one the user is actively working on.
    const freed = await evictUntilFits(asset.bytes, totalLimit, used);
    if (!freed) {
      return {
        cached: false,
        id: null,
        reason: `Cache is full (${formatBytes(totalLimit)}). Remove some saved images to make room.`,
      };
    }
  }

  const now = Date.now();
  const record = {
    id: generateId('img'),
    name: asset.name ?? 'image',
    mimeType: asset.mimeType ?? 'image/png',
    dataUri: asset.dataUri,
    bytes: asset.bytes,
    width: asset.width ?? null,
    height: asset.height ?? null,
    createdOn: now,
    lastUsedOn: now,
  };

  await store.putImage(record);
  return { cached: true, id: record.id, reason: null };
}

async function evictUntilFits(incomingBytes, totalLimit, currentUsed) {
  const meta = await store.allImageMeta(); // newest use first
  let used = currentUsed;
  // Walk from the least recently used end.
  for (let i = meta.length - 1; i >= 0 && used + incomingBytes > totalLimit; i -= 1) {
    await store.deleteImage(meta[i].id);
    used -= meta[i].bytes ?? 0;
  }
  return used + incomingBytes <= totalLimit;
}

export async function listCachedImages() {
  return store.allImages();
}

export async function getCachedImage(id) {
  const image = await store.getImage(id);
  if (image) await store.touchImage(id, Date.now());
  return image;
}

export async function removeCachedImage(id) {
  await store.deleteImage(id);
}

export async function cacheUsage() {
  const [meta, bytes] = await Promise.all([store.allImageMeta(), store.totalImageBytes()]);
  return { count: meta.length, bytes };
}
