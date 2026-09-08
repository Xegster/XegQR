import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable, useWindowDimensions, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../src/theme/ThemeProvider";
import useSettingsStore from "../src/stores/useSettingsStore";
import useLibraryStore from "../src/stores/useLibraryStore";
import BentoTile from "../src/components/BentoTile";
import Icon from "../src/components/icons/QrIcons";
import { QR_TYPES } from "../src/utils/qrPayloads";

/**
 * Home — the bento grid of QR code types.
 *
 * Column count follows the viewport rather than the platform, so the website
 * fills a desktop window instead of rendering a phone layout in the middle of
 * it. Tile heights stay fixed while columns change, which is what keeps the
 * grid reading as a bento wall at every width.
 */

const GAP = 12;

function useColumns(width) {
  if (width < 420) return 2;
  if (width < 700) return 3;
  if (width < 1000) return 4;
  if (width < 1350) return 5;
  return 6;
}

export default function Home() {
  const router = useRouter();
  const { tokens, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const toggleTheme = useSettingsStore((s) => s.toggleTheme);
  const lastUsedType = useSettingsStore((s) => s.lastUsedType);
  const codes = useLibraryStore((s) => s.codes);

  // The content column is capped so a wide desktop window does not stretch
  // tiles into letterboxes.
  const contentWidth = Math.min(width, 1180) - 32;
  const columns = useColumns(width);
  const tileWidth = (contentWidth - GAP * (columns - 1)) / columns;

  const types = useMemo(() => {
    if (!lastUsedType) return QR_TYPES;
    // Float the last-used type to the front — it is overwhelmingly the one
    // wanted again next.
    const found = QR_TYPES.find((t) => t.id === lastUsedType);
    if (!found) return QR_TYPES;
    return [found, ...QR_TYPES.filter((t) => t.id !== lastUsedType)];
  }, [lastUsedType]);

  const heroType = types[0];

  return (
    <ScrollView
      style={{ backgroundColor: tokens.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32, maxWidth: 1180 },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <Icon name="qr" size={26} color={tokens.PrimaryColor} />
          <View>
            <Text style={[styles.brand, { color: tokens.text }]}>XegQR</Text>
            <Text style={[styles.tagline, { color: tokens.textMuted }]}>
              {QR_TYPES.length} code types · everything stays on your device
            </Text>
          </View>
        </View>

        <View style={styles.topActions}>
          <IconButton
            name={isDark ? "sun" : "moon"}
            label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            onPress={toggleTheme}
          />
          <IconButton name="settings" label="Settings" onPress={() => router.push("/settings")} />
        </View>
      </View>

      <BentoTile
        variant="hero"
        hue={heroType.gradient}
        subtitle={lastUsedType ? "Pick up where you left off" : "Start here"}
        label={heroType.label}
        icon={<Icon name={heroType.icon} size={34} color="#ffffff" />}
        height={148}
        onPress={() => router.push(`/generate/${heroType.id}`)}
        secondaryAction={{
          label: "Scan a code",
          onPress: () => router.push("/scan"),
        }}
        style={styles.fullWidth}
      />

      <View style={styles.row}>
        <BentoTile
          variant="wide"
          hue="indigo"
          label="Saved codes"
          subtitle={codes.length ? `${codes.length} saved` : "Nothing saved yet"}
          icon={<Icon name="folder" size={22} color="#ffffff" />}
          height={84}
          onPress={() => router.push("/saved")}
          style={styles.half}
        />
        <BentoTile
          variant="wide"
          hue="cyan"
          label="Scan"
          subtitle="Read a code with the camera"
          icon={<Icon name="camera" size={22} color="#ffffff" />}
          height={84}
          onPress={() => router.push("/scan")}
          style={styles.half}
        />
      </View>

      <Text style={[styles.sectionTitle, { color: tokens.textMuted }]}>Create a code</Text>

      <View style={styles.grid}>
        {types.map((type) => (
          <BentoTile
            key={type.id}
            hue={type.gradient}
            label={type.label}
            subtitle={type.blurb}
            icon={<Icon name={type.icon} size={24} color="#ffffff" />}
            height={116}
            style={{ width: tileWidth }}
            onPress={() => router.push(`/generate/${type.id}`)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function IconButton({ name, label, onPress }) {
  const { tokens } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={`home-${name}`}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: tokens.surface, borderColor: tokens.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Icon name={name} size={20} color={tokens.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: GAP, alignSelf: "center", width: "100%" },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    gap: 12,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 },
  brand: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  tagline: { fontSize: 12, marginTop: 1 },
  topActions: { flexDirection: "row", gap: 8 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: { width: "100%" },
  row: { flexDirection: "row", gap: GAP },
  half: { flex: 1 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 8,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
});
