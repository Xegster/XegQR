import React, { useEffect } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "../src/theme/ThemeProvider";
import useSettingsStore from "../src/stores/useSettingsStore";
import useLibraryStore from "../src/stores/useLibraryStore";

/**
 * RootLayout — providers, startup hydration, and the stack.
 *
 * Startup order matters: settings hydrate first (they decide the theme, so
 * rendering before they land would flash the wrong one), and the library loads
 * in the background because nothing on the home screen needs it.
 *
 * There is no auth here, unlike the sibling apps — no sign-in gate, no sync
 * bootstrap, nothing to wait on but local storage.
 */
export default function RootLayout() {
  const hydrate = useSettingsStore((s) => s.hydrate);
  const hydrated = useSettingsStore((s) => s.hydrated);
  const theme = useSettingsStore((s) => s.theme);
  const loadLibrary = useLibraryStore((s) => s.load);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated) loadLibrary();
  }, [hydrated, loadLibrary]);

  const isDark = theme === "Night";
  const background = isDark ? "#0d0d10" : "#f4f4f7";

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider initialTheme={theme}>
          <StatusBar style={isDark ? "light" : "dark"} />
          {hydrated ? (
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: background },
                animation: "slide_from_right",
              }}
            />
          ) : (
            <View style={[styles.splash, { backgroundColor: background }]}>
              <ActivityIndicator color="#6d5efc" />
            </View>
          )}
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: { flex: 1, alignItems: "center", justifyContent: "center" },
});
