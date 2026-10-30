import { Linking } from "react-native";

// The hosted legal pages: static files in public/ (privacy.html, terms.html, support.html),
// served by Cloudflare at these paths. Each app hosts its own set; there is no shared site.
// Settings opens them in the system browser (a new tab on web) instead of routing in-app, and
// the Play Console listing uses the same URLs.
export const SITE_URL = "https://qr.xegster.com.au";
export const PRIVACY_URL = `${SITE_URL}/privacy`;
export const TERMS_URL = `${SITE_URL}/terms`;
export const SUPPORT_URL = `${SITE_URL}/support`;

// A failure (no browser installed, blocked popup) is not worth an error box on a link.
export async function openLegalUrl(url) {
  try {
    await Linking.openURL(url);
  } catch (err) {
    console.warn("[legalLinks] Could not open", url, err?.message);
  }
}
