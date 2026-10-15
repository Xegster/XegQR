import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";
import * as savedCodes from "../db/repositories/savedCodeRepository";
import ScreenHeader from "../components/ScreenHeader";
import Panel from "../components/Panel";
import AppButton from "../components/AppButton";
import Icon from "../components/icons/QrIcons";
import { getQrType } from "../utils/qrPayloads";
import { alert } from "../utils/crossPlatformAlert";
import TilePreview from "./TilePreview";
import { getBinding, saveBinding } from "./widgetBindings";
import { DEFAULT_ICON_ID, TILE_ICONS, getTileIcon } from "./tileIcons";

// Roughly what a launcher gives a 1x1 widget on a typical phone, in dp.
const PREVIEW_SIZE = 88;

/**
 * The record QrTile renders from. The label is the code's name; the tile shows
 * no text, so it only serves as the tile's spoken description.
 */
function bindingFor(iconId, code, widgetName) {
  return {
    widgetName,
    codeId: code.id,
    codeType: code.type,
    label: code.name,
    iconId,
    removed: false,
  };
}

/**
 * WidgetSetup — choose the code a home-screen tile opens, and the icon it shows.
 *
 * Shared by the widget library's configuration screen (shown when a tile is
 * added, or long-pressed to edit) and the in-app route a tile opens when it has
 * nothing to show. The host decides what happens after saving: the config
 * screen hands the tile to the launcher, the route redraws it.
 *
 * Codes are read from the repository, not the library store, because the
 * configuration screen is its own React root and may run before the app has
 * ever loaded.
 */
export default function WidgetSetup({ widgetId, widgetName, onSaved, onCancel }) {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();

  const [codes, setCodes] = useState(null);
  const [error, setError] = useState(null);
  const [codeId, setCodeId] = useState(null);
  const [iconId, setIconId] = useState(DEFAULT_ICON_ID);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [list, existing] = await Promise.all([savedCodes.list(), getBinding(widgetId)]);
        if (!alive) return;
        setCodes(list);
        if (!list.length) return;

        // An existing tile keeps its icon. If its code is gone it keeps the icon
        // and is pointed at another code.
        if (existing) setIconId(getTileIcon(existing.iconId).id);
        const current = existing ? list.find((c) => c.id === existing.codeId) : null;
        setCodeId((current ?? list[0]).id);
      } catch (e) {
        if (!alive) return;
        setCodes([]);
        setError(e?.message ?? "Storage unavailable");
      }
    })();
    return () => {
      alive = false;
    };
  }, [widgetId]);

  const code = useMemo(() => codes?.find((c) => c.id === codeId) ?? null, [codes, codeId]);
  const binding = useMemo(
    () => (code ? bindingFor(iconId, code, widgetName) : null),
    [iconId, code, widgetName]
  );

  const handleSave = async () => {
    if (!binding) return;
    setSaving(true);
    try {
      const record = await saveBinding(widgetId, binding);
      await onSaved(record);
    } catch (e) {
      setSaving(false);
      alert("Could not save the tile", e?.message ?? "Something went wrong.");
    }
  };

  const header = <ScreenHeader title="Home-screen tile" subtitle="Choose a code and an icon" onBack={onCancel} />;

  if (codes === null) {
    return (
      <View style={[styles.screen, styles.centered, { backgroundColor: tokens.background }]}>
        <ActivityIndicator color={tokens.PrimaryColor} />
      </View>
    );
  }

  if (!codes.length || !code) {
    return (
      <View style={[styles.screen, { backgroundColor: tokens.background }]}>
        {header}
        <View style={styles.empty}>
          <Icon name="folder" size={40} color={tokens.textMuted} />
          <Text style={[styles.emptyTitle, { color: tokens.text }]}>
            {error ? "Saved codes are unavailable" : "No saved codes yet"}
          </Text>
          <Text style={[styles.emptyBody, { color: tokens.textMuted }]}>
            {error
              ? `Local storage could not be opened. (${error})`
              : "A tile opens one of your saved codes. Save a code in XegQR first, then set up the tile."}
          </Text>
          <AppButton label="Close" variant="outline" onPress={onCancel} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: tokens.background }]}>
      {header}

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Panel contentStyle={styles.previewBody}>
          <TilePreview binding={binding} widgetId={widgetId} widgetName={widgetName} size={PREVIEW_SIZE} />
          <Text style={[styles.hint, { color: tokens.textMuted }]}>
            Tapping the tile opens this code full screen, ready to scan.
          </Text>
        </Panel>

        <Panel
          title="Code"
          subtitle="What the tile opens"
          icon={<Icon name="qr" size={18} color={tokens.PrimaryColor} />}
        >
          <View style={styles.codeList}>
            {codes.map((c) => (
              <CodeRow key={c.id} code={c} selected={c.id === codeId} onPress={() => setCodeId(c.id)} />
            ))}
          </View>
        </Panel>

        <Panel
          title="Icon"
          subtitle="The tile shows only this picture, never the code or its name"
          icon={<Icon name="image" size={18} color={tokens.PrimaryColor} />}
        >
          <View style={styles.iconList} testID="widget-icon">
            {TILE_ICONS.map((option) => (
              <IconChoice
                key={option.id}
                option={option}
                selected={option.id === iconId}
                onPress={() => setIconId(option.id)}
              />
            ))}
          </View>
        </Panel>

        <View style={styles.actions}>
          <AppButton
            label="Save tile"
            onPress={handleSave}
            disabled={saving}
            icon={<Icon name="check" size={16} color="#ffffff" />}
            style={styles.action}
          />
          <AppButton label="Cancel" variant="outline" onPress={onCancel} style={styles.action} />
        </View>
      </ScrollView>
    </View>
  );
}

function IconChoice({ option, selected, onPress }) {
  const { tokens } = useTheme();
  return (
    <Pressable
      testID={`widget-icon-${option.id}`}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${option.label} icon`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconChoice,
        {
          borderColor: selected ? tokens.PrimaryColor : tokens.border,
          borderWidth: selected ? 2 : 1,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Image source={option.image} style={styles.iconImage} />
      <Text style={[styles.iconLabel, { color: selected ? tokens.PrimaryColor : tokens.textMuted }]}>
        {option.label}
      </Text>
    </Pressable>
  );
}

function CodeRow({ code, selected, onPress }) {
  const { tokens, isDark } = useTheme();
  const type = getQrType(code.type);
  return (
    <Pressable
      testID={`widget-code-${code.id}`}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={code.name}
      onPress={onPress}
      style={({ pressed }) => [
        styles.codeRow,
        {
          backgroundColor: isDark ? tokens.surfaceAlt : tokens.background,
          borderColor: selected ? tokens.PrimaryColor : tokens.border,
          borderWidth: selected ? 2 : 1,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Icon name={type?.icon ?? "qr"} size={18} color={selected ? tokens.PrimaryColor : tokens.textMuted} />
      <View style={styles.codeText}>
        <Text style={[styles.codeName, { color: tokens.text }]} numberOfLines={1}>
          {code.name}
        </Text>
        <Text style={[styles.codeType, { color: tokens.textMuted }]}>{type?.label ?? code.type}</Text>
      </View>
      {selected ? <Icon name="check" size={18} color={tokens.PrimaryColor} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { alignItems: "center", justifyContent: "center" },
  scroll: { padding: 16, gap: 12, alignSelf: "center", width: "100%", maxWidth: 720 },
  previewBody: { alignItems: "center", gap: 10 },
  hint: { fontSize: 12, textAlign: "center" },
  codeList: { gap: 8 },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  codeText: { flex: 1 },
  codeName: { fontSize: 14, fontWeight: "600" },
  codeType: { fontSize: 11, marginTop: 1 },
  iconList: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  iconChoice: { alignItems: "center", gap: 6, borderRadius: 14, padding: 8 },
  iconImage: { width: 64, height: 64 },
  iconLabel: { fontSize: 11, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 10 },
  action: { flex: 1 },
  empty: { alignItems: "center", gap: 10, paddingVertical: 60, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptyBody: { fontSize: 13, textAlign: "center", lineHeight: 19, marginBottom: 8, maxWidth: 320 },
});
