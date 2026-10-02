import React, { useState } from "react";
import { View, Text, ScrollView, Linking, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useTheme } from "../src/theme/ThemeProvider";
import ScreenHeader from "../src/components/ScreenHeader";
import Panel from "../src/components/Panel";
import AppButton from "../src/components/AppButton";
import Icon from "../src/components/icons/QrIcons";
import { copyToClipboard } from "../src/services/qrExport";
import { alert } from "../src/utils/crossPlatformAlert";
import { isWeb } from "../src/utils/platform";

/**
 * Scan — read a code with the camera.
 *
 * Uses expo-camera's own barcode scanning rather than pulling in a separate
 * decoder: on native it is already backed by the platform scanners (ZXing on
 * Android, Vision on iOS), so it costs no extra bundle. On web it depends on
 * the browser's BarcodeDetector, which Chrome and Edge have and Firefox and
 * Safari do not — hence the explicit note rather than a camera that silently
 * never fires a result.
 *
 * Scanning pauses on the first hit. A live camera that keeps re-firing the same
 * result makes the buttons below it unusable.
 */
export default function ScanScreen() {
  const router = useRouter();
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();

  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState(null);

  const webUnsupported =
    isWeb && typeof window !== "undefined" && !("BarcodeDetector" in window);

  const handleScanned = ({ data }) => {
    if (result) return;
    setResult(data);
  };

  const looksLikeUrl = result && /^(https?|mailto|tel|geo|sms|smsto|bitcoin|otpauth):/i.test(result);

  const openResult = async () => {
    try {
      await Linking.openURL(result);
    } catch {
      alert("Could not open", "This device has no app that handles that link.");
    }
  };

  const body = () => {
    if (webUnsupported) {
      return (
        <Panel title="Scanning isn't available in this browser">
          <Text style={[styles.body, { color: tokens.textMuted }]}>
            Reading codes on the web needs the BarcodeDetector API, which Chrome and Edge support but
            Firefox and Safari don't yet. The Android app scans on any device, and creating codes
            works everywhere.
          </Text>
          <AppButton label="Create a code instead" onPress={() => router.replace("/")} />
        </Panel>
      );
    }

    if (!permission) {
      return (
        <Panel title="Checking camera access">
          <Text style={[styles.body, { color: tokens.textMuted }]}>One moment…</Text>
        </Panel>
      );
    }

    if (!permission.granted) {
      return (
        <Panel title="Camera access needed" icon={<Icon name="camera" size={18} color={tokens.PrimaryColor} />}>
          <Text style={[styles.body, { color: tokens.textMuted }]}>
            XegQR needs the camera to read a code. Nothing is recorded or sent anywhere — the frame is
            decoded on the device and discarded.
          </Text>
          <AppButton label="Allow camera" onPress={requestPermission} />
        </Panel>
      );
    }

    return (
      <>
        <View style={[styles.cameraWrap, { borderColor: tokens.border }]}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={result ? undefined : handleScanned}
          />
          <View pointerEvents="none" style={styles.reticle}>
            <View style={[styles.reticleBox, { borderColor: tokens.PrimaryColor }]} />
          </View>
        </View>

        {result ? (
          <Panel title="Scanned" icon={<Icon name="check" size={18} color={tokens.success} />}>
            <Text style={[styles.result, { color: tokens.text }]} selectable>
              {result}
            </Text>
            <View style={styles.actions}>
              <AppButton
                label="Copy"
                variant="secondary"
                style={styles.action}
                onPress={async () => {
                  const r = await copyToClipboard(result);
                  alert(r.ok ? "Copied" : "Could not copy", r.ok ? "It's on your clipboard." : r.error);
                }}
              />
              {looksLikeUrl ? (
                <AppButton label="Open" variant="outline" style={styles.action} onPress={openResult} />
              ) : null}
              <AppButton
                label="Make my own"
                style={styles.action}
                onPress={() =>
                  router.push(`/generate/text?value=${encodeURIComponent(result)}`)
                }
              />
              <AppButton
                label="Scan again"
                variant="ghost"
                style={styles.action}
                onPress={() => setResult(null)}
              />
            </View>
          </Panel>
        ) : (
          <Text style={[styles.hint, { color: tokens.textMuted }]}>
            Point the camera at a QR code.
          </Text>
        )}
      </>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: tokens.background }]}>
      <ScreenHeader title="Scan a code" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
      >
        {body()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { padding: 16, gap: 14, alignSelf: "center", width: "100%", maxWidth: 620 },
  body: { fontSize: 13, lineHeight: 19 },
  cameraWrap: {
    height: 340,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  camera: { flex: 1 },
  reticle: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  reticleBox: {
    width: 200,
    height: 200,
    borderWidth: 3,
    borderRadius: 20,
    opacity: 0.9,
  },
  result: { fontSize: 13, lineHeight: 19 },
  hint: { fontSize: 13, textAlign: "center" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  action: { flexGrow: 1, minWidth: 100 },
});
