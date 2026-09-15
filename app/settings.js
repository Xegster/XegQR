import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../src/theme/ThemeProvider";
import useSettingsStore from "../src/stores/useSettingsStore";
import useLibraryStore from "../src/stores/useLibraryStore";
import ScreenHeader from "../src/components/ScreenHeader";
import Panel from "../src/components/Panel";
import AppButton from "../src/components/AppButton";
import Icon from "../src/components/icons/QrIcons";
import { SegmentedControl, SwitchRow, StepperRow } from "../src/components/OptionRow";
import { ERROR_CORRECTION_LEVELS } from "../src/utils/qrStyleOptions";
import { formatBytes } from "../src/services/imageCache";
import { confirm } from "../src/utils/crossPlatformAlert";

const MB = 1024 * 1024;
const appVersion = Constants.expoConfig?.extra?.appVersion ?? Constants.expoConfig?.version;
const expoVersion = Constants.expoConfig?.version;

export default function SettingsScreen() {
  const router = useRouter();
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();

  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const defaultErrorCorrection = useSettingsStore((s) => s.defaultErrorCorrection);
  const setDefaultErrorCorrection = useSettingsStore((s) => s.setDefaultErrorCorrection);
  const cacheImages = useSettingsStore((s) => s.cacheImages);
  const setCacheImages = useSettingsStore((s) => s.setCacheImages);
  const perImageLimitBytes = useSettingsStore((s) => s.perImageLimitBytes);
  const setPerImageLimitBytes = useSettingsStore((s) => s.setPerImageLimitBytes);
  const totalCacheLimitBytes = useSettingsStore((s) => s.totalCacheLimitBytes);
  const setTotalCacheLimitBytes = useSettingsStore((s) => s.setTotalCacheLimitBytes);

  const images = useLibraryStore((s) => s.images);
  const usage = useLibraryStore((s) => s.usage);
  const deleteImage = useLibraryStore((s) => s.deleteImage);

  const clearImages = () => {
    confirm(
      "Remove all saved images?",
      `${images.length} image${images.length === 1 ? "" : "s"} will be deleted from this device. Codes that use them keep working until you close the app.`,
      async () => {
        for (const img of images) await deleteImage(img.id);
      },
      { confirmLabel: "Remove all", destructive: true }
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: tokens.background }]}>
      <ScreenHeader title="Settings" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}>
        <Panel
          title="Appearance"
          icon={<Icon name="palette" size={18} color={tokens.PrimaryColor} />}
        >
          <SegmentedControl
            label="Theme"
            testID="setting-theme"
            value={theme}
            options={[
              { value: "Night", label: "Dark" },
              { value: "Day", label: "Light" },
            ]}
            onChange={setTheme}
          />
        </Panel>

        <Panel
          title="Defaults"
          subtitle="Applied to each new code"
          icon={<Icon name="shield" size={18} color={tokens.PrimaryColor} />}
        >
          <SegmentedControl
            label="Error correction"
            testID="setting-ecc"
            value={defaultErrorCorrection}
            options={ERROR_CORRECTION_LEVELS.map((l) => ({ value: l.value, label: l.label }))}
            onChange={setDefaultErrorCorrection}
            hint="Higher levels survive damage and logos, at the cost of a denser code."
          />
        </Panel>

        <Panel
          title="Image cache"
          subtitle={`${usage.count} saved · ${formatBytes(usage.bytes)} used`}
          icon={<Icon name="image" size={18} color={tokens.PrimaryColor} />}
        >
          <SwitchRow
            testID="setting-cache"
            label="Save images for reuse"
            hint="Keeps logos you pick so you can use them again without finding the file."
            value={cacheImages}
            onValueChange={setCacheImages}
          />

          <StepperRow
            label="Largest image to save"
            testID="setting-per-image"
            value={perImageLimitBytes / MB}
            onChange={(v) => setPerImageLimitBytes(Math.round(v * MB))}
            min={0.5}
            max={10}
            step={0.5}
            format={(v) => `${v} MB`}
            hint="Bigger images still work — they just aren't kept."
          />

          <StepperRow
            label="Total cache size"
            testID="setting-total-cache"
            value={totalCacheLimitBytes / MB}
            onChange={(v) => setTotalCacheLimitBytes(Math.round(v * MB))}
            min={5}
            max={200}
            step={5}
            format={(v) => `${v} MB`}
            hint="Oldest images make way for new ones."
          />

          {images.length ? (
            <AppButton label="Remove all saved images" variant="destructiveOutline" onPress={clearImages} />
          ) : null}
        </Panel>

        <Panel title="About" icon={<Icon name="qr" size={18} color={tokens.PrimaryColor} />}>
          <Text style={[styles.body, { color: tokens.textMuted }]}>
            XegQR generates QR codes entirely on your device. There is no account, no server, and
            nothing you enter — WiFi passwords, contact details, authenticator secrets — ever leaves
            it.
          </Text>
          <Text style={[styles.body, { color: tokens.textMuted }]}>
            Saved codes and images live in this app's local storage. Uninstalling the app, or
            clearing the site data in your browser, removes them for good.
          </Text>
          <Text style={[styles.body, { color: tokens.textMuted }]}>
            App version {appVersion} · Expo {expoVersion}
          </Text>
        </Panel>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { padding: 16, gap: 12, alignSelf: "center", width: "100%", maxWidth: 720 },
  body: { fontSize: 13, lineHeight: 19 },
});
