import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Panel from "./Panel";
import AppButton from "./AppButton";
import ThemedTextInput from "./ThemedTextInput";
import Icon from "./icons/QrIcons";
import { useTheme } from "../theme/ThemeProvider";

/**
 * TemplatePanel — save the current style as a reusable template, or apply one
 * saved earlier. Templates carry style only (colours, shapes, logo, frame,
 * encoding) — never a code's content — so applying one never touches whatever
 * is already typed into the fields above.
 */
export default function TemplatePanel({ templates = [], onSave, onApply, onDelete }) {
  const { tokens, isDark } = useTheme();
  const [name, setName] = useState("");

  const handleSave = () => {
    onSave(name.trim());
    setName("");
  };

  return (
    <Panel
      title="Templates"
      subtitle="Save this look, or apply one you saved before"
      icon={<Icon name="bookmark" size={18} color={tokens.PrimaryColor} />}
      collapsible
      defaultOpen={false}
    >
      <View style={styles.saveRow}>
        <ThemedTextInput
          testID="template-name"
          value={name}
          onChangeText={setName}
          placeholder="Name this template — one is chosen for you"
          style={styles.saveInput}
        />
        <AppButton
          testID="template-save"
          label="Save"
          size="sm"
          onPress={handleSave}
          icon={<Icon name="save" size={14} color="#ffffff" />}
        />
      </View>

      {templates.length ? (
        <View style={styles.chipRow}>
          {templates.map((t) => (
            <View
              key={t.id}
              style={[
                styles.chip,
                { borderColor: tokens.border, backgroundColor: isDark ? tokens.surfaceAlt : tokens.background },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Apply template ${t.name}`}
                onPress={() => onApply(t)}
                style={({ pressed }) => [styles.chipMain, { opacity: pressed ? 0.7 : 1 }]}
              >
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: t.style?.color ?? "#000000", borderColor: tokens.border },
                  ]}
                />
                <Text style={[styles.chipLabel, { color: tokens.text }]} numberOfLines={1}>
                  {t.name}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete template ${t.name}`}
                hitSlop={8}
                onPress={() => onDelete(t.id)}
                style={styles.chipDelete}
              >
                <Icon name="close" size={11} color={tokens.textMuted} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[styles.empty, { color: tokens.textMuted }]}>
          No templates saved yet. Style a code the way you like, then save it above.
        </Text>
      )}
    </Panel>
  );
}

const styles = StyleSheet.create({
  saveRow: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  saveInput: { flex: 1 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 100,
    paddingLeft: 6,
    paddingRight: 10,
    paddingVertical: 6,
    gap: 6,
    maxWidth: 220,
  },
  chipMain: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  swatch: { width: 16, height: 16, borderRadius: 8, borderWidth: 1 },
  chipLabel: { fontSize: 12, fontWeight: "600", flexShrink: 1 },
  chipDelete: { marginLeft: 2, padding: 2 },
  empty: { fontSize: 12, lineHeight: 17 },
});
