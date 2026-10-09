import { contrastRatio, isValidHex, normalizeHex, shadeColor } from '../utils/color';
import { getGradient } from '../theme/gradients';
import { getQrType } from '../utils/qrPayloads';
import { DEFAULT_STYLE } from '../utils/qrStyleOptions';

/**
 * tileStyle — how a home-screen tile looks, as plain data.
 *
 * A tile's style is a small serialisable object that lives in its widget
 * binding (see widgetBindings.js):
 *
 *   { label, customLabel, source, background, textColor, iconMode, radius }
 *
 *   background — { type: 'solid', colors: [hex] } or { type: 'gradient', colors: [hex, hex] }
 *   textColor  — a hex, or null for "pick whichever reads best on the background"
 *   source     — 'code', a gradients.js hue name, or 'custom' once edited by hand;
 *                only used to highlight the matching "Start from" chip
 *   iconMode   — 'qr' | 'type' | 'none'
 *
 * Everything here is pure so it can be unit tested and shared by the config
 * screen and the in-app setup route.
 */

/** Below this, text on the tile is hard to read; same threshold QrPreview warns at. */
export const MIN_TILE_CONTRAST = 3;

export const DEFAULT_RADIUS = 20;

const LIGHT_TEXT = '#ffffff';
const DARK_TEXT = '#121212';
const FALLBACK_BACKGROUND = '#4a4a5c';

export const ICON_MODES = ['qr', 'type', 'none'];

/** The colour stops that actually paint the tile, cleaned up. */
export function backgroundStops(background) {
  const colors = (background?.colors ?? []).filter((c) => isValidHex(c)).map(normalizeHex);
  if (!colors.length) return [FALLBACK_BACKGROUND];
  return background?.type === 'gradient' && colors.length >= 2 ? colors.slice(0, 2) : colors.slice(0, 1);
}

/**
 * The worst-case contrast of a colour against the background. For a gradient
 * that is the weaker of the two ends, since the label can sit over either.
 */
export function minContrast(hex, background) {
  if (!isValidHex(hex)) return 1;
  return Math.min(...backgroundStops(background).map((stop) => contrastRatio(normalizeHex(hex), stop)));
}

/** White or near-black, whichever survives the background better. */
export function autoTextColor(background) {
  return minContrast(LIGHT_TEXT, background) >= minContrast(DARK_TEXT, background) ? LIGHT_TEXT : DARK_TEXT;
}

export function resolveTextColor(tile) {
  return tile?.textColor && isValidHex(tile.textColor)
    ? normalizeHex(tile.textColor)
    : autoTextColor(tile?.background);
}

/**
 * A two-stop gradient from one of the app's bento hues. The light-theme ramp is
 * used whatever the app theme, because the launcher wallpaper behind the tile
 * has nothing to do with the app's theme, and every light stop is saturated
 * enough for a white label.
 */
export function paletteBackground(hue) {
  const ramp = getGradient(hue, false);
  return { type: 'gradient', colors: [ramp[1], ramp[3]] };
}

/** The code's own body colour or gradient, as a tile background. */
export function codeBackground(code) {
  const s = { ...DEFAULT_STYLE, ...(code?.style ?? {}) };
  const gradient = (s.gradientColors ?? []).filter((c) => isValidHex(c));
  if (s.useGradient && gradient.length >= 2) {
    return { type: 'gradient', colors: [normalizeHex(gradient[0]), normalizeHex(gradient[1])] };
  }
  return { type: 'solid', colors: [isValidHex(s.color) ? normalizeHex(s.color) : DEFAULT_STYLE.color] };
}

/**
 * "Match this code's colours": the code's body becomes the tile, and the code's
 * background becomes the label — a black-on-white code makes a black tile with
 * white text. If that pairing is too faint to read, the label goes automatic.
 *
 * This is a one-time copy; later edits to the code's style do not follow.
 */
export function matchCodeColours(code) {
  const background = codeBackground(code);
  const candidate = code?.style?.backgroundColor ?? DEFAULT_STYLE.backgroundColor;
  const readable = isValidHex(candidate) && minContrast(candidate, background) >= MIN_TILE_CONTRAST;
  return { background, textColor: readable ? normalizeHex(candidate) : null };
}

/** The colours for a "Start from" choice: 'code' or a hue name. */
export function coloursFromSource(source, code) {
  if (source === 'code') return matchCodeColours(code);
  return { background: paletteBackground(source), textColor: null };
}

/** Switch between a flat fill and a gradient, keeping the first colour. */
export function withFillType(background, type) {
  const stops = backgroundStops(background);
  if (type === 'gradient') {
    return { type: 'gradient', colors: [stops[0], stops[1] ?? shadeColor(stops[0], -35)] };
  }
  return { type: 'solid', colors: [stops[0]] };
}

export function iconNameFor(iconMode, codeType) {
  if (iconMode === 'none') return null;
  if (iconMode === 'type') return getQrType(codeType)?.icon ?? 'qr';
  return 'qr';
}

/** A fresh tile for a code: its name, its type's icon, its type's bento hue. */
export function defaultTile(code) {
  const hue = getQrType(code?.type)?.gradient ?? 'violet';
  return {
    label: code?.name ?? '',
    customLabel: false,
    source: hue,
    ...coloursFromSource(hue, code),
    iconMode: 'type',
    radius: DEFAULT_RADIUS,
  };
}

/**
 * Point an existing tile at another code. The label follows unless the user
 * typed their own, and "match this code's colours" re-copies from the new code.
 */
export function retargetTile(tile, code) {
  const next = { ...tile };
  if (!tile.customLabel) next.label = code?.name ?? '';
  if (tile.source === 'code') Object.assign(next, matchCodeColours(code));
  return next;
}
