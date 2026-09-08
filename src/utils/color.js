// Small hex color helpers used to derive tints/shades from the theme tokens
// (ThemeProvider) instead of hardcoding literal color values in screens.
// Ported from the NetXeg/PoGoManager convention so the three apps share one
// color vocabulary.

export function hexToRgb(hex) {
  const clean = String(hex).replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function hexToRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// percent > 0 blends toward white (lighten), percent < 0 blends toward black (darken).
export function shadeColor(hex, percent) {
  const { r, g, b } = hexToRgb(hex);
  const target = percent < 0 ? 0 : 255;
  const p = Math.min(Math.abs(percent), 100) / 100;
  const blend = (c) => Math.round((target - c) * p + c);
  const toHex = (c) => c.toString(16).padStart(2, '0');
  return `#${toHex(blend(r))}${toHex(blend(g))}${toHex(blend(b))}`;
}

// Relative luminance (WCAG). Used to pick readable foreground text over an
// arbitrary user-chosen QR color, and to warn when a QR code's own contrast
// is too low for scanners to read reliably.
export function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const channel = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

// WCAG contrast ratio between two hex colors, 1 (identical) to 21 (black/white).
export function contrastRatio(hexA, hexB) {
  const a = luminance(hexA);
  const b = luminance(hexB);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

export function readableTextOn(hex) {
  return luminance(hex) > 0.5 ? '#121212' : '#ffffff';
}

// A valid 3- or 6-digit hex color, with or without the leading '#'.
export function isValidHex(value) {
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(value).trim());
}

export function normalizeHex(value) {
  const clean = String(value).trim().replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  return `#${full.toLowerCase()}`;
}
