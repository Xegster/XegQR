import React from "react";
import { View, Text, Image, Pressable, TextInput, StyleSheet } from "react-native";
import Panel from "./Panel";
import ColorField from "./ColorField";
import AppButton from "./AppButton";
import Icon from "./icons/QrIcons";
import { SegmentedControl, SwitchRow, StepperRow } from "./OptionRow";
import { useTheme } from "../theme/ThemeProvider";
import {
  DOT_STYLES,
  EYE_STYLES,
  FRAME_STYLES,
  GRADIENT_PRESETS,
  ERROR_CORRECTION_LEVELS,
  recommendedEccForLogo,
} from "../utils/qrStyleOptions";
import { formatBytes } from "../services/imageCache";

/**
 * StyleControlsPanel — every visual option, grouped into collapsible panels.
 *
 * Collapsed by default apart from Colours: the full set is long enough that
 * leaving it all open buries the "Save" button, and most codes only ever need a
 * colour change.
 *
 * The logo section is where the image-cache rule surfaces to the user. An image
 * that is too big to cache is still applied to the code — the panel just says
 * so, rather than refusing the pick.
 */
export default function StyleControlsPanel({
  style,
  onChange,
  onPickLogo,
  onClearLogo,
  cachedImages = [],
  onUseCachedImage,
  onDeleteCachedImage,
  logoNotice,
}) {
  const { tokens } = useTheme();
  const set = (key, value) => onChange({ ...style, [key]: value });

  const recommendedEcc = recommendedEccForLogo(style.logoUri ? style.logoScale : 0);
  const eccIsLow =
    style.logoUri && levelRank(style.errorCorrectionLevel) < levelRank(recommendedEcc);

  return (
    <View style={{ gap: 12 }}>
      <Panel
        title="Colours"
        subtitle="Body, background and gradient"
        icon={<Icon name="palette" size={18} color={tokens.PrimaryColor} />}
        collapsible
        defaultOpen
      >
        <ColorField
          label="Code colour"
          testID="color-body"
          value={style.color}
          onChange={(v) => set("color", v)}
        />
        <ColorField
          label="Background"
          testID="color-background"
          value={style.backgroundColor}
          onChange={(v) => set("backgroundColor", v)}
        />

        <SwitchRow
          testID="toggle-gradient"
          label="Use a gradient"
          hint="Replaces the flat code colour"
          value={style.useGradient}
          onValueChange={(v) => set("useGradient", v)}
        />

        {style.useGradient ? (
          <>
            <SegmentedControl
              label="Gradient preset"
              value={GRADIENT_PRESETS.find(
                (p) => p.colors[0] === style.gradientColors?.[0] && p.colors[1] === style.gradientColors?.[1]
              )?.id}
              options={GRADIENT_PRESETS.map((p) => ({
                value: p.id,
                label: p.label,
                swatch: p.colors[0],
              }))}
              onChange={(id) => {
                const preset = GRADIENT_PRESETS.find((p) => p.id === id);
                if (preset) set("gradientColors", preset.colors);
              }}
            />
            <SegmentedControl
              label="Gradient shape"
              value={style.gradientType}
              options={[
                { value: "linear", label: "Linear" },
                { value: "radial", label: "Radial" },
              ]}
              onChange={(v) => set("gradientType", v)}
            />
            <ColorField
              label="Gradient start"
              value={style.gradientColors?.[0]}
              onChange={(v) => set("gradientColors", [v, style.gradientColors?.[1] ?? "#22d3ee"])}
            />
            <ColorField
              label="Gradient end"
              value={style.gradientColors?.[1]}
              onChange={(v) => set("gradientColors", [style.gradientColors?.[0] ?? "#6d5efc", v])}
            />
          </>
        ) : null}
      </Panel>

      <Panel
        title="Shapes"
        subtitle="Module and eye styling"
        icon={<Icon name="qr" size={18} color={tokens.PrimaryColor} />}
        collapsible
        defaultOpen={false}
      >
        <SegmentedControl
          label="Module shape"
          testID="dot-style"
          value={style.dotStyle}
          options={DOT_STYLES.map((d) => ({ value: d.id, label: d.label }))}
          onChange={(v) => set("dotStyle", v)}
        />
        <SegmentedControl
          label="Eye frame"
          testID="eye-outer-style"
          value={style.eyeOuterStyle}
          options={EYE_STYLES.map((e) => ({ value: e.id, label: e.label }))}
          onChange={(v) => set("eyeOuterStyle", v)}
        />
        <SegmentedControl
          label="Eye centre"
          testID="eye-inner-style"
          value={style.eyeInnerStyle}
          options={EYE_STYLES.map((e) => ({ value: e.id, label: e.label }))}
          onChange={(v) => set("eyeInnerStyle", v)}
        />
        <ColorField
          label="Eye frame colour"
          value={style.eyeOuterColor}
          allowInherit
          onChange={(v) => set("eyeOuterColor", v)}
        />
        <ColorField
          label="Eye centre colour"
          value={style.eyeInnerColor}
          allowInherit
          onChange={(v) => set("eyeInnerColor", v)}
        />
      </Panel>

      <Panel
        title="Logo"
        subtitle={style.logoUri ? "Image in the centre" : "Add an image to the centre"}
        icon={<Icon name="image" size={18} color={tokens.PrimaryColor} />}
        collapsible
        defaultOpen={false}
      >
        {style.logoUri ? (
          <View style={styles.logoRow}>
            <Image
              source={{ uri: style.logoUri }}
              style={[styles.logoPreview, { borderColor: tokens.border }]}
              resizeMode="contain"
            />
            <View style={styles.logoActions}>
              <AppButton label="Replace" variant="outline" size="sm" onPress={onPickLogo} />
              <AppButton label="Remove" variant="destructiveOutline" size="sm" onPress={onClearLogo} />
            </View>
          </View>
        ) : (
          <AppButton
            label="Choose an image"
            variant="outline"
            fullWidth
            onPress={onPickLogo}
            icon={<Icon name="image" size={16} color={tokens.PrimaryColor} />}
          />
        )}

        {logoNotice ? (
          <Text style={[styles.notice, { color: tokens.warning }]}>{logoNotice}</Text>
        ) : null}

        {style.logoUri ? (
          <>
            <StepperRow
              label="Logo size"
              testID="logo-scale"
              value={style.logoScale}
              onChange={(v) => set("logoScale", v)}
              min={0.08}
              max={0.4}
              step={0.02}
              format={(v) => `${Math.round(v * 100)}%`}
            />
            <StepperRow
              label="Logo padding"
              testID="logo-padding"
              value={style.logoPadding}
              onChange={(v) => set("logoPadding", v)}
              min={0}
              max={20}
              step={1}
            />
            <SwitchRow
              label="Clear modules behind logo"
              hint="Cleaner look; needs higher error correction"
              value={style.logoHidePieces}
              onValueChange={(v) => set("logoHidePieces", v)}
            />
          </>
        ) : null}

        {cachedImages.length ? (
          <View style={{ gap: 8 }}>
            <Text style={[styles.subLabel, { color: tokens.textMuted }]}>Saved images</Text>
            <View style={styles.thumbRow}>
              {cachedImages.map((img) => (
                <View key={img.id} style={styles.thumbWrap}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Use ${img.name}`}
                    onPress={() => onUseCachedImage?.(img)}
                    style={({ pressed }) => [
                      styles.thumb,
                      { borderColor: tokens.border, opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Image source={{ uri: img.dataUri }} style={styles.thumbImage} resizeMode="cover" />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${img.name}`}
                    hitSlop={6}
                    onPress={() => onDeleteCachedImage?.(img)}
                    style={[styles.thumbDelete, { backgroundColor: tokens.danger }]}
                  >
                    <Icon name="close" size={11} color="#ffffff" />
                  </Pressable>
                  <Text style={[styles.thumbBytes, { color: tokens.textMuted }]} numberOfLines={1}>
                    {formatBytes(img.bytes)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </Panel>

      <Panel
        title="Frame"
        subtitle="Border and call to action"
        icon={<Icon name="bookmark" size={18} color={tokens.PrimaryColor} />}
        collapsible
        defaultOpen={false}
      >
        <SegmentedControl
          label="Frame style"
          testID="frame-style"
          value={style.frameStyle}
          options={FRAME_STYLES.map((f) => ({ value: f.id, label: f.label }))}
          onChange={(v) => set("frameStyle", v)}
        />
        {style.frameStyle !== "none" ? (
          <>
            {style.frameStyle !== "outline" ? (
              <ThemedFrameText style={style} onChange={onChange} />
            ) : null}
            <ColorField
              label="Frame colour"
              value={style.frameColor}
              onChange={(v) => set("frameColor", v)}
            />
            {style.frameStyle !== "outline" ? (
              <ColorField
                label="Caption colour"
                value={style.frameTextColor}
                onChange={(v) => set("frameTextColor", v)}
              />
            ) : null}
          </>
        ) : null}
      </Panel>

      <Panel
        title="Encoding"
        subtitle="Error correction and size"
        icon={<Icon name="shield" size={18} color={tokens.PrimaryColor} />}
        collapsible
        defaultOpen={false}
      >
        <SegmentedControl
          label="Error correction"
          testID="ecc"
          value={style.errorCorrectionLevel}
          options={ERROR_CORRECTION_LEVELS.map((l) => ({ value: l.value, label: l.label }))}
          onChange={(v) => set("errorCorrectionLevel", v)}
          hint={
            ERROR_CORRECTION_LEVELS.find((l) => l.value === style.errorCorrectionLevel)?.hint
          }
        />
        {eccIsLow ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Raise error correction to ${recommendedEcc}`}
            onPress={() => set("errorCorrectionLevel", recommendedEcc)}
            style={({ pressed }) => [
              styles.suggestion,
              { borderColor: tokens.warning, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.suggestionText, { color: tokens.warning }]}>
              Your logo covers enough of the code to need level {recommendedEcc}. Tap to fix.
            </Text>
          </Pressable>
        ) : null}

        <StepperRow
          label="Render size"
          testID="qr-size"
          value={style.size}
          onChange={(v) => set("size", v)}
          min={140}
          max={520}
          step={20}
          format={(v) => `${v}px`}
          hint="Exports render at 3× this"
        />
        <StepperRow
          label="Quiet zone"
          testID="quiet-zone"
          value={style.quietZone}
          onChange={(v) => set("quietZone", v)}
          min={0}
          max={48}
          step={4}
          hint="Blank margin scanners rely on"
        />
      </Panel>
    </View>
  );
}

/**
 * The caption box is a bare TextInput rather than a ThemedTextInput because it
 * sits inside a Panel that already supplies the label and spacing.
 */
function ThemedFrameText({ style, onChange }) {
  const { tokens, isDark } = useTheme();
  return (
    <View>
      <Text style={[styles.subLabel, { color: tokens.textMuted }]}>Caption</Text>
      <View
        style={[
          styles.captionInput,
          { backgroundColor: isDark ? tokens.surfaceAlt : tokens.background, borderColor: tokens.border },
        ]}
      >
        <TextInput
          testID="frame-text"
          value={String(style.frameText ?? "")}
          onChangeText={(v) => onChange({ ...style, frameText: v })}
          placeholder="SCAN ME"
          placeholderTextColor={tokens.textMuted}
          maxLength={40}
          style={{ fontSize: 15, color: tokens.text, paddingVertical: 10, paddingHorizontal: 12 }}
        />
      </View>
    </View>
  );
}

function levelRank(level) {
  return { L: 0, M: 1, Q: 2, H: 3 }[level] ?? 1;
}

const styles = StyleSheet.create({
  logoRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  logoPreview: { width: 64, height: 64, borderRadius: 12, borderWidth: 1 },
  logoActions: { flex: 1, gap: 8 },
  notice: { fontSize: 12, lineHeight: 17 },
  subLabel: { fontSize: 12, fontWeight: "600", marginBottom: 8, letterSpacing: 0.2 },
  thumbRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  thumbWrap: { width: 60, alignItems: "center" },
  thumb: { width: 52, height: 52, borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  thumbImage: { width: "100%", height: "100%" },
  thumbDelete: {
    position: "absolute",
    top: -4,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbBytes: { fontSize: 10, marginTop: 4 },
  captionInput: { borderWidth: 1.5, borderRadius: 10, minHeight: 44, justifyContent: "center" },
  suggestion: { borderWidth: 1, borderRadius: 10, padding: 10 },
  suggestionText: { fontSize: 12, lineHeight: 17 },
});
