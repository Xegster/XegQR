import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "../theme/ThemeProvider";
import useSettingsStore from "../stores/useSettingsStore";
import WidgetSetup from "./WidgetSetup";
import { renderTile } from "./QrTile";

/**
 * WidgetConfigScreen — the widget library's configuration screen, shown in its
 * own Android activity when a tile is added or long-pressed to edit.
 *
 * It is a separate React root, outside expo-router and app/_layout.js, so it
 * sets up its own providers and hydrates settings itself (for the theme).
 * Saving draws the tile and tells the launcher it can be placed; cancelling a
 * first-time setup makes the launcher drop the tile again.
 */
export default function WidgetConfigScreen({ widgetInfo, renderWidget, setResult }) {
  const hydrate = useSettingsStore((s) => s.hydrate);
  const hydrated = useSettingsStore((s) => s.hydrated);
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const isDark = theme === "Night";
  const background = isDark ? "#0d0d10" : "#f4f4f7";

  return (
    <SafeAreaProvider>
      <ThemeProvider initialTheme={theme}>
        <StatusBar style={isDark ? "light" : "dark"} />
        {hydrated ? (
          <WidgetSetup
            widgetId={widgetInfo.widgetId}
            widgetName={widgetInfo.widgetName}
            onSaved={(binding) => {
              renderWidget(renderTile(binding, widgetInfo));
              setResult("ok");
            }}
            onCancel={() => setResult("cancel")}
          />
        ) : (
          <View style={[styles.splash, { backgroundColor: background }]}>
            <ActivityIndicator color="#6d5efc" />
          </View>
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: "center", justifyContent: "center" },
});
