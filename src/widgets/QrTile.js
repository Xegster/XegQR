import React from "react";
import { FlexWidget, TextWidget, ImageWidget } from "react-native-android-widget";
import { getTileIcon } from "./tileIcons";
import { setupUriFor, showUriFor } from "./widgetNames";

/**
 * QrTile — the home-screen widget, drawn with the widget library's primitives.
 *
 * The tile is a 1x1 icon that works as a shortcut, not the code: a QR code at
 * widget size is too small to scan reliably, and leaving it out means nothing
 * secret ever sits on the home screen. The tile shows no text either, so it
 * gives nothing away about the code it opens. Tapping it opens XegQR on the
 * full-screen view of the code.
 *
 * Three states:
 *   bound    — the chosen icon; tap shows the code
 *   removed  — the code was deleted; a plain tile that says so, tap opens setup
 *              to choose another
 *   unbound  — no binding yet (e.g. pinned without going through the config
 *              screen); the same plain tile, tap opens setup
 *
 * Renders purely from the binding record — see widgetBindings.js for why.
 */

const NEUTRAL_BACKGROUND = "#2c2c36";
const NEUTRAL_TEXT = "#f5f5f7";
const NEUTRAL_MUTED = "rgba(245, 245, 247, 0.78)";
const NEUTRAL_RADIUS = 18;

// The size in dp the icon bitmap is prepared at. A 1x1 cell is smaller than
// this on every phone, so the launcher scales it down, and the picture stays
// sharp on dense screens.
const ICON_SIZE = 96;

export function QrTile({ binding, widgetId, widgetName }) {
  const bound = !!binding?.codeId && !binding.removed;

  if (bound) {
    return (
      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri: showUriFor(binding.codeId) }}
        accessibilityLabel={`Show ${binding.label || "QR code"} QR code`}
        style={{ height: "match_parent", width: "match_parent", alignItems: "center", justifyContent: "center" }}
      >
        <ImageWidget
          image={getTileIcon(binding.iconId).image}
          imageWidth={ICON_SIZE}
          imageHeight={ICON_SIZE}
          resizeMode="contain"
          style={{ height: "match_parent", width: "match_parent" }}
        />
      </FlexWidget>
    );
  }

  const title = binding?.removed ? "Code removed" : "Choose a code";
  const subtitle = binding?.removed ? "Tap to choose" : "Tap to set up";
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: setupUriFor(widgetId, widgetName) }}
      accessibilityLabel={`${title}. ${subtitle}`}
      style={{
        height: "match_parent",
        width: "match_parent",
        borderRadius: NEUTRAL_RADIUS,
        backgroundColor: NEUTRAL_BACKGROUND,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 6,
      }}
    >
      <TextWidget
        text={title}
        maxLines={2}
        truncate="END"
        style={{ fontSize: 12, fontWeight: "700", color: NEUTRAL_TEXT, textAlign: "center" }}
      />
      <TextWidget
        text={subtitle}
        maxLines={1}
        truncate="END"
        style={{ fontSize: 10, fontWeight: "500", color: NEUTRAL_MUTED, textAlign: "center", marginTop: 2 }}
      />
    </FlexWidget>
  );
}

/** The element to hand to the library's renderWidget / requestWidgetUpdate. */
export function renderTile(binding, widgetInfo) {
  return (
    <QrTile binding={binding} widgetId={widgetInfo.widgetId} widgetName={widgetInfo.widgetName} />
  );
}
