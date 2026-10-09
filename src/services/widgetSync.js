/**
 * widgetSync — keeps home-screen tiles in step with the saved codes.
 *
 * Widgets exist only on Android; this is the web/iOS twin of
 * widgetSync.android.js, with the same exports doing nothing, so callers never
 * branch on platform and these bundles never load the widget library.
 */

export async function codeUpdated() {}

export async function codeDeleted() {}

export async function redrawWidget() {}

/** Resolves false: there is no home screen to pin to. */
export async function pinWidget() {
  return false;
}
