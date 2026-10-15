import { DEFAULT_ICON_ID, TILE_ICONS, getTileIcon } from "../tileIcons";

describe("TILE_ICONS", () => {
  it("offers four icons, each with a unique id, a label and a bundled image", () => {
    expect(TILE_ICONS).toHaveLength(4);
    expect(new Set(TILE_ICONS.map((icon) => icon.id)).size).toBe(TILE_ICONS.length);
    for (const icon of TILE_ICONS) {
      expect(icon.label).toBeTruthy();
      expect(icon.image).toBeDefined();
    }
  });
});

describe("getTileIcon", () => {
  it("finds an icon by id", () => {
    expect(getTileIcon("ember").id).toBe("ember");
  });

  it("falls back to the default for an unknown or missing id", () => {
    expect(getTileIcon("no-such-icon").id).toBe(DEFAULT_ICON_ID);
    expect(getTileIcon(undefined).id).toBe(DEFAULT_ICON_ID);
  });
});
