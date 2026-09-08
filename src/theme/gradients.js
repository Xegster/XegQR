/**
 * gradients — the shared diagonal-gradient palette for BentoTile fills.
 *
 * Same idea as PoGoManager's BentoDashboardGrid GRADIENTS map, generalised so a
 * tile only names a hue ("violet", "cyan", ...) and the current theme decides
 * the stops. Dark theme sinks the far end into the app background so tiles read
 * as lit panels; light theme keeps every stop saturated enough that the white
 * tile label stays legible (the naive "fade to white" version fails contrast).
 *
 * Every ramp is consumed by <LinearGradient start={{x:0,y:0}} end={{x:1,y:1}}/>,
 * so stop order runs top-left (brightest) to bottom-right (deepest).
 */

const RAMPS = {
  violet: {
    dark: ['#8b7cff', '#5b3fd6', '#2a1a5e', '#0d0d10'],
    light: ['#a99bff', '#7c5ce8', '#5b3fd6', '#3f2aa8'],
  },
  cyan: {
    dark: ['#4ee0f5', '#1d8ba8', '#0e3d52', '#0d0d10'],
    light: ['#5fe3f7', '#1fa5c4', '#127893', '#0d5c73'],
  },
  magenta: {
    dark: ['#ff6ad5', '#b3239b', '#4d0f45', '#0d0d10'],
    light: ['#ff86dd', '#d63bb5', '#a8218c', '#7d1668'],
  },
  amber: {
    dark: ['#ffc542', '#b3760f', '#4d3208', '#0d0d10'],
    light: ['#ffbe2e', '#e08a0c', '#b56d08', '#8a5306'],
  },
  emerald: {
    dark: ['#4ade9a', '#1a9160', '#0c412b', '#0d0d10'],
    light: ['#42d494', '#16a06a', '#0f7d52', '#0b5e3e'],
  },
  rose: {
    dark: ['#ff7a6b', '#c2352a', '#521512', '#0d0d10'],
    light: ['#ff8b7d', '#e0453a', '#b83228', '#8f251d'],
  },
  slate: {
    dark: ['#8b8ba3', '#4a4a5c', '#232330', '#0d0d10'],
    light: ['#9797ad', '#61617a', '#454559', '#2f2f3d'],
  },
  indigo: {
    dark: ['#7f9cff', '#3a5bd6', '#1a2a63', '#0d0d10'],
    light: ['#8fa9ff', '#4a6ae8', '#3350c9', '#243b9c'],
  },
};

export const GRADIENT_NAMES = Object.keys(RAMPS);

/** Resolve a hue name + theme into the colour stop array LinearGradient wants. */
export function getGradient(name, isDark) {
  const ramp = RAMPS[name] ?? RAMPS.violet;
  return isDark ? ramp.dark : ramp.light;
}

/**
 * A two-stop "wash" for surfaces that should hint at a hue without becoming a
 * full colour block — list rows, panel headers. Mirrors NetXeg's
 * GradientRowCard formula: base surface colour into a low-alpha accent.
 */
export function getWash(baseColor, accentHex, isDark) {
  const alpha = isDark ? 0.16 : 0.1;
  const clean = String(accentHex).replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return [baseColor, `rgba(${r}, ${g}, ${b}, ${alpha})`];
}
