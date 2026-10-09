import React from "react";
import { FlexWidget, TextWidget, SvgWidget } from "react-native-android-widget";
import { hexToRgba, isValidHex, normalizeHex } from "../utils/color";
import { sizeForWidget, setupUriFor, showUriFor } from "./widgetNames";

/**
 * QrTile — the home-screen widget, drawn with the widget library's primitives.
 *
 * The tile is a styled shortcut, not the code: a QR code at widget size is too
 * small to scan reliably, and leaving it out means nothing secret ever sits on
 * the home screen. Tapping opens XegQR on the full-screen view of the code.
 *
 * Three states:
 *   bound    — label, icon and colours from the binding; tap shows the code
 *   removed  — the code was deleted; tap opens setup to choose another
 *   unbound  — no binding yet (e.g. pinned without going through the config
 *              screen); tap opens setup
 *
 * Renders purely from the binding record — see widgetBindings.js for why. The
 * colours were validated when the binding was saved, but they are checked again
 * here because a malformed colour would throw inside the native renderer.
 */

const NEUTRAL_BACKGROUND = "#2c2c36";
const NEUTRAL_TEXT = "#f5f5f7";

function hex(value, fallback) {
  return isValidHex(value) ? normalizeHex(value) : fallback;
}

function backgroundStyle(background) {
  const colors = background?.colors ?? [];
  if (background?.type === "gradient" && colors.length >= 2) {
    return {
      backgroundGradient: {
        from: hex(colors[0], NEUTRAL_BACKGROUND),
        to: hex(colors[1], NEUTRAL_BACKGROUND),
        orientation: "TL_BR",
      },
    };
  }
  return { backgroundColor: hex(colors[0], NEUTRAL_BACKGROUND) };
}

export function QrTile({ binding, widgetId, widgetName }) {
  const size = sizeForWidget(widgetName);
  const bound = !!binding?.codeId && !binding.removed;

  const textColor = bound ? hex(binding.textColor, NEUTRAL_TEXT) : NEUTRAL_TEXT;
  const mutedColor = hexToRgba(textColor, 0.78);
  const radius = Number.isFinite(binding?.radius) ? binding.radius : 20;

  let title;
  let subtitle;
  let uri;
  if (bound) {
    title = binding.label || "QR code";
    subtitle = "Tap to show code";
    uri = showUriFor(binding.codeId);
  } else if (binding?.removed) {
    title = "Code removed";
    subtitle = "Tap to choose another";
    uri = setupUriFor(widgetId, widgetName);
  } else {
    title = "Choose a code";
    subtitle = "Tap to set up this tile";
    uri = setupUriFor(widgetId, widgetName);
  }

  const icon = bound && binding.iconSvg ? binding.iconSvg : null;
  const rootStyle = {
    height: "match_parent",
    width: "match_parent",
    borderRadius: radius,
    ...(bound ? backgroundStyle(binding.background) : { backgroundColor: NEUTRAL_BACKGROUND }),
  };
  const rootProps = {
    clickAction: "OPEN_URI",
    clickActionData: { uri },
    accessibilityLabel: bound ? `Show ${title} QR code` : `${title}. ${subtitle}`,
  };

  if (size === "large") {
    return (
      <FlexWidget
        {...rootProps}
        style={{ ...rootStyle, flexDirection: "column", justifyContent: "space-between", padding: 16 }}
      >
        {icon ? (
          <SvgWidget svg={icon} style={{ height: 32, width: 32 }} />
        ) : (
          <FlexWidget style={{ height: 1, width: 1 }} />
        )}
        <FlexWidget style={{ flexDirection: "column", width: "match_parent" }}>
          <TextWidget
            text={title}
            maxLines={2}
            truncate="END"
            style={{ fontSize: 20, fontWeight: "800", color: textColor }}
          />
          <TextWidget
            text={subtitle}
            maxLines={1}
            truncate="END"
            style={{ fontSize: 12, fontWeight: "500", color: mutedColor, marginTop: 2 }}
          />
        </FlexWidget>
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      {...rootProps}
      style={{ ...rootStyle, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, flexGap: 10 }}
    >
      {icon ? <SvgWidget svg={icon} style={{ height: 24, width: 24 }} /> : null}
      <FlexWidget style={{ flex: 1, flexDirection: "column" }}>
        <TextWidget
          text={title}
          maxLines={bound ? 2 : 1}
          truncate="END"
          style={{ fontSize: 15, fontWeight: "700", color: textColor }}
        />
        {bound ? null : (
          <TextWidget
            text={subtitle}
            maxLines={1}
            truncate="END"
            style={{ fontSize: 11, fontWeight: "500", color: mutedColor }}
          />
        )}
      </FlexWidget>
    </FlexWidget>
  );
}

/** The element to hand to the library's renderWidget / requestWidgetUpdate. */
export function renderTile(binding, widgetInfo) {
  return (
    <QrTile binding={binding} widgetId={widgetInfo.widgetId} widgetName={widgetInfo.widgetName} />
  );
}
