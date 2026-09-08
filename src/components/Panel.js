import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../theme/ThemeProvider";
import { getWash } from "../theme/gradients";
import Icon from "./icons/QrIcons";

/**
 * Panel — the themed card that groups controls on a screen.
 *
 * Uses the NetXeg GradientRowCard "wash" idea for its header: a low-alpha
 * accent gradient over the surface colour, which ties panels to the bento tiles
 * without competing with them.
 *
 * Pass `collapsible` for the long style-control sections; a collapsed panel
 * keeps the generator screen scannable when a type has fifteen fields.
 */
export default function Panel({
  title,
  subtitle,
  icon,
  children,
  collapsible = false,
  defaultOpen = true,
  right,
  style,
  contentStyle,
  testID,
}) {
  const { tokens, isDark } = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  const showBody = !collapsible || open;

  const header = (
    <View style={styles.headerRow}>
      {icon ? <View style={styles.headerIcon}>{icon}</View> : null}
      <View style={styles.headerText}>
        <Text style={[styles.title, { color: tokens.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: tokens.textMuted }]}>{subtitle}</Text>
        ) : null}
      </View>
      {right}
      {collapsible ? (
        <View style={{ transform: [{ rotate: open ? "90deg" : "0deg" }] }}>
          <Icon name="chevron" size={18} color={tokens.textMuted} />
        </View>
      ) : null}
    </View>
  );

  return (
    <View
      testID={testID}
      style={[
        styles.panel,
        { backgroundColor: tokens.surface, borderColor: tokens.border },
        style,
      ]}
    >
      {title ? (
        collapsible ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${open ? "Collapse" : "Expand"} ${title}`}
            onPress={() => setOpen((o) => !o)}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <LinearGradient
              colors={getWash(tokens.surface, tokens.PrimaryColor, isDark)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerFill}
            >
              {header}
            </LinearGradient>
          </Pressable>
        ) : (
          <LinearGradient
            colors={getWash(tokens.surface, tokens.PrimaryColor, isDark)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerFill}
          >
            {header}
          </LinearGradient>
        )
      ) : null}

      {showBody ? (
        <View style={[styles.body, !title && styles.bodyNoHeader, contentStyle]}>{children}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  headerFill: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: { opacity: 0.9 },
  headerText: { flex: 1 },
  title: { fontSize: 15, fontWeight: "700" },
  subtitle: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  body: { padding: 14, gap: 14 },
  bodyNoHeader: { paddingTop: 14 },
});
