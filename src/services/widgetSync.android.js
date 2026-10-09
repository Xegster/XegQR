import { requestWidgetUpdateById, requestPinWidget } from "react-native-android-widget";
import { updateBindings, applyCodeChange, applyCodeRemoval } from "../widgets/widgetBindings";
import { renderTile } from "../widgets/QrTile";

/**
 * widgetSync (Android) — keeps home-screen tiles in step with the saved codes.
 *
 * Called from savedCodeRepository, so every path that renames or deletes a code
 * reaches it. Only the affected tiles are redrawn. A failure here must never
 * fail the save that triggered it, so the repository fires these and moves on.
 */

/** A code was saved: tiles whose label follows its name pick up a rename. */
export async function codeUpdated(code) {
  const changed = await updateBindings((binding) => applyCodeChange(binding, code));
  await redrawAll(changed);
}

/** A code was deleted: its tiles switch to "Code removed". */
export async function codeDeleted(codeId) {
  const changed = await updateBindings((binding) => applyCodeRemoval(binding, codeId));
  await redrawAll(changed);
}

/** Redraw one tile from a binding, e.g. after editing it in the app. */
export async function redrawWidget(widgetId, binding) {
  if (!binding?.widgetName) return;
  await requestWidgetUpdateById({
    widgetName: binding.widgetName,
    widgetId: Number(widgetId),
    renderWidget: (widgetInfo) => renderTile(binding, widgetInfo),
  });
}

/**
 * Ask the launcher to add a tile. Resolves true only if the launcher accepted
 * the request — the user can still say no in its dialog.
 */
export async function pinWidget(widgetName) {
  try {
    return await requestPinWidget({ widgetName });
  } catch (e) {
    console.warn("[widgets] pin request failed:", e?.message);
    return false;
  }
}

async function redrawAll(changed) {
  for (const [widgetId, binding] of changed) {
    try {
      await redrawWidget(widgetId, binding);
    } catch (e) {
      console.warn("[widgets] redraw failed:", e?.message);
    }
  }
}
