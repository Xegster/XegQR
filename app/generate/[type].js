import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../src/theme/ThemeProvider";
import useSettingsStore from "../../src/stores/useSettingsStore";
import useLibraryStore from "../../src/stores/useLibraryStore";
import ScreenHeader from "../../src/components/ScreenHeader";
import Panel from "../../src/components/Panel";
import PayloadForm from "../../src/components/PayloadForm";
import StyleControlsPanel from "../../src/components/StyleControlsPanel";
import TemplatePanel from "../../src/components/TemplatePanel";
import QrPreview from "../../src/components/QrPreview";
import AppButton from "../../src/components/AppButton";
import ThemedTextInput from "../../src/components/ThemedTextInput";
import Icon from "../../src/components/icons/QrIcons";
import { getQrType, defaultValuesFor, buildPayload, missingRequiredFields } from "../../src/utils/qrPayloads";
import { DEFAULT_STYLE } from "../../src/utils/qrStyleOptions";
import { pickImage } from "../../src/services/imageCache";
import { exportPng, exportSvg, copyToClipboard, canExportSvg } from "../../src/services/qrExport";
import { alert } from "../../src/utils/crossPlatformAlert";

const PREVIEW_DOM_ID = "xegqr-preview";

/**
 * Generator — the one screen every QR type shares.
 *
 * Layout switches at 900px: side-by-side with a sticky preview on desktop, a
 * single scrolling column on phones. The preview is the thing people watch
 * while they type, so on desktop it must not scroll away, and on a phone it
 * must not eat half the screen above the keyboard.
 *
 * An existing code can be opened here for editing by passing `?id=`, in which
 * case saving updates that record instead of creating another.
 */
export default function GenerateScreen() {
  const { type: typeId, id: editId, value: seedValue } = useLocalSearchParams();
  const router = useRouter();
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const svgRef = useRef(null);
  const wideLayout = width >= 900;

  const type = useMemo(() => getQrType(String(typeId)), [typeId]);

  const defaultEcc = useSettingsStore((s) => s.defaultErrorCorrection);
  const setLastUsedType = useSettingsStore((s) => s.setLastUsedType);
  const cacheImagesEnabled = useSettingsStore((s) => s.cacheImages);
  const perImageLimit = useSettingsStore((s) => s.perImageLimitBytes);
  const totalCacheLimit = useSettingsStore((s) => s.totalCacheLimitBytes);

  const codes = useLibraryStore((s) => s.codes);
  const images = useLibraryStore((s) => s.images);
  const templates = useLibraryStore((s) => s.templates);
  const saveCode = useLibraryStore((s) => s.saveCode);
  const updateCode = useLibraryStore((s) => s.updateCode);
  const cacheImage = useLibraryStore((s) => s.cacheImage);
  const deleteImage = useLibraryStore((s) => s.deleteImage);
  const saveTemplate = useLibraryStore((s) => s.saveTemplate);
  const deleteTemplate = useLibraryStore((s) => s.deleteTemplate);

  const [values, setValues] = useState(() => defaultValuesFor(String(typeId)));
  const [style, setStyle] = useState(() => ({ ...DEFAULT_STYLE, errorCorrectionLevel: defaultEcc }));
  const [name, setName] = useState("");
  const [logoNotice, setLogoNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  // Reopening a saved code: restore its values, style and name.
  useEffect(() => {
    if (!editId) return;
    const existing = codes.find((c) => c.id === editId);
    if (!existing) return;
    setValues({ ...defaultValuesFor(existing.type), ...existing.values });
    setStyle({ ...DEFAULT_STYLE, ...existing.style });
    setName(existing.name);
  }, [editId, codes]);

  useEffect(() => {
    if (type) setLastUsedType(type.id);
  }, [type, setLastUsedType]);

  // Arriving from the scanner with content to reuse: drop it into the type's
  // first text field, which is the one that carries the payload for every type
  // reachable this way.
  useEffect(() => {
    if (!seedValue || !type) return;
    const target = type.fields.find((f) => f.type === "multiline" || f.type === "text");
    if (target) setValues((v) => ({ ...v, [target.key]: String(seedValue) }));
  }, [seedValue, type]);

  const payload = useMemo(() => buildPayload(String(typeId), values), [typeId, values]);
  const missing = useMemo(() => missingRequiredFields(String(typeId), values), [typeId, values]);

  // Required fields alone are not enough of a gate: types like vCard have none,
  // and their builders emit a structurally valid but empty record
  // ("BEGIN:VCARD…N:;;;;…"), which would render as a real-looking code holding
  // nothing. Comparing against the schema's own defaults — rather than just
  // looking for non-empty strings — means a type whose only fields are selects
  // with defaults is still correctly treated as untouched.
  const hasAnyValue = useMemo(() => {
    const defaults = defaultValuesFor(String(typeId));
    return Object.keys(defaults).some(
      (key) => String(values?.[key] ?? "") !== String(defaults[key] ?? "")
    );
  }, [typeId, values]);

  const hasContent = payload.trim().length > 0 && missing.length === 0 && hasAnyValue;

  if (!type) {
    return (
      <View style={[styles.screen, { backgroundColor: tokens.background }]}>
        <ScreenHeader title="Unknown code type" onBack={() => router.replace("/")} />
        <View style={styles.centered}>
          <Text style={{ color: tokens.textMuted }}>
            There is no code type called “{String(typeId)}”.
          </Text>
        </View>
      </View>
    );
  }

  const handlePickLogo = async () => {
    setLogoNotice(null);
    const asset = await pickImage();
    if (!asset) return;
    if (asset.error) {
      setLogoNotice(asset.error);
      return;
    }

    // The image is applied whatever its size; only caching is conditional.
    setStyle((s) => ({ ...s, logoUri: asset.dataUri }));

    if (!cacheImagesEnabled) {
      setLogoNotice("Image applied. Saving images is turned off in settings.");
      return;
    }

    const result = await cacheImage(asset, { perImageLimit, totalLimit: totalCacheLimit });
    setLogoNotice(result.cached ? null : result.reason);
  };

  const handleSave = async () => {
    if (!hasContent) {
      alert("Not ready yet", `Fill in: ${missing.join(", ")}`);
      return;
    }
    setBusy(true);
    try {
      if (editId) {
        await updateCode(String(editId), { name: name.trim() || undefined, values, style });
      } else {
        await saveCode({ name, type: type.id, values, style });
      }
      router.push("/saved");
    } catch (e) {
      alert("Could not save", e?.message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveTemplate = async (templateName) => {
    try {
      await saveTemplate({ name: templateName, type: type.id, style });
    } catch (e) {
      alert("Could not save template", e?.message ?? "Something went wrong.");
    }
  };

  const handleApplyTemplate = (tmpl) => {
    setStyle((s) => ({ ...DEFAULT_STYLE, ...tmpl.style }));
  };

  const handleExportPng = async () => {
    setBusy(true);
    const result = await exportPng({
      svgRef,
      domId: PREVIEW_DOM_ID,
      name: name.trim() || type.id,
    });
    setBusy(false);
    if (!result.ok) alert("Export failed", result.error);
  };

  const handleExportSvg = async () => {
    const result = await exportSvg({ domId: PREVIEW_DOM_ID, name: name.trim() || type.id });
    if (!result.ok) alert("Export failed", result.error);
  };

  const handleCopy = async () => {
    const result = await copyToClipboard(payload);
    alert(result.ok ? "Copied" : "Could not copy", result.ok ? "The code's content is on your clipboard." : result.error);
  };

  const preview = (
    <Panel style={wideLayout ? styles.stickyPanel : undefined} contentStyle={styles.previewBody}>
      {/* nativeID becomes the DOM id on web, which is how qrExport finds the
          <svg> node to rasterise. */}
      <View nativeID={PREVIEW_DOM_ID}>
        {/* Withheld until the required fields are in. A half-filled type still
            builds a syntactically valid payload ("WIFI:T:WPA;S:;;"), and
            showing a scannable code for it would be a lie. */}
        <QrPreview ref={svgRef} data={hasContent ? payload : ""} style={style} />
      </View>

      {hasContent ? (
        <Text style={[styles.payloadText, { color: tokens.textMuted }]} numberOfLines={3}>
          {payload}
        </Text>
      ) : missing.length ? (
        <Text style={[styles.payloadText, { color: tokens.textMuted }]}>
          Still needed: {missing.join(", ")}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <AppButton
          label={editId ? "Update" : "Save"}
          onPress={handleSave}
          disabled={!hasContent || busy}
          icon={<Icon name="save" size={16} color="#ffffff" />}
          style={styles.action}
        />
        <AppButton
          label="PNG"
          variant="secondary"
          onPress={handleExportPng}
          disabled={!hasContent || busy}
          icon={<Icon name="download" size={16} color="#ffffff" />}
          style={styles.action}
        />
        {canExportSvg ? (
          <AppButton
            label="SVG"
            variant="outline"
            onPress={handleExportSvg}
            disabled={!hasContent || busy}
            icon={<Icon name="download" size={16} color={tokens.PrimaryColor} />}
            style={styles.action}
          />
        ) : null}
        <AppButton
          label="Copy"
          variant="ghost"
          onPress={handleCopy}
          disabled={!hasContent}
          icon={<Icon name="copy" size={16} color={tokens.text} />}
          style={styles.action}
        />
      </View>
    </Panel>
  );

  const controls = (
    <View style={{ gap: 12 }}>
      <Panel
        title={type.label}
        subtitle={type.blurb}
        icon={<Icon name={type.icon} size={18} color={tokens.PrimaryColor} />}
      >
        <PayloadForm type={type} values={values} onChange={setValues} />
      </Panel>

      <Panel title="Name" subtitle="What to call this in your saved codes" collapsible defaultOpen={false}>
        <ThemedTextInput
          testID="code-name"
          value={name}
          onChangeText={setName}
          placeholder="Optional — one is chosen for you"
        />
      </Panel>

      <TemplatePanel
        templates={templates}
        onSave={handleSaveTemplate}
        onApply={handleApplyTemplate}
        onDelete={deleteTemplate}
      />

      <StyleControlsPanel
        style={style}
        onChange={setStyle}
        onPickLogo={handlePickLogo}
        onClearLogo={() => {
          setStyle((s) => ({ ...s, logoUri: null }));
          setLogoNotice(null);
        }}
        cachedImages={images}
        onUseCachedImage={(img) => setStyle((s) => ({ ...s, logoUri: img.dataUri }))}
        onDeleteCachedImage={(img) => deleteImage(img.id)}
        logoNotice={logoNotice}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: tokens.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenHeader
        title={type.label}
        subtitle={editId ? "Editing a saved code" : type.blurb}
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 40 },
          wideLayout && styles.scrollWide,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.layout, wideLayout && styles.layoutWide]}>
          <View style={wideLayout ? styles.previewColumn : undefined}>{preview}</View>
          <View style={wideLayout ? styles.controlsColumn : undefined}>{controls}</View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  scroll: { padding: 16, gap: 12 },
  scrollWide: { alignSelf: "center", width: "100%", maxWidth: 1180 },
  layout: { gap: 12 },
  layoutWide: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 16 },
  previewColumn: { width: 380 },
  controlsColumn: { flex: 1 },
  stickyPanel: Platform.select({ web: { position: "sticky", top: 16 }, default: {} }),
  previewBody: { alignItems: "center", gap: 14 },
  payloadText: { fontSize: 11, textAlign: "center", fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }) },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  action: { flexGrow: 1, minWidth: 92 },
});
