import {
  resolveQrProps,
  resolveFrameGeometry,
  recommendedEccForLogo,
  DEFAULT_STYLE,
  DOT_STYLES,
  EYE_STYLES,
} from "../qrStyleOptions";

describe("resolveQrProps", () => {
  it("passes the whole-symbol size, not a per-piece size", () => {
    // The renderer derives pieceSize as size/moduleCount; its README's prop
    // table says otherwise and is wrong.
    const props = resolveQrProps(DEFAULT_STYLE, "hello", 25);
    expect(props.size).toBe(DEFAULT_STYLE.size);
    expect(props.pieceSize).toBeUndefined();
  });

  it("scales radii with the module count so a style survives any payload length", () => {
    const small = resolveQrProps({ dotStyle: "rounded", size: 260 }, "a", 25);
    const large = resolveQrProps({ dotStyle: "rounded", size: 260 }, "a", 50);
    // Same fraction of a module, half the absolute radius at twice the density.
    expect(small.pieceBorderRadius).toBeCloseTo(large.pieceBorderRadius * 2);
  });

  it("leaves eye options undefined for the default square eye", () => {
    // Absent eye options are what make the eyes inherit the body styling; an
    // empty object would override it.
    const props = resolveQrProps({ eyeOuterStyle: "square", eyeInnerStyle: "square" }, "a", 25);
    expect(props.outerEyesOptions).toBeUndefined();
    expect(props.innerEyesOptions).toBeUndefined();
  });

  it("emits eye options once a shape or colour is chosen", () => {
    expect(resolveQrProps({ eyeOuterStyle: "circle" }, "a", 25).outerEyesOptions).toBeDefined();
    expect(resolveQrProps({ eyeOuterStyle: "square", eyeOuterColor: "#ff0000" }, "a", 25).outerEyesOptions)
      .toMatchObject({ color: "#ff0000" });
  });

  it("only sets a gradient when one is enabled", () => {
    expect(resolveQrProps({ useGradient: false }, "a", 25).gradient).toBeUndefined();
    const grad = resolveQrProps(
      { useGradient: true, gradientType: "radial", gradientColors: ["#000", "#fff"] },
      "a",
      25
    ).gradient;
    expect(grad).toMatchObject({ type: "radial" });
    expect(grad.options.colors).toEqual(["#000", "#fff"]);
  });

  it("only sets a logo when there is an image", () => {
    expect(resolveQrProps({ logoUri: null }, "a", 25).logo).toBeUndefined();
    expect(resolveQrProps({ logoUri: "data:image/png;base64,AA" }, "a", 25).logo)
      .toMatchObject({ href: { uri: "data:image/png;base64,AA" } });
  });

  it("handles every preset without throwing", () => {
    for (const dot of DOT_STYLES) {
      for (const eye of EYE_STYLES) {
        expect(() =>
          resolveQrProps({ dotStyle: dot.id, eyeOuterStyle: eye.id, eyeInnerStyle: eye.id }, "a", 33)
        ).not.toThrow();
      }
    }
  });
});

describe("resolveFrameGeometry", () => {
  it("reserves only the quiet zone when there is no frame", () => {
    const geo = resolveFrameGeometry({ size: 200, quietZone: 10, frameStyle: "none" }, 25);
    expect(geo.viewBox).toEqual({ x: -10, y: -10, width: 220, height: 220 });
    expect(geo.captionHeight).toBe(0);
  });

  it("adds height below for a bottom caption and above for a top one", () => {
    const bottom = resolveFrameGeometry({ size: 200, quietZone: 10, frameStyle: "bottom-bar" }, 25);
    expect(bottom.viewBox.y).toBe(-10);
    expect(bottom.viewBox.height).toBeGreaterThan(bottom.viewBox.width);

    const top = resolveFrameGeometry({ size: 200, quietZone: 10, frameStyle: "top-bar" }, 25);
    expect(top.viewBox.y).toBeLessThan(-10);
    expect(top.viewBox.height).toBe(bottom.viewBox.height);
  });

  it("leaves room for the speech bubble's tail", () => {
    const geo = resolveFrameGeometry({ size: 200, quietZone: 10, frameStyle: "speech-bubble" }, 25);
    expect(geo.tail).toBeGreaterThan(0);
    expect(geo.viewBox.height).toBeGreaterThan(
      resolveFrameGeometry({ size: 200, quietZone: 10, frameStyle: "rounded-card" }, 25).viewBox.height
    );
  });
});

describe("recommendedEccForLogo", () => {
  it("demands more error correction as the logo grows", () => {
    expect(recommendedEccForLogo(0)).toBe("M");
    expect(recommendedEccForLogo(0.15)).toBe("M");
    expect(recommendedEccForLogo(0.22)).toBe("Q");
    expect(recommendedEccForLogo(0.3)).toBe("H");
  });
});
