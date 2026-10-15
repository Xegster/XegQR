/**
 * widgetNames — the widget provider declared in app.config.js, and the links a
 * tile opens. Kept in a file of its own, with no imports, because the headless
 * widget task loads it and should load as little as possible.
 *
 * The name is the Java class name the config plugin generates, so it must match
 * app.config.js exactly. There is one provider, and it is 1x1: the tile is an
 * icon, and the icon is chosen per tile (see tileIcons.js).
 */

export const WIDGET_NAME = 'QrTile';

export const WIDGET_NAMES = [WIDGET_NAME];

/**
 * Where a tile with nothing to show sends the user: the in-app setup screen for
 * that one widget. Both values come from Android (an integer id and one of the
 * names above), never from user input.
 */
export function setupUriFor(widgetId, widgetName) {
  return `xegqr://widget/${encodeURIComponent(String(widgetId))}?name=${encodeURIComponent(widgetName)}`;
}

export function showUriFor(codeId) {
  return `xegqr://show/${encodeURIComponent(String(codeId))}`;
}
