import React, { useCallback, useEffect, useRef } from "react";
import { View, Text, Pressable, Switch, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

// Hold-to-repeat tuning for StepperRow's +/- buttons: wait long enough to
// tell a hold from a tap, repeat slowly at first, then speed up once the
// user has clearly committed to holding it down.
const STEPPER_HOLD_DELAY_MS = 400;
const STEPPER_SLOW_INTERVAL_MS = 300;
const STEPPER_FAST_INTERVAL_MS = 60;
const STEPPER_FAST_AFTER_MS = 2000;

/**
 * The small labelled control primitives shared by the generator and settings
 * screens. Grouped in one file because they are variations on the same
 * "label on the left, control on the right" row and are always used together.
 *
 *   SegmentedControl — horizontal pill picker, scrolls when the options overflow
 *   SwitchRow        — label + native Switch
 *   StepperRow       — numeric value with -/+ (no slider dependency, and it
 *                      behaves identically on web, where RN sliders are shaky)
 */

export function SegmentedControl({ label, value, options, onChange, hint, testID }) {
  const { tokens, isDark } = useTheme();

  return (
    <View testID={testID}>
      {label ? <Text style={[styles.label, { color: tokens.textMuted }]}>{label}</Text> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.segRow}
      >
        {options.map((opt) => {
          const selected = String(opt.value) === String(value);
          return (
            <Pressable
              key={String(opt.value)}
              testID={`opt-${opt.value}`}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={opt.label}
              onPress={() => onChange(opt.value)}
              style={({ pressed }) => [
                styles.segItem,
                {
                  backgroundColor: selected
                    ? tokens.PrimaryColor
                    : isDark ? tokens.surfaceAlt : tokens.background,
                  borderColor: selected ? tokens.PrimaryColor : tokens.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              {opt.swatch ? (
                <View style={[styles.swatch, { backgroundColor: opt.swatch }]} />
              ) : null}
              <Text
                style={[
                  styles.segLabel,
                  { color: selected ? "#ffffff" : tokens.text, fontWeight: selected ? "700" : "500" },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {hint ? <Text style={[styles.hint, { color: tokens.textMuted }]}>{hint}</Text> : null}
    </View>
  );
}

export function SwitchRow({ label, hint, value, onValueChange, testID }) {
  const { tokens } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: tokens.text }]}>{label}</Text>
        {hint ? <Text style={[styles.hint, { color: tokens.textMuted }]}>{hint}</Text> : null}
      </View>
      <Switch
        testID={testID}
        value={!!value}
        onValueChange={onValueChange}
        trackColor={{ true: tokens.PrimaryColor, false: tokens.border }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

export function StepperRow({
  label,
  hint,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  format,
  testID,
}) {
  const { tokens, isDark } = useTheme();
  const clamp = (n) => Math.min(max, Math.max(min, Number(n.toFixed(4))));
  const display = format ? format(value) : String(value);

  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const holdTimerRef = useRef(null);
  const holdStartRef = useRef(null);
  const holdEngagedRef = useRef(false);

  const stopHold = useCallback(() => {
    if (holdTimerRef.current != null) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    holdStartRef.current = null;
  }, []);

  useEffect(() => stopHold, [stopHold]);

  const stepOnce = useCallback(
    (dir) => {
      const next = clamp(valueRef.current + (dir === "dec" ? -step : step));
      if (next === valueRef.current) return false;
      valueRef.current = next;
      onChange(next);
      return true;
    },
    [clamp, onChange, step]
  );

  const startHold = useCallback(
    (dir) => {
      stopHold();
      holdStartRef.current = Date.now();
      const tick = () => {
        holdEngagedRef.current = true;
        const changed = stepOnce(dir);
        if (!changed) {
          stopHold();
          return;
        }
        const held = Date.now() - holdStartRef.current;
        const interval = held > STEPPER_FAST_AFTER_MS ? STEPPER_FAST_INTERVAL_MS : STEPPER_SLOW_INTERVAL_MS;
        holdTimerRef.current = setTimeout(tick, interval);
      };
      holdTimerRef.current = setTimeout(tick, STEPPER_HOLD_DELAY_MS);
    },
    [stepOnce, stopHold]
  );

  // A hold that repeated at least once already applied its steps via the
  // timer above; the onPress fired by releasing must then be a no-op so the
  // release doesn't apply one extra step on top of the hold.
  const handlePress = useCallback(
    (dir) => {
      if (holdEngagedRef.current) {
        holdEngagedRef.current = false;
        return;
      }
      stepOnce(dir);
    },
    [stepOnce]
  );

  const btn = (dir, symbol, disabled) => (
    <Pressable
      testID={`${testID}-${dir}`}
      accessibilityRole="button"
      accessibilityLabel={`${dir === "dec" ? "Decrease" : "Increase"} ${label}`}
      disabled={disabled}
      onPress={() => handlePress(dir)}
      onPressIn={() => startHold(dir)}
      onPressOut={stopHold}
      style={({ pressed }) => [
        styles.stepBtn,
        {
          backgroundColor: isDark ? tokens.surfaceAlt : tokens.background,
          borderColor: tokens.border,
          opacity: disabled ? 0.35 : pressed ? 0.6 : 1,
        },
      ]}
    >
      <Text style={[styles.stepSymbol, { color: tokens.text }]}>{symbol}</Text>
    </Pressable>
  );

  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: tokens.text }]}>{label}</Text>
        {hint ? <Text style={[styles.hint, { color: tokens.textMuted }]}>{hint}</Text> : null}
      </View>
      <View style={styles.stepper}>
        {btn("dec", "−", value <= min)}
        <Text style={[styles.stepValue, { color: tokens.text }]}>{display}</Text>
        {btn("inc", "+", value >= max)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: "600", marginBottom: 8, letterSpacing: 0.2 },
  segRow: { flexDirection: "row", gap: 8, paddingRight: 4 },
  segItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 1,
  },
  segLabel: { fontSize: 13 },
  swatch: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: "rgba(255,255,255,0.35)" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: "600" },
  hint: { fontSize: 11, marginTop: 3 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepSymbol: { fontSize: 18, fontWeight: "700", lineHeight: 20 },
  stepValue: { fontSize: 14, fontWeight: "700", minWidth: 46, textAlign: "center" },
});
