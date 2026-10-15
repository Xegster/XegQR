/**
 * tileIcons — the pictures a home-screen tile can show.
 *
 * A tile is a single 1x1 icon, so the icon is the whole look of the tile. For
 * now the choices are the app icon in four colour variations (assets/widget-icons,
 * hue-rotated from assets/icon.png). More icons are meant to be added here: give
 * each an id, a label and a bundled image, and both the picker in the setup
 * screen and the tile itself pick it up.
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
];

export const DEFAULT_ICON_ID = TILE_ICONS[0].id;

export function getTileIcon(id) {
  return TILE_ICONS.find((icon) => icon.id === id) ?? TILE_ICONS[0];
}
