import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../src/theme/ThemeProvider";
import { getWash } from "../src/theme/gradients";
import useLibraryStore from "../src/stores/useLibraryStore";
import ScreenHeader from "../src/components/ScreenHeader";
import QrPreview from "../src/components/QrPreview";
import AppButton from "../src/components/AppButton";
import Icon from "../src/components/icons/QrIcons";
import { getQrType } from "../src/utils/qrPayloads";
import { confirm } from "../src/utils/crossPlatformAlert";

/**
 * Saved — the library of codes the user kept.
 *
 * Each row redraws its code from the stored values rather than showing a cached
 * image, so a row always reflects the current renderer. The thumbnails are
 * rendered small and with warnings suppressed; a contrast note next to a 96px
 * thumbnail would be noise, and the generator screen already says it.
 */
export default function SavedScreen() {
  const router = useRouter();
  const { tokens, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const codes = useLibraryStore((s) => s.codes);
  const loading = useLibraryStore((s) => s.loading);
  const error = useLibraryStore((s) => s.error);
  const deleteCode = useLibraryStore((s) => s.deleteCode);
  const duplicateCode = useLibraryStore((s) => s.duplicateCode);
  const saveTemplate = useLibraryStore((s) => s.saveTemplate);

  const wide = width >= 760;

  const handleDelete = (code) => {
    confirm(
      "Delete this code?",
      `“${code.name}” will be removed from this device.`,
      () => deleteCode(code.id),
      { confirmLabel: "Delete", destructive: true }
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: tokens.background }]}>
      <ScreenHeader
        title="Saved codes"
        subtitle={codes.length ? `${codes.length} on this device` : undefined}
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 32 },
          wide && styles.scrollWide,
        ]}
      >
        {error ? (
          <View style={[styles.notice, { borderColor: tokens.warning }]}>
            <Text style={[styles.noticeText, { color: tokens.warning }]}>
              Local storage is unavailable, so codes cannot be saved on this device. Generating and
              exporting still work. ({error})
            </Text>
          </View>
        ) : null}

        {!codes.length && !loading ? (
          <View style={styles.empty}>
            <Icon name="folder" size={40} color={tokens.textMuted} />
            <Text style={[styles.emptyTitle, { color: tokens.text }]}>Nothing saved yet</Text>
            <Text style={[styles.emptyBody, { color: tokens.textMuted }]}>
              Save a code from the generator and it will wait here for you — styling and all.
            </Text>
            <AppButton label="Create a code" onPress={() => router.replace("/")} />
          </View>
        ) : null}

        <View style={[styles.list, wide && styles.listWide]}>
          {codes.map((code) => {
            const type = getQrType(code.type);
            return (
              // The open target and the row actions are siblings, never nested:
              // a <button> inside a <button> is invalid HTML on web and breaks
              // both tab order and screen-reader activation.
              <View
                key={code.id}
                style={[
                  styles.card,
                  { backgroundColor: tokens.surface, borderColor: tokens.border },
                  wide && styles.cardWide,
                ]}
              >
                <LinearGradient
                  colors={getWash(tokens.surface, tokens.PrimaryColor, isDark)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardFill}
                >
                  <Pressable
                    testID={`saved-${code.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${code.name}`}
                    onPress={() => router.push(`/generate/${code.type}?id=${code.id}`)}
                    style={({ pressed }) => [styles.cardMain, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    <View style={styles.thumb}>
                      <QrPreview
                        data={code.payload}
                        style={{ ...code.style, size: 96, quietZone: 6, frameStyle: "none" }}
                        showWarnings={false}
                      />
                    </View>

                    <View style={styles.cardBody}>
                      <Text style={[styles.cardTitle, { color: tokens.text }]} numberOfLines={1}>
                        {code.name}
                      </Text>
                      <Text style={[styles.cardType, { color: tokens.PrimaryColor }]}>
                        {type?.label ?? code.type}
                      </Text>
                      <Text style={[styles.cardPayload, { color: tokens.textMuted }]} numberOfLines={2}>
                        {code.payload}
                      </Text>
                    </View>
                  </Pressable>

                  <View style={styles.cardActions}>
                    <SmallAction
                      icon="copy"
                      label="Duplicate"
                      onPress={() => duplicateCode(code.id)}
                    />
                    <SmallAction
                      icon="bookmark"
                      label="Save as template"
                      onPress={() =>
                        saveTemplate({ name: `${code.name} style`, type: code.type, style: code.style })
                      }
                    />
                    <SmallAction
                      icon="trash"
                      label="Delete"
                      danger
                      onPress={() => handleDelete(code)}
                    />
                  </View>
                </LinearGradient>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function SmallAction({ icon, label, onPress, danger }) {
  const { tokens } = useTheme();
  const color = danger ? tokens.danger : tokens.textMuted;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.smallAction, { borderColor: color, opacity: pressed ? 0.6 : 1 }]}
    >
      <Icon name={icon} size={13} color={color} />
      <Text style={[styles.smallActionLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { padding: 16, gap: 12 },
  scrollWide: { alignSelf: "center", width: "100%", maxWidth: 1100 },
  list: { gap: 12 },
  listWide: { flexDirection: "row", flexWrap: "wrap" },
  card: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  cardWide: { width: "48.5%" },
  cardFill: { padding: 14, gap: 10 },
  cardMain: { flexDirection: "row", gap: 14 },
  thumb: { alignSelf: "flex-start" },
  cardBody: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardType: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  cardPayload: { fontSize: 11, lineHeight: 15, marginTop: 2 },
  cardActions: { flexDirection: "row", gap: 8 },
  smallAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  smallActionLabel: { fontSize: 11, fontWeight: "600" },
  empty: { alignItems: "center", gap: 10, paddingVertical: 60, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptyBody: { fontSize: 13, textAlign: "center", lineHeight: 19, marginBottom: 8, maxWidth: 320 },
  notice: { borderWidth: 1, borderRadius: 12, padding: 12 },
  noticeText: { fontSize: 12, lineHeight: 17 },
});
