import { isWeb } from './platform';

/**
 * scopeSvgIds — make one rendered QR's SVG <defs> ids unique to that instance.
 *
 * Why this is needed: react-native-qrcode-styled hardcodes its gradient ids
 * ("gradient", "topLeftCornerSquareGradient", …). On web those become real DOM
 * ids, and SVG id references are resolved document-wide — so a second code on
 * the same page has its `url(#gradient)` resolve to the *first* code's
 * gradient. When that first code sits in a screen the router has hidden, the
 * browser declines to paint it at all and the second code renders blank. Two
 * gradient codes on one screen (the saved list) is enough to trigger it.
 *
 * Native is unaffected: react-native-svg resolves ids per Svg instance, so this
 * is a no-op off the web.
 *
 * The rewrite has to be re-applied after every render, because React restores
 * the original id whenever it touches the element.
 */
export default function scopeSvgIds(hostNode, suffix) {
  if (!isWeb || !hostNode || !suffix) return;

  const svg = typeof hostNode.querySelector === 'function' ? hostNode.querySelector('svg') : null;
  if (!svg) return;

  const defs = svg.querySelector('defs');
  if (!defs) return;

  const renames = [];
  for (const node of Array.from(defs.children)) {
    const id = node.getAttribute('id');
    if (!id || id.endsWith(`-${suffix}`)) continue;
    const scoped = `${id}-${suffix}`;
    node.setAttribute('id', scoped);
    renames.push([id, scoped]);
  }
  if (!renames.length) return;

  // Paint-server references live on fill and stroke, on the pieces group and on
  // the individual eye paths.
  for (const el of Array.from(svg.querySelectorAll('[fill], [stroke]'))) {
    for (const attr of ['fill', 'stroke']) {
      const value = el.getAttribute(attr);
      if (!value || !value.includes('url(#')) continue;
      const next = renames.reduce(
        (acc, [from, to]) => acc.replace(`url(#${from})`, `url(#${to})`),
        value
      );
      if (next !== value) el.setAttribute(attr, next);
    }
  }
}
