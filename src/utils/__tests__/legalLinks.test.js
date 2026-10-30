import { Linking } from "react-native";
import { PRIVACY_URL, TERMS_URL, SUPPORT_URL, openLegalUrl } from "../legalLinks";

describe("legal URLs", () => {
  it("point at the static pages on the app's own host", () => {
    expect(PRIVACY_URL).toBe("https://qr.xegster.com.au/privacy");
    expect(TERMS_URL).toBe("https://qr.xegster.com.au/terms");
    expect(SUPPORT_URL).toBe("https://qr.xegster.com.au/support");
  });
});

describe("openLegalUrl", () => {
  afterEach(() => jest.restoreAllMocks());

  it("hands the URL to the system browser", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await openLegalUrl(PRIVACY_URL);
    expect(open).toHaveBeenCalledWith(PRIVACY_URL);
  });

  it("swallows a failure to open", async () => {
    jest.spyOn(Linking, "openURL").mockRejectedValue(new Error("no browser"));
    jest.spyOn(console, "warn").mockImplementation(() => {});
    await expect(openLegalUrl(TERMS_URL)).resolves.toBeUndefined();
  });
});
