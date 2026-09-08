import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { isValidHex, normalizeHex } from "../utils/color";

/**
 * ColorField — a swatch row plus a free-text hex box.
 *
 * No native colour-picker dependency: a picker would need separate web and
 * native implementations, and for QR codes the useful colour space is small
 * (high-contrast solids), so presets plus hex entry covers it.
 *
 * The text box keeps its own draft state so a half-typed "#ff" never propagates
 * upward as an invalid colour — it commits only once the value parses.
 */

export const SWATCHES = [
  "#000000", "#1f2937", "#6d5efc", "#4338ca", "#0ea5e9", "#22d3ee",
  "#059669", "#16a34a", "#eab308", "#f97316", "#e5484d", "#db2777",
  "#7c3aed", "#78350f", "#525252", "#ffffff",
];

export default function ColorField({
  label,
  value,
  onChange,
  allowInherit = false,
  inheritLabel = "Match body",
  hint,
  testID,
}) {
  const { tokens, isDark } = useTheme();
  const [draft, setDraft] = useState(value ?? "");

  // Re-sync when the value changes from outside (preset applied, style reset).
  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  const commit = (text) => {
    setDraft(text);
    if (isValidHex(text)) onChange(normalizeHex(text));
  };

  const isInherit = value === null || value === undefined;

  return (
    <View testID={testID}>
      {label ? <Text style={[styles.label, { color: tokens.textMuted }]}>{label}</Text> : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {allowInherit ? (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected: isInherit }}
            accessibilityLabel={inheritLabel}
            onPress={() => onChange(null)}
            style={({ pressed }) => [
              styles.inheritChip,
              {
                backgroundColor: isInherit ? tokens.PrimaryColor : isDark ? tokens.surfaceAlt : tokens.background,
                borderColor: isInherit ? tokens.PrimaryColor : tokens.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Text style={[styles.inheritLabel, { color: isInherit ? "#fff" : tokens.text }]}>
              {inheritLabel}
            </Text>
          </Pressable>
        ) : null}

        {SWATCHES.map((hex) => {
          const selected = !isInherit && normalizeHex(value ?? "") === hex;
          return (
            <Pressable
              key={hex}
              testID={`swatch-${hex}`}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`Colour ${hex}`}
              onPress={() => onChange(hex)}
              style={({ pressed }) => [
                styles.swatch,
                {
                  backgroundColor: hex,
                  borderColor: selected ? tokens.PrimaryColor : tokens.border,
                  borderWidth: selected ? 3 : 1,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            />
          );
        })}
      </ScrollView>

      <View
        style={[
          styles.hexWrap,
          { backgroundColor: isDark ? tokens.surfaceAlt : tokens.background, borderColor: tokens.border },
        ]}
      >
        <View
          style={[
            styles.preview,
            { backgroundColor: isInherit ? "transparent" : value, borderColor: tokens.border },
          ]}
        />
        <TextInput
          testID={testID ? `${testID}-hex` : undefined}
          value={isInherit ? "" : draft}
          onChangeText={commit}
          placeholder={isInherit ? inheritLabel : "#000000"}
          placeholderTextColor={tokens.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={7}
          style={[styles.hexInput, { color: tokens.text }]}
        />
      </View>

      {hint ? <Text style={[styles.hint, { color: tokens.textMuted }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: "600", marginBottom: 8, letterSpacing: 0.2 },
  row: { flexDirection: "row", gap: 8, paddingRight: 4, alignItems: "center" },
  swatch: { width: 30, height: 30, borderRadius: 15 },
  inheritChip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 100, borderWidth: 1 },
  inheritLabel: { fontSize: 12, fontWeight: "600" },
  hexWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    minHeight: 42,
  },
  preview: { width: 22, height: 22, borderRadius: 6, borderWidth: 1 },
  hexInput: { flex: 1, fontSize: 14, paddingVertical: 8 },
  hint: { fontSize: 11, marginTop: 5 },
});
