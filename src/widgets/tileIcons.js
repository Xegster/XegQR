/**
 * tileIcons — the pictures a home-screen tile can show.
 *
 * A tile is a single 1x1 icon, so the icon is the whole look of the tile. The
 * choices are the app icon in four colour variations (hue-rotated from
 * assets/icon.png) and eight themed pictures, all 384x384 PNGs in
 * assets/widget-icons. More icons are meant to be added here: give each an id, a
 * label and a bundled image, and both the picker in the setup screen and the
 * tile itself pick it up. Files in that folder that are not listed here (neon,
 * glow) are kept for later and are not shown in the picker.
 *
 * The binding stores only the id, never the image, so an icon can be swapped for
 * a better one later without touching saved tiles. An unknown id (say, from a
 * newer build) falls back to the default.
 */

export const TILE_ICONS = [
  { id: "cyan", label: "Cyan", image: require("../../assets/widget-icons/cyan.png") },
  { id: "green", label: "Green", image: require("../../assets/widget-icons/green.png") },
  { id: "ember", label: "Ember", image: require("../../assets/widget-icons/ember.png") },
  { id: "magenta", label: "Magenta", image: require("../../assets/widget-icons/magenta.png") },
  { id: "leaf", label: "Leaf", image: require("../../assets/widget-icons/leaf.png") },
  { id: "pixel", label: "Pixel", image: require("../../assets/widget-icons/pixel.png") },
  { id: "wood", label: "Wood", image: require("../../assets/widget-icons/wood.png") },
  { id: "tech", label: "Tech", image: require("../../assets/widget-icons/tech.png") },
  { id: "wash", label: "Wash", image: require("../../assets/widget-icons/wash.png") },
  { id: "doodle", label: "Doodle", image: require("../../assets/widget-icons/doodle.png") },
  { id: "vine", label: "Vine", image: require("../../assets/widget-icons/vine.png") },
  { id: "arcade", label: "Arcade", image: require("../../assets/widget-icons/arcade.png") },
];

export const DEFAULT_ICON_ID = TILE_ICONS[0].id;

export function getTileIcon(id) {
  return TILE_ICONS.find((icon) => icon.id === id) ?? TILE_ICONS[0];
}
