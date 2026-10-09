import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeProvider";
import * as savedCodes from "../db/repositories/savedCodeRepository";
import ScreenHeader from "../components/ScreenHeader";
import Panel from "../components/Panel";
import ColorField from "../components/ColorField";
import ThemedTextInput from "../components/ThemedTextInput";
import AppButton from "../components/AppButton";
import Icon, { iconSvgMarkup } from "../components/icons/QrIcons";
import { SegmentedControl, StepperRow } from "../components/OptionRow";
import { GRADIENT_NAMES, getGradient } from "../theme/gradients";
import { getQrType } from "../utils/qrPayloads";
import { alert } from "../utils/crossPlatformAlert";
import TilePreview from "./TilePreview";
import { getBinding, saveBinding } from "./widgetBindings";
import { sizeForWidget } from "./widgetNames";
import {
  MIN_TILE_CONTRAST,
  backgroundStops,
  codeBackground,
  coloursFromSource,
  defaultTile,
  iconNameFor,
  minContrast,
  resolveTextColor,
  retargetTile,
  withFillType,
} from "./tileStyle";

// Roughly what a launcher gives a 2x1 and a 4x2 widget on a typical phone, in dp.
const PREVIEW_SIZE = {
  compact: { width: 200, height: 76 },
  large: { width: 320, height: 150 },
};

/** The style fields of a stored binding, back in the editable tile shape. */
function tileFromBinding(binding) {
  return {
    label: binding.label ?? "",
    customLabel: !!binding.customLabel,
    source: binding.source ?? "custom",
    background: binding.background,
    textColor: binding.autoTextColor ? null : binding.textColor ?? null,
    iconMode: binding.iconMode ?? "type",
    radius: Number.isFinite(binding.radius) ? binding.radius : 20,
  };
}

/**
 * The record QrTile renders from. Colours are resolved here, once, so the tile
 * never has to work anything out: text colour is stored resolved (with
 * `autoTextColor` remembering it was automatic), and the icon is stored as
 * finished SVG in that colour.
 */
function bindingFor(tile, code, widgetName) {
  const stops = backgroundStops(tile.background);
  const background = {
    type: tile.background?.type === "gradient" && stops.length >= 2 ? "gradient" : "solid",
    colors: stops,
  };
  const label = tile.label.trim();
  const textColor = resolveTextColor({ ...tile, background });
  const iconName = iconNameFor(tile.iconMode, code.type);
  return {
    widgetName,
    codeId: code.id,
    codeType: code.type,
    label: label || code.name,
    customLabel: !!label && label !== code.name,
    source: tile.source,
    background,
    textColor,
    autoTextColor: !tile.textColor,
    iconMode: tile.iconMode,
    iconSvg: iconName ? iconSvgMarkup(iconName, textColor) : null,
    radius: tile.radius,
    removed: false,
  };
}

function capitalise(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * WidgetSetup — choose the code a home-screen tile opens, and style the tile.
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
  const size = sizeForWidget(widgetName);

  const [codes, setCodes] = useState(null);
  const [error, setError] = useState(null);
  const [codeId, setCodeId] = useState(null);
  const [tile, setTile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [list, existing] = await Promise.all([savedCodes.list(), getBinding(widgetId)]);
        if (!alive) return;
        setCodes(list);
        if (!list.length) return;

        const current = existing ? list.find((c) => c.id === existing.codeId) : null;
        if (current) {
          setCodeId(current.id);
          setTile(tileFromBinding(existing));
        } else if (existing) {
          // Its code is gone: keep the styling, point it at another code.
          setCodeId(list[0].id);
          setTile(retargetTile(tileFromBinding(existing), list[0]));
        } else {
          setCodeId(list[0].id);
          setTile(defaultTile(list[0]));
        }
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
    () => (tile && code ? bindingFor(tile, code, widgetName) : null),
    [tile, code, widgetName]
  );

  const update = (changes) => setTile((t) => ({ ...t, ...changes }));
  const updateColours = (background) => update({ background, source: "custom" });

  const selectCode = (next) => {
    setCodeId(next.id);
    setTile((t) => retargetTile(t, next));
  };

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

  const header = (
    <ScreenHeader
      title={size === "large" ? "Large tile" : "Small tile"}
      subtitle="Home-screen widget"
      onBack={onCancel}
    />
  );

  if (codes === null) {
    return (
      <View style={[styles.screen, styles.centered, { backgroundColor: tokens.background }]}>
        <ActivityIndicator color={tokens.PrimaryColor} />
      </View>
    );
  }

  if (!codes.length || !tile || !code) {
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

  const type = getQrType(code.type);
  const stops = backgroundStops(tile.background);
  const isGradient = tile.background?.type === "gradient";
  const textColor = binding.textColor;
  const contrast = minContrast(textColor, binding.background);

  const sourceOptions = [
    { value: "code", label: "This code's colours", swatch: codeBackground(code).colors[0] },
    ...GRADIENT_NAMES.map((hue) => ({
      value: hue,
      label: capitalise(hue),
      swatch: getGradient(hue, false)[1],
    })),
  ];

  return (
    <View style={[styles.screen, { backgroundColor: tokens.background }]}>
      {header}

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Panel contentStyle={styles.previewBody}>
          <TilePreview
            binding={binding}
            widgetId={widgetId}
            widgetName={widgetName}
            width={PREVIEW_SIZE[size].width}
            height={PREVIEW_SIZE[size].height}
          />
          <Text style={[styles.hint, { color: tokens.textMuted }]}>
            Tapping the tile opens this code full screen, ready to scan.
          </Text>
          {contrast < MIN_TILE_CONTRAST ? (
            <Text style={[styles.warning, { color: tokens.warning }]}>
              Low contrast ({contrast.toFixed(1)}:1) — the label may be hard to read. Try a different
              text colour, or Automatic.
            </Text>
          ) : null}
        </Panel>

        <Panel
          title="Code"
          subtitle="What the tile opens"
          icon={<Icon name="qr" size={18} color={tokens.PrimaryColor} />}
        >
          <View style={styles.codeList}>
            {codes.map((c) => (
              <CodeRow key={c.id} code={c} selected={c.id === codeId} onPress={() => selectCode(c)} />
            ))}
          </View>
        </Panel>

        <Panel
          title="Label"
          subtitle="Shown on the home screen"
          icon={<Icon name="text" size={18} color={tokens.PrimaryColor} />}
        >
          <ThemedTextInput
            testID="widget-label"
            value={tile.label}
            onChangeText={(text) => update({ label: text, customLabel: !!text.trim() && text.trim() !== code.name })}
            placeholder={code.name}
            hint="Anyone who sees your home screen can read this. If the code's name gives something away, like a Wi-Fi network name, change it here."
          />
        </Panel>

        <Panel
          title="Colours"
          subtitle="Background, text and corners"
          icon={<Icon name="palette" size={18} color={tokens.PrimaryColor} />}
        >
          <SegmentedControl
            label="Start from"
            testID="widget-source"
            value={tile.source}
            options={sourceOptions}
            onChange={(source) => update({ source, ...coloursFromSource(source, code) })}
          />
          <SegmentedControl
            label="Fill"
            testID="widget-fill"
            value={isGradient ? "gradient" : "solid"}
            options={[
              { value: "solid", label: "Solid" },
              { value: "gradient", label: "Gradient" },
            ]}
            onChange={(fill) => updateColours(withFillType(tile.background, fill))}
          />
          {isGradient ? (
            <>
              <ColorField
                label="Gradient start"
                value={stops[0]}
                onChange={(hex) => updateColours({ type: "gradient", colors: [hex, stops[1] ?? stops[0]] })}
              />
              <ColorField
                label="Gradient end"
                value={stops[1] ?? stops[0]}
                onChange={(hex) => updateColours({ type: "gradient", colors: [stops[0], hex] })}
              />
            </>
          ) : (
            <ColorField
              label="Background"
              value={stops[0]}
              onChange={(hex) => updateColours({ type: "solid", colors: [hex] })}
            />
          )}
          <ColorField
            label="Text and icon"
            value={tile.textColor}
            allowInherit
            inheritLabel="Automatic"
            onChange={(hex) => update({ textColor: hex })}
          />
          <StepperRow
            label="Corner radius"
            testID="widget-radius"
            value={tile.radius}
            onChange={(radius) => update({ radius })}
            min={0}
            max={32}
            step={4}
          />
        </Panel>

        <Panel
          title="Icon"
          icon={<Icon name="image" size={18} color={tokens.PrimaryColor} />}
        >
          <SegmentedControl
            testID="widget-icon"
            value={tile.iconMode}
            options={[
              { value: "qr", label: "QR code" },
              { value: "type", label: type?.label ?? "Code type" },
              { value: "none", label: "None" },
            ]}
            onChange={(iconMode) => update({ iconMode })}
          />
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
  warning: { fontSize: 11, textAlign: "center", maxWidth: 300 },
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
  actions: { flexDirection: "row", gap: 10 },
  action: { flex: 1 },
  empty: { alignItems: "center", gap: 10, paddingVertical: 60, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptyBody: { fontSize: 13, textAlign: "center", lineHeight: 19, marginBottom: 8, maxWidth: 320 },
});
