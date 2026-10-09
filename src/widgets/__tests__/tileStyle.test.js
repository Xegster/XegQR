import {
  autoTextColor,
  backgroundStops,
  codeBackground,
  coloursFromSource,
  defaultTile,
  iconNameFor,
  matchCodeColours,
  minContrast,
  paletteBackground,
  resolveTextColor,
  retargetTile,
  withFillType,
  MIN_TILE_CONTRAST,
} from "../tileStyle";
import { getGradient } from "../../theme/gradients";

const wifiCode = {
  id: "qr_1",
  name: "Home network",
  type: "wifi",
  style: { color: "#000000", backgroundColor: "#ffffff" },
};

describe("autoTextColor", () => {
  it("puts white text on a dark background and dark text on a light one", () => {
    expect(autoTextColor({ type: "solid", colors: ["#1f2937"] })).toBe("#ffffff");
    expect(autoTextColor({ type: "solid", colors: ["#fef3c7"] })).toBe("#121212");
  });

  it("judges a gradient by its weaker end, since the label can sit over either", () => {
    const background = { type: "gradient", colors: ["#ffffff", "#000000"] };
    const chosen = autoTextColor(background);
    const other = chosen === "#ffffff" ? "#121212" : "#ffffff";
    expect(minContrast(chosen, background)).toBeGreaterThanOrEqual(minContrast(other, background));
  });

  it("falls back to a neutral background when the colours are unusable", () => {
    expect(backgroundStops({ type: "solid", colors: ["not a colour"] })).toEqual(["#4a4a5c"]);
    expect(autoTextColor(null)).toBe("#ffffff");
  });
});

describe("resolveTextColor", () => {
  it("uses the chosen colour when there is one", () => {
    expect(resolveTextColor({ textColor: "#FF0000", background: { type: "solid", colors: ["#000000"] } }))
      .toBe("#ff0000");
  });

  it("goes automatic when the colour is null", () => {
    expect(resolveTextColor({ textColor: null, background: { type: "solid", colors: ["#000000"] } }))
      .toBe("#ffffff");
  });
});

describe("backgroundStops", () => {
  it("normalises colours and keeps one stop for solid, two for gradient", () => {
    expect(backgroundStops({ type: "solid", colors: ["#ABC", "#000000"] })).toEqual(["#aabbcc"]);
    expect(backgroundStops({ type: "gradient", colors: ["#111111", "#222222", "#333333"] }))
      .toEqual(["#111111", "#222222"]);
  });

  it("treats a gradient with one usable colour as solid", () => {
    expect(backgroundStops({ type: "gradient", colors: ["#111111", "nope"] })).toEqual(["#111111"]);
  });
});

describe("matchCodeColours", () => {
  it("turns a black-on-white code into a black tile with white text", () => {
    expect(matchCodeColours(wifiCode)).toEqual({
      background: { type: "solid", colors: ["#000000"] },
      textColor: "#ffffff",
    });
  });

  it("copies the code's gradient when it uses one", () => {
    const code = {
      ...wifiCode,
      style: { useGradient: true, gradientColors: ["#6d5efc", "#22d3ee"], backgroundColor: "#ffffff" },
    };
    expect(codeBackground(code)).toEqual({ type: "gradient", colors: ["#6d5efc", "#22d3ee"] });
  });

  it("goes automatic when the code's own pairing is too faint for a label", () => {
    const code = { ...wifiCode, style: { color: "#777777", backgroundColor: "#888888" } };
    const { background, textColor } = matchCodeColours(code);
    expect(textColor).toBeNull();
    expect(minContrast(resolveTextColor({ background, textColor }), background))
      .toBeGreaterThanOrEqual(MIN_TILE_CONTRAST);
  });
});

describe("palette colours", () => {
  it("uses the light ramp so the label stays readable whatever the app theme", () => {
    const ramp = getGradient("cyan", false);
    expect(paletteBackground("cyan")).toEqual({ type: "gradient", colors: [ramp[1], ramp[3]] });
  });

  it("leaves the text automatic for a palette choice", () => {
    expect(coloursFromSource("violet", wifiCode).textColor).toBeNull();
  });
});

describe("withFillType", () => {
  it("keeps the first colour when switching between solid and gradient", () => {
    const gradient = withFillType({ type: "solid", colors: ["#6d5efc"] }, "gradient");
    expect(gradient.type).toBe("gradient");
    expect(gradient.colors[0]).toBe("#6d5efc");
    expect(gradient.colors).toHaveLength(2);
    expect(withFillType(gradient, "solid")).toEqual({ type: "solid", colors: ["#6d5efc"] });
  });
});

describe("iconNameFor", () => {
  it("maps the icon choice to an icon name", () => {
    expect(iconNameFor("qr", "wifi")).toBe("qr");
    expect(iconNameFor("type", "wifi")).toBe("wifi");
    expect(iconNameFor("none", "wifi")).toBeNull();
    expect(iconNameFor("type", "no-such-type")).toBe("qr");
  });
});

describe("defaultTile and retargetTile", () => {
  it("starts from the code's name, its type's icon and its type's bento hue", () => {
    const tile = defaultTile(wifiCode);
    expect(tile.label).toBe("Home network");
    expect(tile.customLabel).toBe(false);
    expect(tile.iconMode).toBe("type");
    expect(tile.source).toBe("cyan");
    expect(tile.background).toEqual(paletteBackground("cyan"));
  });

  it("lets the label follow a new code unless the user typed their own", () => {
    const other = { ...wifiCode, id: "qr_2", name: "Office" };
    expect(retargetTile(defaultTile(wifiCode), other).label).toBe("Office");

    const custom = { ...defaultTile(wifiCode), label: "Guest Wi-Fi", customLabel: true };
    expect(retargetTile(custom, other).label).toBe("Guest Wi-Fi");
  });

  it("re-copies colours from the new code only when matching code colours", () => {
    const red = { ...wifiCode, id: "qr_3", style: { color: "#e5484d", backgroundColor: "#ffffff" } };
    const matching = { ...defaultTile(wifiCode), ...coloursFromSource("code", wifiCode), source: "code" };
    expect(retargetTile(matching, red).background).toEqual({ type: "solid", colors: ["#e5484d"] });

    const palette = defaultTile(wifiCode);
    expect(retargetTile(palette, red).background).toEqual(palette.background);
  });
});
