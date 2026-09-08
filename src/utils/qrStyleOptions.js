/**
 * qrStyleOptions — the visual customisation vocabulary, and the translation
 * layer between the app's flat style state and react-native-qrcode-styled props.
 *
 * The app stores style as a flat, serialisable object (so it can go straight
 * into SQLite alongside a saved code and be restored later). The renderer wants
 * a nested prop tree with absolute SVG units. `resolveQrProps` does that
 * conversion, and is the only place that knows the renderer's prop names — if
 * the QR library is ever swapped, this function is the seam.
 *
 * Radii are stored as *fractions* rather than pixels so a style survives a
 * change of `pieceSize`: 0.5 means "fully round at whatever size this renders".
 */

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

/**
 * Body/module shapes. `radius` is a fraction of pieceSize; an array maps to the
 * four corners starting top-left, which is how the asymmetric "classy" looks
 * are built.
 */
export const DOT_STYLES = [
  { id: 'square', label: 'Square', radius: 0 },
  { id: 'rounded', label: 'Rounded', radius: 0.35 },
  { id: 'extra-rounded', label: 'Extra rounded', radius: 0.5, glued: true },
  { id: 'dots', label: 'Dots', radius: 0.5 },
  { id: 'classy', label: 'Classy', radius: [0.5, 0, 0.5, 0] },
  { id: 'classy-rounded', label: 'Classy rounded', radius: [0.5, 0.2, 0.5, 0.2] },
  { id: 'liquid', label: 'Liquid', radius: 0.5, glued: true, liquid: 0.6 },
  { id: 'cut', label: 'Cut corner', radius: 0.45, cornerType: 'cut' },
  { id: 'diamond', label: 'Diamond', radius: 0, rotation: 45, scale: 0.8 },
];

/**
 * Eye shapes. `radius` is a fraction of the eye's own width (7 pieces for the
 * outer frame, 3 for the inner ball), so 0.5 reads as a circle in both.
 */
export const EYE_STYLES = [
  { id: 'square', label: 'Square', radius: 0 },
  { id: 'rounded', label: 'Rounded', radius: 0.2 },
  { id: 'circle', label: 'Circle', radius: 0.5 },
  { id: 'leaf', label: 'Leaf', radius: [0.5, 0, 0.5, 0] },
  { id: 'teardrop', label: 'Teardrop', radius: [0.5, 0.5, 0.5, 0] },
  { id: 'cut', label: 'Cut', radius: 0.3, cornerType: 'cut' },
];

export const ERROR_CORRECTION_LEVELS = [
  { value: 'L', label: 'L — 7%', hint: 'Smallest code, least damage tolerance' },
  { value: 'M', label: 'M — 15%', hint: 'Balanced default' },
  { value: 'Q', label: 'Q — 25%', hint: 'Good with a small logo' },
  { value: 'H', label: 'H — 30%', hint: 'Required for large logos' },
];

/** Wrap-around frames with a call-to-action, drawn by QrFrame (not the encoder). */
export const FRAME_STYLES = [
  { id: 'none', label: 'None' },
  { id: 'bottom-bar', label: 'Caption below' },
  { id: 'top-bar', label: 'Caption above' },
  { id: 'outline', label: 'Outline only' },
  { id: 'rounded-card', label: 'Card' },
  { id: 'speech-bubble', label: 'Speech bubble' },
];

export const GRADIENT_PRESETS = [
  { id: 'violet-cyan', label: 'Violet → Cyan', colors: ['#6d5efc', '#22d3ee'] },
  { id: 'sunset', label: 'Sunset', colors: ['#ff8a3d', '#e5484d'] },
  { id: 'mint', label: 'Mint', colors: ['#30a46c', '#22d3ee'] },
  { id: 'candy', label: 'Candy', colors: ['#f759ab', '#7c5ce8'] },
  { id: 'gold', label: 'Gold', colors: ['#f5a524', '#b3760f'] },
  { id: 'mono', label: 'Mono fade', colors: ['#3d3d47', '#0d0d10'] },
];

export const DEFAULT_STYLE = {
  // Body
  dotStyle: 'square',
  color: '#000000',
  backgroundColor: '#ffffff',
  // Gradient (applies to the body; overrides `color` when enabled)
  useGradient: false,
  gradientType: 'linear',
  gradientColors: ['#6d5efc', '#22d3ee'],
  // Eyes — null colour means "inherit from the body"
  eyeOuterStyle: 'square',
  eyeInnerStyle: 'square',
  eyeOuterColor: null,
  eyeInnerColor: null,
  // Encoding
  errorCorrectionLevel: 'M',
  // Geometry — `size` is the whole symbol's edge length in SVG units; the
  // renderer divides it by the module count to get each piece's size.
  size: 260,
  quietZone: 16,
  // Logo
  logoUri: null,
  logoScale: 0.22,
  logoPadding: 4,
  logoHidePieces: true,
  // Frame
  frameStyle: 'none',
  frameText: 'SCAN ME',
  frameColor: '#000000',
  frameTextColor: '#ffffff',
};

const DOT_MAP = DOT_STYLES.reduce((a, s) => ({ ...a, [s.id]: s }), {});
const EYE_MAP = EYE_STYLES.reduce((a, s) => ({ ...a, [s.id]: s }), {});

function scaleRadius(radius, basis) {
  if (Array.isArray(radius)) return radius.map((r) => r * basis);
  return radius * basis;
}

/**
 * Build the eye prop object, or undefined to leave the eye inheriting the body
 * style. Returning undefined matters: the library only applies body piece
 * options to the eyes when the eye options are absent entirely.
 */
function eyeProps(styleId, color, gradient, basisPieces, pieceSize) {
  const preset = EYE_MAP[styleId];
  if (!preset) return undefined;
  const isDefault = preset.radius === 0 && !preset.cornerType;
  if (isDefault && !color && !gradient) return undefined;

  const props = {
    borderRadius: scaleRadius(preset.radius, (basisPieces * pieceSize) / 2),
  };
  if (preset.cornerType) props.cornerType = preset.cornerType;
  if (color) props.color = color;
  if (gradient) props.gradient = gradient;
  return props;
}

function gradientProps(style) {
  if (!style.useGradient) return undefined;
  const colors = style.gradientColors?.length >= 2 ? style.gradientColors : DEFAULT_STYLE.gradientColors;
  if (style.gradientType === 'radial') {
    return { type: 'radial', options: { colors, center: [0.5, 0.5], radius: [0.7, 0.7] } };
  }
  return { type: 'linear', options: { colors, start: [0, 0], end: [1, 1] } };
}

/**
 * Flat style state -> react-native-qrcode-styled props.
 *
 * `moduleCount` is the symbol's width in modules, which the caller gets from
 * qrEncode.getModuleCount(). It is needed here because the renderer derives
 * each piece's size as `size / moduleCount`, and every radius this module
 * stores is a fraction of *that* — so a style keeps its look at any export
 * size, and at any payload length.
 *
 * Note the renderer has no `pieceSize` prop despite what its README's prop
 * table says; `size` is the whole symbol's edge length.
 */
export function resolveQrProps(style, data, moduleCount = 25) {
  const s = { ...DEFAULT_STYLE, ...(style ?? {}) };
  const dot = DOT_MAP[s.dotStyle] ?? DOT_MAP.square;
  const size = s.size || DEFAULT_STYLE.size;
  const pieceSize = size / Math.max(1, moduleCount);
  const bodyGradient = gradientProps(s);

  const props = {
    data: data ?? '',
    size,
    errorCorrectionLevel: s.errorCorrectionLevel,
    pieceBorderRadius: scaleRadius(dot.radius, pieceSize / 2),
    pieceCornerType: dot.cornerType ?? 'rounded',
    // 1.03 closes the hairline gaps Android leaves between adjacent pieces.
    pieceScale: dot.scale ?? 1.03,
    isPiecesGlued: !!dot.glued,
    color: s.color,
  };

  if (dot.rotation) props.pieceRotation = dot.rotation;
  if (dot.liquid) props.pieceLiquidRadius = dot.liquid * (pieceSize / 2);
  if (bodyGradient) props.gradient = bodyGradient;

  const outer = eyeProps(s.eyeOuterStyle, s.eyeOuterColor, undefined, 7, pieceSize);
  const inner = eyeProps(s.eyeInnerStyle, s.eyeInnerColor, undefined, 3, pieceSize);
  if (outer) props.outerEyesOptions = outer;
  if (inner) props.innerEyesOptions = inner;

  if (s.logoUri) {
    props.logo = {
      href: { uri: s.logoUri },
      scale: s.logoScale,
      padding: s.logoPadding,
      hidePieces: s.logoHidePieces,
    };
  }

  return props;
}

/**
 * Frame geometry, in the renderer's own coordinate space (the symbol occupies
 * 0..size on both axes).
 *
 * Frames are drawn as SVG inside the same <Svg> as the code rather than as
 * React Native views around it. That is the difference between an export that
 * includes the caption and one that silently drops it — `toDataURL` only ever
 * captures the SVG element.
 */
export function resolveFrameGeometry(style, moduleCount = 25) {
  const s = { ...DEFAULT_STYLE, ...(style ?? {}) };
  const size = s.size || DEFAULT_STYLE.size;
  const quiet = s.quietZone ?? DEFAULT_STYLE.quietZone;
  const frame = s.frameStyle ?? 'none';

  const captionHeight =
    frame === 'bottom-bar' || frame === 'top-bar' || frame === 'rounded-card' || frame === 'speech-bubble'
      ? Math.max(34, size * 0.16)
      : 0;
  const topCaption = frame === 'top-bar' ? captionHeight : 0;
  const bottomCaption = captionHeight - topCaption;

  // 'outline' and the card styles draw a stroke that must sit inside the canvas.
  const strokeInset = frame === 'outline' || frame === 'rounded-card' || frame === 'speech-bubble' ? 6 : 0;
  const tail = frame === 'speech-bubble' ? Math.max(12, size * 0.05) : 0;

  const x = -quiet - strokeInset;
  const y = -quiet - strokeInset - topCaption;
  const width = size + 2 * (quiet + strokeInset);
  const height = size + 2 * (quiet + strokeInset) + topCaption + bottomCaption + tail;

  return {
    frame,
    size,
    quiet,
    strokeInset,
    captionHeight,
    topCaption,
    bottomCaption,
    tail,
    viewBox: { x, y, width, height },
  };
}

/**
 * A logo punches a hole in the symbol, so the error-correction budget has to
 * cover it. These thresholds mirror the ones the qr-code-styling docs recommend.
 */
export function recommendedEccForLogo(logoScale) {
  if (!logoScale) return 'M';
  if (logoScale >= 0.28) return 'H';
  if (logoScale >= 0.2) return 'Q';
  return 'M';
}
