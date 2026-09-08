import { analyze, getModuleCount, byteLength } from "../qrEncode";

describe("analyze", () => {
  it("reports an empty payload without treating it as an error", () => {
    const result = analyze("");
    expect(result.empty).toBe(true);
    expect(result.ok).toBe(false);
    expect(result.error).toBeNull();
  });

  it("returns the module count and version for a real payload", () => {
    const result = analyze("https://xegster.dev", "M");
    expect(result.ok).toBe(true);
    expect(result.version).toBeGreaterThan(0);
    // Module count is 4*version + 17 for every QR version.
    expect(result.moduleCount).toBe(4 * result.version + 17);
  });

  it("needs a bigger symbol as the error correction level rises", () => {
    const data = "https://xegster.dev/some/reasonably/long/path?with=query&more=params";
    expect(analyze(data, "H").moduleCount).toBeGreaterThanOrEqual(analyze(data, "L").moduleCount);
  });

  it("reports over-capacity data as a message rather than throwing", () => {
    // The renderer throws mid-render on over-long input, which React Native
    // surfaces as a red screen — so this has to be caught before rendering.
    const tooMuch = "x".repeat(8000);
    const result = analyze(tooMuch, "H");
    expect(result.ok).toBe(false);
    expect(result.empty).toBe(false);
    expect(result.error).toMatch(/too much for one QR code/);
  });

  it("falls back to a usable module count when encoding fails", () => {
    expect(getModuleCount("x".repeat(8000), "H")).toBe(25);
  });
});

describe("byteLength", () => {
  it("counts UTF-8 bytes, not characters", () => {
    expect(byteLength("abc")).toBe(3);
    expect(byteLength("café")).toBe(5);
    expect(byteLength("😀")).toBe(4);
  });
});
