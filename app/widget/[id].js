import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "../../src/theme/ThemeProvider";
import ScreenHeader from "../../src/components/ScreenHeader";
import WidgetSetup from "../../src/widgets/WidgetSetup";
import { WIDGET_NAMES } from "../../src/widgets/widgetNames";
import { redrawWidget } from "../../src/services/widgetSync";
import { isAndroid } from "../../src/utils/platform";

/**
 * Widget setup, inside the app — where a tile with nothing to show sends the
 * user (xegqr://widget/<widgetId>?name=<provider>): one whose code was deleted,
 * or one pinned without going through the launcher's configuration screen.
 *
 * Both parameters come from the tile and are validated before use: the id must
 * be an integer and the name one of the providers in app.config.js.
 */
export default function WidgetSetupRoute() {
  const { id, name } = useLocalSearchParams();
  const router = useRouter();
  const { tokens } = useTheme();

  const widgetId = /^\d+$/.test(String(id ?? "")) ? Number(id) : null;
  const widgetName = WIDGET_NAMES.includes(String(name)) ? String(name) : null;

  const leave = () => (router.canGoBack() ? router.back() : router.replace("/"));

  if (!isAndroid || widgetId === null || !widgetName) {
    return (
      <View style={[styles.screen, { backgroundColor: tokens.background }]}>
        <ScreenHeader title="Home-screen widget" onBack={leave} />
        <View style={styles.centered}>
          <Text style={[styles.body, { color: tokens.textMuted }]}>
            This link sets up an XegQR home-screen tile. Tiles are only available in the Android app.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <WidgetSetup
      widgetId={widgetId}
      widgetName={widgetName}
      onSaved={async (binding) => {
        try {
          await redrawWidget(widgetId, binding);
        } catch (e) {
          console.warn("[widgets] redraw failed:", e?.message);
        }
        leave();
      }}
      onCancel={leave}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  body: { fontSize: 14, lineHeight: 20, textAlign: "center", maxWidth: 340 },
});
