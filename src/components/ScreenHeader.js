import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";
import Icon from "./icons/QrIcons";

/**
 * ScreenHeader — the standard top bar: optional back chevron, title/subtitle,
 * optional right-hand accessory. Handles the status-bar inset itself so screens
 * never repeat that arithmetic.
 */
export default function ScreenHeader({ title, subtitle, onBack, right, style }) {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + 10,
          backgroundColor: tokens.background,
          borderBottomColor: tokens.border,
        },
        style,
      ]}
    >
      {onBack ? (
        <Pressable
          testID="header-back"
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
          onPress={onBack}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Icon name="back" size={22} color={tokens.text} />
        </Pressable>
      ) : null}

      <View style={styles.titleWrap}>
        <Text style={[styles.title, { color: tokens.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: tokens.textMuted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { padding: 2 },
  titleWrap: { flex: 1 },
  title: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  subtitle: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  right: { flexDirection: "row", alignItems: "center", gap: 8 },
});
