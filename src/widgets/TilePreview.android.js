import React, { useCallback } from "react";
import { WidgetPreview } from "react-native-android-widget";
import { renderTile } from "./QrTile";

/**
 * TilePreview — the real tile, rendered by the widget library's own native
 * renderer, so the preview in the setup screen is exactly what the home screen
 * will draw.
 */
export default function TilePreview({ binding, widgetId, widgetName, width, height }) {
  const renderWidget = useCallback(
    () => renderTile(binding, { widgetId, widgetName }),
    [binding, widgetId, widgetName]
  );
  return <WidgetPreview renderWidget={renderWidget} width={width} height={height} />;
}
