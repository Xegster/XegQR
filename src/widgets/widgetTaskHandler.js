import { getBinding, removeBinding } from "./widgetBindings";
import { renderTile } from "./QrTile";

/**
 * widgetTaskHandler — the headless task Android wakes for widget events.
 *
 * Runs with no UI, possibly from a cold start, so it touches nothing but
 * AsyncStorage (via widgetBindings) and the widget primitives (via QrTile).
 * Taps never reach it: every tile uses OPEN_URI, which the launcher handles by
 * opening the app directly.
 */
export async function widgetTaskHandler({ widgetInfo, widgetAction, renderWidget }) {
  switch (widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED": {
      const binding = await getBinding(widgetInfo.widgetId);
      renderWidget(renderTile(binding, widgetInfo));
      break;
    }

    case "WIDGET_DELETED":
      await removeBinding(widgetInfo.widgetId);
      break;

    default:
      break;
  }
}
