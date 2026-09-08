import React, { forwardRef, useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import QRCodeStyled from "react-native-qrcode-styled";
import { Rect, Path, Text as SvgText } from "react-native-svg";
import { useTheme } from "../theme/ThemeProvider";
import { analyze } from "../services/qrEncode";
import { resolveQrProps, resolveFrameGeometry, DEFAULT_STYLE } from "../utils/qrStyleOptions";
import { contrastRatio } from "../utils/color";
import scopeSvgIds from "../utils/scopeSvgIds";
import generateId from "../utils/generateId";

/**
 * QrPreview — renders a styled QR code, its frame, and any problems with it.
 *
 * Two things are deliberate here:
 *
 *  - The frame (caption bar, card, speech bubble) is drawn as SVG *inside* the
 *    same <Svg> as the symbol, via the renderer's `renderBackground` hook, and
 *    the viewBox is widened to make room. Wrapping the code in React Native
 *    views instead would look identical on screen and then silently lose the
 *    frame on export, because `toDataURL` captures only the SVG element.
 *
 *  - The payload is analysed before render. An over-capacity string makes the
 *    renderer throw *during* render, which React Native surfaces as a red
 *    screen rather than something catchable, so the error state below has to
 *    happen instead of the render, not after a failed one.
 *
 * The forwarded ref lands on the underlying <Svg>, which is what the export
 * service calls `toDataURL` on.
 */
const QrPreview = forwardRef(function QrPreview(
  { data, style: qrStyle, showWarnings = true, containerStyle },
  ref
) {
  const { tokens } = useTheme();
  const s = { ...DEFAULT_STYLE, ...(qrStyle ?? {}) };

  // Host node + a per-instance suffix, so this code's gradient ids cannot
  // collide with another code's on the same page. See scopeSvgIds.
  const hostRef = useRef(null);
  const instanceId = useRef(generateId()).current;

  const analysis = useMemo(
    () => analyze(data, s.errorCorrectionLevel),
    [data, s.errorCorrectionLevel]
  );

  const geo = useMemo(
    () => resolveFrameGeometry(s, analysis.moduleCount),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      s.size, s.quietZone, s.frameStyle, analysis.moduleCount,
    ]
  );

  const qrProps = useMemo(
    () => resolveQrProps(s, data, analysis.moduleCount),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, analysis.moduleCount, JSON.stringify(s)]
  );

  // Scanners need real luminance separation, not just "different colours" —
  // a mid-blue on mid-green reads as one flat block to a camera.
  const contrast = useMemo(() => {
    try {
      const front = s.useGradient ? s.gradientColors?.[1] ?? s.color : s.color;
      return contrastRatio(front, s.backgroundColor);
    } catch {
      return 21;
    }
  }, [s.color, s.backgroundColor, s.useGradient, s.gradientColors]);

  // Runs after every commit on purpose: React restores the library's original
  // ids whenever it re-renders the defs, so the scoping has to be re-applied.
  useEffect(() => {
    scopeSvgIds(hostRef.current, instanceId);
  });

  if (analysis.empty) {
    return (
      <View style={[styles.placeholder, { borderColor: tokens.border }, containerStyle]}>
        <Text style={[styles.placeholderText, { color: tokens.textMuted }]}>
          Fill in the fields to see your code
        </Text>
      </View>
    );
  }

  if (!analysis.ok) {
    return (
      <View style={[styles.placeholder, { borderColor: tokens.danger }, containerStyle]}>
        <Text style={[styles.errorText, { color: tokens.danger }]}>{analysis.error}</Text>
      </View>
    );
  }

  const vb = geo.viewBox;
  const captionFontSize = Math.max(11, geo.captionHeight * 0.42);

  const renderBackground = () => {
    const nodes = [];
    const bubbleHeight = vb.height - geo.tail;

    // Canvas fill. Card-style frames fill with the frame colour and lay the
    // code's own background over the symbol area only.
    const isCard = geo.frame === "rounded-card" || geo.frame === "speech-bubble";
    nodes.push(
      <Rect
        key="canvas"
        x={vb.x}
        y={vb.y}
        width={vb.width}
        height={bubbleHeight}
        rx={isCard ? 18 : 0}
        fill={isCard ? s.frameColor : s.backgroundColor}
      />
    );

    if (geo.frame === "speech-bubble") {
      const cx = geo.size / 2;
      const half = geo.tail * 0.75;
      const top = vb.y + bubbleHeight - 1;
      nodes.push(
        <Path
          key="tail"
          d={`M ${cx - half} ${top} L ${cx} ${top + geo.tail} L ${cx + half} ${top} Z`}
          fill={s.frameColor}
        />
      );
    }

    if (isCard) {
      nodes.push(
        <Rect
          key="symbol-bg"
          x={-geo.quiet}
          y={-geo.quiet}
          width={geo.size + geo.quiet * 2}
          height={geo.size + geo.quiet * 2}
          rx={10}
          fill={s.backgroundColor}
        />
      );
    }

    if (geo.frame === "outline") {
      nodes.push(
        <Rect
          key="outline"
          x={vb.x + geo.strokeInset / 2}
          y={vb.y + geo.strokeInset / 2}
          width={vb.width - geo.strokeInset}
          height={vb.height - geo.strokeInset}
          rx={12}
          fill="none"
          stroke={s.frameColor}
          strokeWidth={geo.strokeInset}
        />
      );
    }

    if (geo.frame === "bottom-bar" || geo.frame === "top-bar") {
      const bandY = geo.frame === "top-bar" ? vb.y : geo.size + geo.quiet;
      nodes.push(
        <Rect
          key="band"
          x={vb.x}
          y={bandY}
          width={vb.width}
          height={geo.captionHeight}
          fill={s.frameColor}
        />
      );
    }

    if (geo.captionHeight > 0 && s.frameText) {
      const bandY =
        geo.frame === "top-bar" ? vb.y : vb.y + vb.height - geo.tail - geo.captionHeight;
      nodes.push(
        <SvgText
          key="caption"
          x={geo.size / 2}
          y={bandY + geo.captionHeight / 2 + captionFontSize * 0.35}
          fontSize={captionFontSize}
          fontWeight="bold"
          fill={s.frameTextColor}
          textAnchor="middle"
        >
          {s.frameText}
        </SvgText>
      );
    }

    return nodes;
  };

  return (
    <View ref={hostRef} style={containerStyle}>
      <QRCodeStyled
        ref={ref}
        {...qrProps}
        width={vb.width}
        height={vb.height}
        viewBox={`${vb.x} ${vb.y} ${vb.width} ${vb.height}`}
        renderBackground={renderBackground}
      />

      {showWarnings && contrast < 3 ? (
        <Text style={[styles.warning, { color: tokens.warning }]}>
          Low contrast ({contrast.toFixed(1)}:1) — many scanners will struggle. Aim for 4:1 or more.
        </Text>
      ) : null}

      {showWarnings && s.logoUri && s.logoScale >= 0.2 && s.errorCorrectionLevel !== "H" ? (
        <Text style={[styles.warning, { color: tokens.warning }]}>
          A logo this large needs error correction H to stay scannable.
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  placeholder: {
    width: 240,
    height: 240,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  placeholderText: { fontSize: 13, textAlign: "center" },
  errorText: { fontSize: 13, textAlign: "center", fontWeight: "600" },
  warning: { fontSize: 11, textAlign: "center", marginTop: 10, maxWidth: 280, alignSelf: "center" },
});

export default QrPreview;
