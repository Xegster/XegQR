import React from "react";
import { View } from "react-native";
import ThemedTextInput from "./ThemedTextInput";
import { SegmentedControl, SwitchRow } from "./OptionRow";
import { isFieldVisible } from "../utils/qrPayloads";

/**
 * PayloadForm — renders whichever fields the chosen QR type declares.
 *
 * There is one of these for all 21 code types, driven by the `fields` schema in
 * qrPayloads.js. That is the point of the schema: a new code type is a data
 * entry there, not a new screen here.
 *
 * Fields hidden by a `dependsOn` guard (the WiFi password when the network is
 * open, say) are skipped rather than disabled — a disabled control still reads
 * as something the user is missing out on.
 */
export default function PayloadForm({ type, values, onChange, errors }) {
  if (!type) return null;

  const setValue = (key, value) => onChange({ ...values, [key]: value });

  return (
    <View style={{ gap: 14 }}>
      {type.fields.filter((field) => isFieldVisible(field, values)).map((field) => {
        const value = values?.[field.key];

        if (field.type === "switch") {
          return (
            <SwitchRow
              key={field.key}
              testID={`field-${field.key}`}
              label={field.label}
              hint={field.hint}
              value={!!value}
              onValueChange={(v) => setValue(field.key, v)}
            />
          );
        }

        if (field.type === "select") {
          return (
            <SegmentedControl
              key={field.key}
              testID={`field-${field.key}`}
              label={field.label}
              hint={field.hint}
              value={value}
              options={field.options ?? []}
              onChange={(v) => setValue(field.key, v)}
            />
          );
        }

        const isDateTime = field.type === "datetime" || field.type === "date";

        return (
          <ThemedTextInput
            key={field.key}
            testID={`field-${field.key}`}
            label={field.label}
            required={field.required}
            value={value}
            onChangeText={(v) => setValue(field.key, v)}
            placeholder={field.placeholder ?? (isDateTime ? "2026-09-08 14:30" : undefined)}
            hint={field.hint ?? (isDateTime ? "YYYY-MM-DD HH:MM" : undefined)}
            error={errors?.[field.key]}
            multiline={field.type === "multiline"}
            secure={field.type === "password"}
            keyboard={field.keyboard}
          />
        );
      })}
    </View>
  );
}
