import { iconSvgMarkup, ICON_NAMES } from "../icons/QrIcons";

describe("iconSvgMarkup", () => {
  it("serialises an icon to a standalone SVG document in the given colour", () => {
    const svg = iconSvgMarkup("wifi", "#ff0000");
    expect(svg.startsWith("<svg ")).toBe(true);
    expect(svg).toContain('viewBox="0 0 24 24"');
    expect(svg).toContain('stroke="#ff0000"');
    // The dot at the bottom of the Wi-Fi glyph is a filled circle.
    expect(svg).toContain('<circle cx="12" cy="19.5" r="1" fill="#ff0000" stroke="none"/>');
    expect(svg.endsWith("</svg>")).toBe(true);
  });

  it("flattens fragments, so multi-part icons keep every part", () => {
    const svg = iconSvgMarkup("qr", "#000000");
    expect(svg.match(/<rect /g)).toHaveLength(3);
    expect(svg.match(/<path /g)).toHaveLength(1);
  });

  it("produces markup for every icon in the set", () => {
    for (const name of ICON_NAMES) {
      expect(iconSvgMarkup(name)).toMatch(/<(path|circle|rect|line|polyline) /);
    }
  });

  it("falls back to the QR glyph for an unknown name", () => {
    expect(iconSvgMarkup("no-such-icon", "#000000")).toBe(iconSvgMarkup("qr", "#000000"));
  });
});
