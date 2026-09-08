import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../theme/ThemeProvider";
import { getGradient } from "../theme/gradients";

/**
 * BentoTile — a single card in a bento grid.
 *
 * Ported from NetXegManager's BentoTile with one change: a tile names a hue
 * ("violet", "cyan") instead of carrying literal colour stops, and
 * theme/gradients.js resolves it for the active theme. That keeps every tile
 * legible in light mode, which hardcoded dark ramps are not.
 *
 * Variants:
 *   grid  — square-ish cell, icon above label (the default)
 *   wide  — full-width row, icon + label left, accessory right
 *   hero  — tall feature cell with an eyebrow, big label and optional pill
 */
export default function BentoTile({
  label,
  subtitle,
  icon,
  onPress,
  hue,
  gradient,
  locations,
  backgroundColor,
  labelColor = "#ffffff",
  subtitleColor = "rgba(255,255,255,0.72)",
  borderColor = "rgba(255,255,255,0.10)",
  height,
  variant = "grid",
  disabled = false,
  rightAccessory,
  secondaryAction,
  style,
  testID,
  accessibilityLabel,
}) {
  const { isDark } = useTheme();
  const radius = variant === "hero" ? 22 : 20;
  const fill = gradient ?? (hue ? getGradient(hue, isDark) : null);

  const content = ({ pressed }) => (
    <>
      {variant === "wide" ? (
        <View style={styles.wideRow}>
          <View style={styles.wideLeft}>
            {icon}
            <View>
              <Text style={[styles.wideLabel, { color: labelColor }]}>{label}</Text>
              {subtitle ? (
                <Text style={[styles.wideSubtitle, { color: subtitleColor }]}>{subtitle}</Text>
              ) : null}
            </View>
          </View>
          {rightAccessory}
        </View>
      ) : variant === "hero" ? (
        <View style={styles.heroOuter}>
          <View style={styles.heroRow}>
            <View style={styles.heroText}>
              {subtitle ? (
                <Text style={[styles.eyebrow, { color: subtitleColor }]}>{subtitle}</Text>
              ) : null}
              <Text style={[styles.heroLabel, { color: labelColor }]}>{label}</Text>
            </View>
            {icon}
          </View>
          {/* Space for the pill, which is rendered as a sibling of this tile —
              see the note on the return below. */}
          {secondaryAction ? <View style={styles.pillSpacer} /> : null}
        </View>
      ) : (
        <View style={styles.gridColumn}>
          {icon}
          <View>
            <Text style={[styles.gridLabel, { color: labelColor }]}>{label}</Text>
            {subtitle ? (
              <Text style={[styles.gridSubtitle, { color: subtitleColor }]} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      )}
      {pressed && !disabled && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: "rgba(0,0,0,0.16)", borderRadius: radius },
          ]}
        />
      )}
    </>
  );

  const tileBase = ({ pressed }) => ({
    borderRadius: radius,
    borderColor,
    height,
    opacity: disabled ? 0.5 : 1,
    transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
  });

  const outerStyle = (state) => [styles.tile, tileBase(state), style];

  // When the pill is a sibling, the wrapper carries the caller's `style` (and
  // therefore the width), and the tile just fills it.
  const outerStyleNested = (state) => [styles.tile, tileBase(state), styles.tileFill];

  const tile = (
    <Pressable
      testID={testID ?? `tile-${label?.replace(/\s+/g, "-").toLowerCase()}`}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      disabled={disabled}
      style={secondaryAction ? outerStyleNested : outerStyle}
    >
      {({ pressed }) =>
        fill ? (
          <LinearGradient
            colors={fill}
            locations={locations}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, styles.fill]}
          >
            {content({ pressed })}
          </LinearGradient>
        ) : (
          <View style={[StyleSheet.absoluteFillObject, styles.fill, { backgroundColor }]}>
            {content({ pressed })}
          </View>
        )
      }
    </Pressable>
  );

  if (!secondaryAction) return tile;

  // The pill is a *sibling* of the tile, not a child, and is positioned over
  // it. Nesting it would put a <button> inside a <button> on web: invalid HTML
  // that browsers recover from unpredictably and that breaks tab order and
  // screen-reader activation.
  return (
    <View style={[styles.nestedWrap, style]}>
      {tile}
      <Pressable
        testID={`tile-${secondaryAction.label?.replace(/\s+/g, "-").toLowerCase()}`}
        accessibilityRole="button"
        accessibilityLabel={secondaryAction.label}
        hitSlop={8}
        onPress={secondaryAction.onPress}
        style={({ pressed }) => [styles.pill, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Text style={styles.pillLabel}>{secondaryAction.label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderWidth: 1,
    overflow: "hidden",
  },
  fill: {
    padding: 14,
    justifyContent: "center",
  },
  heroOuter: {
    flex: 1,
    justifyContent: "space-between",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nestedWrap: { position: "relative" },
  tileFill: { width: "100%" },
  pillSpacer: { height: 34 },
  pill: {
    position: "absolute",
    left: 14,
    bottom: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  heroText: {
    gap: 4,
    flexShrink: 1,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroLabel: {
    fontSize: 20,
    fontWeight: "800",
  },
  gridColumn: {
    flex: 1,
    justifyContent: "space-between",
  },
  gridLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 10,
  },
  gridSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  wideRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  wideLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  wideLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  wideSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
});
