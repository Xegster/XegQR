/**
 * widgetNames — the widget providers declared in app.config.js, and what each
 * one means here. Kept in a file of its own, with no imports, because the
 * headless widget task loads it and should load as little as possible.
 *
 * The names are the Java class names the config plugin generates, so they must
 * match app.config.js exactly.
 */

export const WIDGET_SIZES = Object.freeze({
  QrTileCompact: 'compact',
  QrTileLarge: 'large',
});

export const WIDGET_NAMES = Object.keys(WIDGET_SIZES);

export function sizeForWidget(widgetName) {
  return WIDGET_SIZES[widgetName] ?? 'compact';
}

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
