import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeepAwake } from "expo-keep-awake";
import { useTheme } from "../../src/theme/ThemeProvider";
import useSettingsStore from "../../src/stores/useSettingsStore";
import * as savedCodes from "../../src/db/repositories/savedCodeRepository";
import QrPreview from "../../src/components/QrPreview";
import AppButton from "../../src/components/AppButton";
import Icon from "../../src/components/icons/QrIcons";
import useBrightnessBoost from "../../src/hooks/useBrightnessBoost";
import { getQrType } from "../../src/utils/qrPayloads";
import { DEFAULT_STYLE } from "../../src/utils/qrStyleOptions";
import { isNativeApp } from "../../src/utils/platform";

// The Wake Lock API behind expo-keep-awake is missing from several browsers and
// rejects there, so keeping the screen on is native-only. Chosen once at module
// load, so the hook order never changes between renders.
const useKeepScreenOn = isNativeApp ? useKeepAwake : () => {};

const MIN_QUIET_ZONE = 16;
const CARD_PADDING = 14;

/**
 * Show — one saved code, as large as the screen allows, ready to be scanned.
 *
 * This is where a home-screen tile lands (xegqr://show/<id>). The code is read
 * straight from the repository rather than the library store: on a cold start
 * from a tile, the store may not have loaded yet.
 *
 * The id is only ever used to look a record up; it is never interpolated into
 * anything. A link for a code that no longer exists gets a plain explanation.
 */
export default function ShowCodeScreen() {
  const { id } = useLocalSearchParams();
  const codeId = String(id ?? "");
  const router = useRouter();
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const boostEnabled = useSettingsStore((s) => s.boostBrightness);

  const [state, setState] = useState({ status: "loading", code: null, error: null });

  useEffect(() => {
    let alive = true;
    setState({ status: "loading", code: null, error: null });
    savedCodes.get(codeId).then(
      (code) => {
        if (alive) setState({ status: code ? "ready" : "missing", code, error: null });
      },
      (e) => {
        if (alive) setState({ status: "error", code: null, error: e?.message ?? "Storage unavailable" });
      }
    );
    return () => {
      alive = false;
    };
  }, [codeId]);

  useBrightnessBoost(boostEnabled && state.status === "ready");
  useKeepScreenOn();

  // Arriving from a tile on a cold start leaves nothing to go back to.
  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));

  const closeButton = (
    <Pressable
      testID="show-close"
      accessibilityRole="button"
      accessibilityLabel="Close"
      hitSlop={10}
      onPress={close}
      style={({ pressed }) => [
        styles.close,
        { backgroundColor: tokens.surface, borderColor: tokens.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Icon name="close" size={20} color={tokens.text} />
    </Pressable>
  );

  let body;
  if (state.status === "loading") {
    body = <ActivityIndicator color={tokens.PrimaryColor} />;
  } else if (state.status === "missing" || state.status === "error") {
    const missing = state.status === "missing";
    body = (
      <View style={styles.message}>
        <Icon name={missing ? "trash" : "shield"} size={40} color={tokens.textMuted} />
        <Text style={[styles.messageTitle, { color: tokens.text }]}>
          {missing ? "This code was deleted" : "This code could not be opened"}
        </Text>
        <Text style={[styles.messageBody, { color: tokens.textMuted }]}>
          {missing
            ? "It is no longer saved on this device."
            : `Local storage is unavailable on this device. (${state.error})`}
        </Text>
        <AppButton label="Go to saved codes" onPress={() => router.replace("/saved")} />
      </View>
    );
  } else {
    const code = state.code;
    const type = getQrType(code.type);
    const style = { ...DEFAULT_STYLE, ...(code.style ?? {}) };
    const quietZone = Math.max(style.quietZone ?? 0, MIN_QUIET_ZONE);

    // Biggest square that fits, leaving room for the title above and the note
    // below. The extra 12 covers the stroke some frame styles draw outside the
    // symbol.
    const usableHeight = height - insets.top - insets.bottom - 220;
    const edge = Math.min(width - 40, usableHeight, 560);
    const symbolSize = Math.max(160, Math.round(edge - 2 * quietZone - 2 * CARD_PADDING - 12));

    body = (
      <View style={styles.ready}>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: tokens.text }]} numberOfLines={2}>
            {code.name}
          </Text>
          <Text style={[styles.type, { color: tokens.PrimaryColor }]}>{type?.label ?? code.type}</Text>
        </View>

        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={`QR code for ${code.name}`}
          style={[styles.card, { backgroundColor: style.backgroundColor, padding: CARD_PADDING }]}
        >
          <QrPreview
            data={code.payload}
            style={{ ...style, size: symbolSize, quietZone }}
            showWarnings={false}
          />
        </View>

        <Text style={[styles.note, { color: tokens.textMuted }]}>
          {boostEnabled && isNativeApp
            ? "Screen brightness is turned up while this code is showing."
            : "Hold the screen up to the scanner."}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: tokens.background, paddingTop: insets.top + 10, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <View style={styles.topBar}>{closeButton}</View>
      <View style={styles.content}>{body}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 16 },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  ready: { alignItems: "center", gap: 18, width: "100%" },
  titleBlock: { alignItems: "center", gap: 4, maxWidth: 560 },
  title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3, textAlign: "center" },
  type: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  card: { borderRadius: 24, alignItems: "center", justifyContent: "center" },
  note: { fontSize: 12, textAlign: "center", maxWidth: 320 },
  message: { alignItems: "center", gap: 10, maxWidth: 340 },
  messageTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  messageBody: { fontSize: 13, lineHeight: 19, textAlign: "center", marginBottom: 8 },
});
