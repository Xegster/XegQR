import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import Icon from "./icons/QrIcons";

const KEYBOARD_MAP = {
  email: "email-address",
  url: "url",
  numeric: "numeric",
  "phone-pad": "phone-pad",
};

/**
 * ThemedTextInput — labelled text field with theme tokens, optional hint and
 * error text, multiline support, and a reveal toggle for password fields.
 *
 * `keyboard` takes the schema-level name from qrPayloads (email/url/numeric/
 * phone-pad) and maps it to the RN keyboardType, so field definitions stay free
 * of platform vocabulary.
 */
export default function ThemedTextInput({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  error,
  multiline = false,
  secure = false,
  keyboard,
  required = false,
  autoCapitalize,
  testID,
  style,
}) {
  const { tokens, isDark } = useTheme();
  const [revealed, setRevealed] = useState(false);
  const [focused, setFocused] = useState(false);

  const hideText = secure && !revealed;
  const borderColor = error ? tokens.danger : focused ? tokens.PrimaryColor : tokens.border;

  return (
    <View style={style}>
      {label ? (
        <Text style={[styles.label, { color: tokens.textMuted }]}>
          {label}
          {required ? <Text style={{ color: tokens.danger }}> *</Text> : null}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: isDark ? tokens.surfaceAlt : tokens.background,
            borderColor,
          },
          multiline && styles.inputWrapMultiline,
        ]}
      >
        <TextInput
          testID={testID}
          value={String(value ?? "")}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={tokens.textMuted}
          secureTextEntry={hideText}
          multiline={multiline}
          keyboardType={KEYBOARD_MAP[keyboard] ?? "default"}
          autoCapitalize={autoCapitalize ?? (keyboard === "email" || keyboard === "url" ? "none" : "sentences")}
          autoCorrect={keyboard !== "email" && keyboard !== "url"}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, { color: tokens.text }, multiline && styles.inputMultiline]}
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Hide value" : "Show value"}
            hitSlop={10}
            onPress={() => setRevealed((r) => !r)}
            style={styles.reveal}
          >
            <Icon name={revealed ? "close" : "check"} size={16} color={tokens.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={[styles.hint, { color: tokens.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: tokens.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: "600", marginBottom: 6, letterSpacing: 0.2 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  inputWrapMultiline: { minHeight: 92, alignItems: "flex-start", paddingVertical: 8 },
  input: { flex: 1, fontSize: 15, paddingVertical: 8 },
  inputMultiline: { textAlignVertical: "top", minHeight: 76 },
  reveal: { paddingLeft: 8 },
  hint: { fontSize: 11, marginTop: 5 },
});
