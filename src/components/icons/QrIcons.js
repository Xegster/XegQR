import React from "react";
import Svg, { Path, Circle, Rect, Line, Polyline } from "react-native-svg";

/**
 * QrIcons — the app's whole icon set, hand-rolled as SVG paths.
 *
 * Both sibling apps ship custom icon components rather than pulling an icon
 * font/library, and the same reasoning applies here: a dozen-odd stroke icons
 * cost less than a dependency, and they inherit `color` from the call site so
 * they work on gradient tiles and themed surfaces alike.
 *
 * All icons are drawn on a 24x24 canvas with a 2px stroke and round caps.
 *
 * `iconSvgMarkup` serialises the same drawings to an SVG string for the Android
 * home-screen widget, which cannot host React components — so the tiles share
 * this one icon set instead of carrying a copy.
 */

const PATHS = {
  // --- QR content types ---
  link: (c) => (
    <>
      <Path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" stroke={c} />
      <Path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" stroke={c} />
    </>
  ),
  text: (c) => (
    <>
      <Line x1="4" y1="7" x2="20" y2="7" stroke={c} />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={c} />
      <Line x1="4" y1="17" x2="14" y2="17" stroke={c} />
    </>
  ),
  wifi: (c) => (
    <>
      <Path d="M2 8.5a16 16 0 0 1 20 0" stroke={c} />
      <Path d="M5 12.5a11 11 0 0 1 14 0" stroke={c} />
      <Path d="M8.5 16a6 6 0 0 1 7 0" stroke={c} />
      <Circle cx="12" cy="19.5" r="1" fill={c} stroke="none" />
    </>
  ),
  contact: (c) => (
    <>
      <Circle cx="12" cy="8" r="3.5" stroke={c} />
      <Path d="M4.5 20a7.5 7.5 0 0 1 15 0" stroke={c} />
    </>
  ),
  mail: (c) => (
    <>
      <Rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke={c} />
      <Path d="M3.5 7.5 12 13l8.5-5.5" stroke={c} />
    </>
  ),
  message: (c) => (
    <Path d="M20.5 12a7.5 7.5 0 0 1-11 6.6L4 20l1.4-4.2A7.5 7.5 0 1 1 20.5 12Z" stroke={c} />
  ),
  phone: (c) => (
    <Path
      d="M6.5 3.5h2l1.5 4-2 1.4a11.5 11.5 0 0 0 5.1 5.1l1.4-2 4 1.5v2a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z"
      stroke={c}
    />
  ),
  pin: (c) => (
    <>
      <Path d="M12 21s6.5-6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15 12 21 12 21Z" stroke={c} />
      <Circle cx="12" cy="10" r="2.5" stroke={c} />
    </>
  ),
  calendar: (c) => (
    <>
      <Rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke={c} />
      <Line x1="3.5" y1="10" x2="20.5" y2="10" stroke={c} />
      <Line x1="8" y1="3" x2="8" y2="6.5" stroke={c} />
      <Line x1="16" y1="3" x2="16" y2="6.5" stroke={c} />
    </>
  ),
  coin: (c) => (
    <>
      <Circle cx="12" cy="12" r="8.5" stroke={c} />
      <Path d="M12 7v10M9.5 9.5h4a2 2 0 0 1 0 4h-4h4a2 2 0 0 1 0 4" stroke={c} />
    </>
  ),
  bank: (c) => (
    <>
      <Path d="M3.5 9.5 12 4l8.5 5.5" stroke={c} />
      <Line x1="6" y1="11" x2="6" y2="17" stroke={c} />
      <Line x1="12" y1="11" x2="12" y2="17" stroke={c} />
      <Line x1="18" y1="11" x2="18" y2="17" stroke={c} />
      <Line x1="3.5" y1="20" x2="20.5" y2="20" stroke={c} />
    </>
  ),
  video: (c) => (
    <>
      <Rect x="2.5" y="6" width="13" height="12" rx="2.5" stroke={c} />
      <Path d="M15.5 10.5 21.5 7v10l-6-3.5Z" stroke={c} />
    </>
  ),
  social: (c) => (
    <>
      <Circle cx="17" cy="6" r="2.5" stroke={c} />
      <Circle cx="7" cy="12" r="2.5" stroke={c} />
      <Circle cx="17" cy="18" r="2.5" stroke={c} />
      <Line x1="9.2" y1="10.8" x2="14.8" y2="7.2" stroke={c} />
      <Line x1="9.2" y1="13.2" x2="14.8" y2="16.8" stroke={c} />
    </>
  ),
  app: (c) => (
    <>
      <Rect x="6.5" y="2.5" width="11" height="19" rx="2.5" stroke={c} />
      <Line x1="10.5" y1="18.5" x2="13.5" y2="18.5" stroke={c} />
    </>
  ),
  bookmark: (c) => <Path d="M6.5 3.5h11v17l-5.5-4-5.5 4Z" stroke={c} />,
  shield: (c) => (
    <>
      <Path d="M12 3 19 6v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3Z" stroke={c} />
      <Polyline points="9,12 11,14 15,10" stroke={c} />
    </>
  ),

  // --- UI ---
  qr: (c) => (
    <>
      <Rect x="3.5" y="3.5" width="6" height="6" rx="1" stroke={c} />
      <Rect x="14.5" y="3.5" width="6" height="6" rx="1" stroke={c} />
      <Rect x="3.5" y="14.5" width="6" height="6" rx="1" stroke={c} />
      <Path d="M14.5 14.5h3v3h-3zM20.5 14.5v3M14.5 20.5h6" stroke={c} />
    </>
  ),
  back: (c) => (
    <>
      <Line x1="20" y1="12" x2="5" y2="12" stroke={c} />
      <Polyline points="11,6 5,12 11,18" stroke={c} />
    </>
  ),
  chevron: (c) => <Polyline points="9,5 16,12 9,19" stroke={c} />,
  settings: (c) => (
    <>
      <Circle cx="12" cy="12" r="3" stroke={c} />
      <Path
        d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.5 15H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9 4.5V4a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.8 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.8h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1Z"
        stroke={c}
      />
    </>
  ),
  save: (c) => (
    <>
      <Path d="M5 3.5h11l3 3v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" stroke={c} />
      <Polyline points="8,3.5 8,9 15,9" stroke={c} />
      <Rect x="7.5" y="13" width="9" height="6.5" rx="1" stroke={c} />
    </>
  ),
  share: (c) => (
    <>
      <Circle cx="18" cy="5.5" r="2.5" stroke={c} />
      <Circle cx="6" cy="12" r="2.5" stroke={c} />
      <Circle cx="18" cy="18.5" r="2.5" stroke={c} />
      <Line x1="8.2" y1="10.8" x2="15.8" y2="6.7" stroke={c} />
      <Line x1="8.2" y1="13.2" x2="15.8" y2="17.3" stroke={c} />
    </>
  ),
  download: (c) => (
    <>
      <Line x1="12" y1="3.5" x2="12" y2="15" stroke={c} />
      <Polyline points="7,10.5 12,15.5 17,10.5" stroke={c} />
      <Path d="M4 17.5v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" stroke={c} />
    </>
  ),
  copy: (c) => (
    <>
      <Rect x="8.5" y="8.5" width="12" height="12" rx="2" stroke={c} />
      <Path d="M15.5 5.5v-1a1 1 0 0 0-1-1h-10a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1" stroke={c} />
    </>
  ),
  camera: (c) => (
    <>
      <Path d="M4.5 7.5h3l1.5-2.5h6L16.5 7.5h3a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V9a1.5 1.5 0 0 1 1.5-1.5Z" stroke={c} />
      <Circle cx="12" cy="13" r="3.5" stroke={c} />
    </>
  ),
  trash: (c) => (
    <>
      <Polyline points="4,6.5 20,6.5" stroke={c} />
      <Path d="M6.5 6.5 7.5 20a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1l1-13.5" stroke={c} />
      <Path d="M9.5 6.5V4.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" stroke={c} />
    </>
  ),
  moon: (c) => <Path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" stroke={c} />,
  sun: (c) => (
    <>
      <Circle cx="12" cy="12" r="4" stroke={c} />
      <Path
        d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"
        stroke={c}
      />
    </>
  ),
  plus: (c) => (
    <>
      <Line x1="12" y1="5" x2="12" y2="19" stroke={c} />
      <Line x1="5" y1="12" x2="19" y2="12" stroke={c} />
    </>
  ),
  check: (c) => <Polyline points="5,12.5 10,17.5 19,7" stroke={c} />,
  close: (c) => (
    <>
      <Line x1="6" y1="6" x2="18" y2="18" stroke={c} />
      <Line x1="18" y1="6" x2="6" y2="18" stroke={c} />
    </>
  ),
  image: (c) => (
    <>
      <Rect x="3.5" y="4.5" width="17" height="15" rx="2.5" stroke={c} />
      <Circle cx="8.5" cy="9.5" r="1.5" stroke={c} />
      <Path d="M4 17l4.5-4.5 3.5 3.5 3-3 5 5" stroke={c} />
    </>
  ),
  palette: (c) => (
    <>
      <Path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.4 0 2-.9 2-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6h1.4a4.5 4.5 0 0 0 4.5-4.5c0-3.6-3.8-6.7-8.5-6.7Z" stroke={c} />
      <Circle cx="7.5" cy="11" r="1.2" fill={c} stroke="none" />
      <Circle cx="11" cy="7.5" r="1.2" fill={c} stroke="none" />
      <Circle cx="15.5" cy="8.5" r="1.2" fill={c} stroke="none" />
    </>
  ),
  folder: (c) => (
    <Path d="M3.5 6.5a1 1 0 0 1 1-1h4l2 2.5h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-14a1 1 0 0 1-1-1Z" stroke={c} />
  ),
};

export const ICON_NAMES = Object.keys(PATHS);

const SVG_TAGS = new Map([
  [Path, "path"],
  [Circle, "circle"],
  [Rect, "rect"],
  [Line, "line"],
  [Polyline, "polyline"],
]);

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function toMarkup(node) {
  return React.Children.toArray(node)
    .map((child) => {
      if (child.type === React.Fragment) return toMarkup(child.props.children);
      const tag = SVG_TAGS.get(child.type);
      if (!tag) return "";
      const attrs = Object.entries(child.props)
        .filter(([key, value]) => key !== "children" && value !== undefined && value !== null)
        .map(([key, value]) => `${key}="${escapeAttr(value)}"`)
        .join(" ");
      return `<${tag} ${attrs}/>`;
    })
    .join("");
}

/** A standalone SVG document for one icon, for renderers that take markup. */
export function iconSvgMarkup(name, color = "#ffffff", strokeWidth = 2) {
  const render = PATHS[name] ?? PATHS.qr;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" ` +
    `stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">` +
    `${toMarkup(render(color))}</svg>`
  );
}

export default function Icon({ name, size = 22, color = "#ffffff", strokeWidth = 2, style }) {
  const render = PATHS[name] ?? PATHS.qr;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {render(color)}
    </Svg>
  );
}
