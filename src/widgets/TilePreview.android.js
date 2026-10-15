import React, { useCallback } from "react";
import { WidgetPreview } from "react-native-android-widget";
import { renderTile } from "./QrTile";

/**
 * TilePreview — the real tile, rendered by the widget library's own native
 * renderer, so the preview in the setup screen is exactly what the home screen
 * will draw. Tiles are square (1x1), so one size is enough.
 */
export default function TilePreview({ binding, widgetId, widgetName, size }) {
  const renderWidget = useCallback(
    () => renderTile(binding, { widgetId, widgetName }),
    [binding, widgetId, widgetName]
  );
  return <WidgetPreview renderWidget={renderWidget} width={size} height={size} />;
}
