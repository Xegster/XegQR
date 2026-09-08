import QRCode from 'qrcode';

/**
 * qrEncode — the low-level encoding facts the UI needs *before* it renders.
 *
 * react-native-qrcode-styled draws a symbol but tells you nothing about it up
 * front, and two things have to be known ahead of the render:
 *
 *  1. the module count, because every radius in qrStyleOptions is a fraction of
 *     a module and the frame's viewBox has to be sized to the symbol; and
 *  2. whether the payload even fits, because an over-long string makes the
 *     renderer throw during render — which in React Native means a red screen
 *     rather than a catchable error.
 *
 * Both come from `qrcode` (soldair), the same encoder the renderer uses
 * internally, so the numbers here always agree with what gets drawn.
 */

/** Per-version module count is 4*version + 17; version 40 is the largest symbol. */
export const MAX_QR_VERSION = 40;

/**
 * Analyse a payload. Never throws — an over-capacity payload comes back as
 * `{ ok: false, error }` so the caller can render a message instead of dying.
 */
export function analyze(data, errorCorrectionLevel = 'M') {
  const text = String(data ?? '');
  if (!text) {
    return { ok: false, empty: true, moduleCount: 25, version: null, error: null };
  }
  try {
    const qr = QRCode.create(text, { errorCorrectionLevel });
    return {
      ok: true,
      empty: false,
      moduleCount: qr.modules.size,
      version: qr.version,
      errorCorrectionLevel,
      byteLength: byteLength(text),
      error: null,
    };
  } catch (e) {
    return {
      ok: false,
      empty: false,
      moduleCount: 25,
      version: null,
      byteLength: byteLength(text),
      error: friendlyEncodeError(e, text, errorCorrectionLevel),
    };
  }
}

/** Module count only, with a safe fallback so callers can size layout eagerly. */
export function getModuleCount(data, errorCorrectionLevel = 'M') {
  return analyze(data, errorCorrectionLevel).moduleCount;
}

/**
 * Turn the encoder's terse messages into something a user can act on. The
 * capacity failure is by far the most common and its stock text ("The amount of
 * data is too big") does not say what to do about it.
 */
function friendlyEncodeError(e, text, ecc) {
  const message = String(e?.message ?? e);
  if (/too big|code length overflow|data is too big/i.test(message)) {
    const suggestion =
      ecc === 'L'
        ? 'Shorten the content.'
        : 'Shorten the content, or drop the error correction level.';
    return `That is ${byteLength(text)} bytes — too much for one QR code. ${suggestion}`;
  }
  return message;
}

export function byteLength(text) {
  // TextEncoder exists in Hermes and on web; the reduce is a defensive fallback.
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(String(text ?? '')).length;
  }
  return unescape(encodeURIComponent(String(text ?? ''))).length;
}

/**
 * Plain SVG markup for the symbol, used by the web export path where the
 * rendered <Svg> element cannot be serialised to a PNG directly.
 * Style is limited to colours here — the styled renderer owns the fancy shapes.
 */
export async function toSvgString(data, { errorCorrectionLevel = 'M', color = '#000000', backgroundColor = '#ffffff', margin = 2 } = {}) {
  return QRCode.toString(String(data ?? ''), {
    type: 'svg',
    errorCorrectionLevel,
    margin,
    color: { dark: color, light: backgroundColor },
  });
}

/** A PNG data URI from the plain encoder — the universal fallback for export. */
export async function toPngDataUrl(data, { errorCorrectionLevel = 'M', color = '#000000', backgroundColor = '#ffffff', margin = 2, width = 512 } = {}) {
  return QRCode.toDataURL(String(data ?? ''), {
    errorCorrectionLevel,
    margin,
    width,
    color: { dark: color, light: backgroundColor },
  });
}
