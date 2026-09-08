import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

/**
 * AppButton — the single interactive button component for the app.
 *
 * Ported from NetXegManager so the three apps share one press model.
 *
 * Depth model:
 *   Solid variants (primary/secondary/tertiary/destructive):
 *     - Resting: coloured shadow lifts the button off the surface + a
 *       semi-transparent white border reads as a top-edge glint.
 *     - Pressed: shadow collapses, button translates 2 px down, and a
 *       semi-transparent dark overlay darkens the face — a physical "click".
 *   Outline / destructiveOutline:
 *     - No shadow (avoids the elevation box on transparent backgrounds).
 *     - Pressed: scale 0.97 + theme-aware overlay tint.
 *   Ghost:
 *     - No shadow, no border, subtle pressed tint.
 *
 * Variants: primary | secondary | tertiary | destructive |
 *           outline | destructiveOutline | ghost
 * Sizes:    sm | md | lg
 *
 * primary/secondary/tertiary track the theme's accent colours automatically —
 * no extra wiring at the call site.
 */
export default function AppButton({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  fullWidth = false,
  icon = null,
  style,
  testID,
  accessibilityLabel,
}) {
  const { tokens, isDark } = useTheme();

  const solidBorder = "rgba(255,255,255,0.18)";

  const colorMap = {
    primary:            { bg: tokens.PrimaryColor,   text: "#fff",              edgeBorder: solidBorder, outlineBorder: null },
    secondary:          { bg: tokens.SecondaryColor, text: "#fff",              edgeBorder: solidBorder, outlineBorder: null },
    tertiary:           { bg: tokens.TertiaryColor,  text: "#08333d",           edgeBorder: solidBorder, outlineBorder: null },
    destructive:        { bg: tokens.danger,         text: "#fff",              edgeBorder: solidBorder, outlineBorder: null },
    outline:            { bg: "transparent",         text: tokens.PrimaryColor, edgeBorder: null,        outlineBorder: tokens.PrimaryColor },
    destructiveOutline: { bg: "transparent",         text: tokens.danger,       edgeBorder: null,        outlineBorder: tokens.danger },
    ghost:              { bg: "transparent",         text: tokens.text,         edgeBorder: null,        outlineBorder: null },
  };

  const sz = {
    sm: { paddingVertical: 8,  paddingHorizontal: 14, fontSize: 13, borderRadius: 8,  gap: 6  },
    md: { paddingVertical: 13, paddingHorizontal: 22, fontSize: 15, borderRadius: 10, gap: 8  },
    lg: { paddingVertical: 17, paddingHorizontal: 30, fontSize: 17, borderRadius: 12, gap: 10 },
  }[size] ?? { paddingVertical: 13, paddingHorizontal: 22, fontSize: 15, borderRadius: 10, gap: 8 };

  const cfg = colorMap[variant] ?? colorMap.primary;
  const isSolid = cfg.edgeBorder !== null;
  const hasBorder = isSolid || cfg.outlineBorder !== null;

  const overlayColor = isSolid
    ? "rgba(0,0,0,0.13)"
    : isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)";

  return (
    <Pressable
      testID={testID ?? `btn-${label?.replace(/\s+/g, "-").toLowerCase()}`}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => {
        const base = {
          backgroundColor: cfg.bg,
          borderRadius: sz.borderRadius,
          borderWidth: hasBorder ? 1.5 : 0,
          borderColor: isSolid ? cfg.edgeBorder : cfg.outlineBorder ?? "transparent",
          paddingVertical: sz.paddingVertical,
          paddingHorizontal: sz.paddingHorizontal,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: sz.gap,
          alignSelf: fullWidth ? "stretch" : "auto",
          overflow: "hidden",
          opacity: disabled ? 0.42 : 1,
        };

        if (isSolid && !disabled) {
          Object.assign(base, {
            shadowColor: cfg.bg,
            shadowOffset: { width: 0, height: pressed ? 1 : 2 },
            shadowOpacity: pressed ? 0.10 : 0.22,
            shadowRadius: pressed ? 1 : 3,
            elevation: pressed ? 1 : 4,
            transform: [{ translateY: pressed ? 2 : 0 }],
          });
        } else if (!isSolid) {
          Object.assign(base, {
            transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
          });
        }

        return [base, style];
      }}
    >
      {({ pressed }) => (
        <>
          {pressed && !disabled && (
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: overlayColor, borderRadius: sz.borderRadius },
              ]}
              pointerEvents="none"
            />
          )}
          {icon}
          <Text
            style={{
              color: cfg.text,
              fontSize: sz.fontSize,
              fontWeight: "600",
              letterSpacing: 0.3,
            }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
