import { isWeb } from '../utils/platform';
import * as Clipboard from 'expo-clipboard';

/**
 * qrExport — turning the rendered code into something the user can keep.
 *
 * The two platforms need genuinely different mechanics, not just different
 * file paths:
 *
 *  native — react-native-svg's element exposes `toDataURL`, which rasterises
 *           the SVG natively. The result is written to the cache directory,
 *           then either saved straight to the device's gallery via
 *           expo-media-library ("Save"), or handed to the share sheet via
 *           expo-sharing ("Share") — two distinct actions, since Android's
 *           share sheet does not reliably offer "save to gallery" itself.
 *
 *  web    — that method does not exist on the web build, so the <svg> node is
 *           serialised, rasterised through a canvas at a chosen scale, and
 *           saved with a download link. The node is found by DOM id rather than
 *           through the ref, since react-native-svg's web ref does not reliably
 *           expose the underlying element. A browser download already is the
 *           "save locally" action, so there is no separate share path.
 *
 * SVG export is web-only for the same reason: there is no way to get the
 * rendered markup back out of the native renderer. Callers should check
 * `canExportSvg` before offering it rather than failing at press time.
 */

export const canExportSvg = isWeb;

function timestampName(base = 'qr-code') {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${base}-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// --- Web helpers -----------------------------------------------------------

function findSvgNode(domId) {
  if (typeof document === 'undefined') return null;
  const host = document.getElementById(domId);
  return host ? host.querySelector('svg') : null;
}

function serializeSvg(node) {
  const clone = node.cloneNode(true);
  if (!clone.getAttribute('xmlns')) {
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }
  return new XMLSerializer().serializeToString(clone);
}

function rasterizeSvg(markup, width, height, scale) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        reject(e);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not rasterise the code'));
    };
    img.src = url;
  });
}

function downloadDataUrl(dataUrl, fileName) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- Public API ------------------------------------------------------------

/** Writes the rendered code to a temp PNG file in the cache dir. Native only. */
async function writeNativePngToCache(svgRef, fileName) {
  const base64 = await nativeToDataUrl(svgRef);
  if (!base64) return null;

  const { File, Paths } = require('expo-file-system');
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(base64, { encoding: 'base64' });
  return file;
}

/**
 * Save the code as a PNG. On web this downloads to the browser's default
 * download location. On native it saves directly to the device's photo
 * gallery — no share sheet involved. Returns `{ ok, error }`.
 */
export async function exportPng({ svgRef, domId, name, scale = 3 }) {
  const fileName = `${timestampName(name)}.png`;

  try {
    if (isWeb) {
      const node = findSvgNode(domId);
      if (!node) return { ok: false, error: 'Could not find the code to export.' };

      const box = node.viewBox?.baseVal;
      const width = box?.width || node.width?.baseVal?.value || 512;
      const height = box?.height || node.height?.baseVal?.value || 512;

      const dataUrl = await rasterizeSvg(serializeSvg(node), width, height, scale);
      downloadDataUrl(dataUrl, fileName);
      return { ok: true, error: null };
    }

    const file = await writeNativePngToCache(svgRef, fileName);
    if (!file) return { ok: false, error: 'Could not render the code to an image.' };

    const MediaLibrary = require('expo-media-library');
    const permission = await MediaLibrary.requestPermissionsAsync();
    if (!permission.granted) {
      return { ok: false, error: 'Photo library access is needed to save the code.' };
    }
    await MediaLibrary.saveToLibraryAsync(file.uri);
    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: e?.message ?? 'Export failed.' };
  }
}

/**
 * Share the code as a PNG via the platform share sheet. Native only — on web
 * a direct download already covers the "get this file" need, so callers
 * should not offer this action there.
 */
export async function sharePng({ svgRef, name, scale = 3 }) {
  if (isWeb) {
    return { ok: false, error: 'Sharing is only available on the mobile app.' };
  }

  const fileName = `${timestampName(name)}.png`;

  try {
    const file = await writeNativePngToCache(svgRef, fileName);
    if (!file) return { ok: false, error: 'Could not render the code to an image.' };

    const Sharing = require('expo-sharing');
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your QR code',
        UTI: 'public.png',
      });
      return { ok: true, error: null };
    }
    return { ok: false, error: 'Sharing is not available on this device.' };
  } catch (e) {
    return { ok: false, error: e?.message ?? 'Share failed.' };
  }
}

/** Save the code as an SVG file. Web only — see the note at the top. */
export async function exportSvg({ domId, name }) {
  if (!canExportSvg) {
    return { ok: false, error: 'SVG export is only available on the web version.' };
  }
  try {
    const node = findSvgNode(domId);
    if (!node) return { ok: false, error: 'Could not find the code to export.' };

    const markup = serializeSvg(node);
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
    downloadDataUrl(dataUrl, `${timestampName(name)}.svg`);
    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: e?.message ?? 'Export failed.' };
  }
}

function nativeToDataUrl(svgRef) {
  return new Promise((resolve) => {
    const node = svgRef?.current;
    if (!node?.toDataURL) {
      resolve(null);
      return;
    }
    // react-native-svg hands back bare base64, no data: prefix. Its native
    // toDataURL only understands { width, height } in the options object —
    // any other shape (e.g. a `quality` key) makes the Android side crash
    // the app outright (it does an unchecked options.getInt("width")), so
    // omit options entirely and let it use the SVG's own bounding box.
    node.toDataURL((base64) => resolve(base64));
  });
}

export async function copyToClipboard(text) {
  try {
    await Clipboard.setStringAsync(String(text ?? ''));
    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: e?.message ?? 'Could not copy.' };
  }
}

/** Copy the rendered code to the clipboard as an image. Returns `{ ok, error }`. */
export async function copyImage({ svgRef, domId, scale = 3 }) {
  try {
    let base64;

    if (isWeb) {
      const node = findSvgNode(domId);
      if (!node) return { ok: false, error: 'Could not find the code to copy.' };

      const box = node.viewBox?.baseVal;
      const width = box?.width || node.width?.baseVal?.value || 512;
      const height = box?.height || node.height?.baseVal?.value || 512;

      const dataUrl = await rasterizeSvg(serializeSvg(node), width, height, scale);
      base64 = dataUrl.split(',')[1];
    } else {
      base64 = await nativeToDataUrl(svgRef);
      if (!base64) return { ok: false, error: 'Could not render the code to an image.' };
    }

    await Clipboard.setImageAsync(base64);
    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: e?.message ?? 'Could not copy.' };
  }
}
