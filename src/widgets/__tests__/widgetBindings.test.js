import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  applyCodeChange,
  applyCodeRemoval,
  getBinding,
  listBindings,
  removeBinding,
  saveBinding,
  updateBindings,
} from "../widgetBindings";

const binding = {
  widgetName: "QrTile",
  codeId: "qr_1",
  codeType: "wifi",
  label: "Home network",
  iconId: "cyan",
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("applyCodeChange", () => {
  it("follows a rename and keeps the tile's icon", () => {
    const next = applyCodeChange(binding, { id: "qr_1", name: "Cabin Wi-Fi" });
    expect(next).toEqual({ ...binding, label: "Cabin Wi-Fi" });
  });

  it("returns the same object when nothing changes, so callers can skip the write", () => {
    expect(applyCodeChange(binding, { id: "qr_1", name: "Home network" })).toBe(binding);
    expect(applyCodeChange(binding, { id: "qr_other", name: "Office" })).toBe(binding);
    expect(applyCodeChange(binding, { id: "qr_1", name: undefined })).toBe(binding);
  });
});

describe("applyCodeRemoval", () => {
  it("marks tiles for the deleted code as removed", () => {
    expect(applyCodeRemoval(binding, "qr_1")).toEqual({ ...binding, removed: true });
  });

  it("leaves other tiles, and already-removed ones, untouched", () => {
    expect(applyCodeRemoval(binding, "qr_other")).toBe(binding);
    const removed = { ...binding, removed: true };
    expect(applyCodeRemoval(removed, "qr_1")).toBe(removed);
  });
});

describe("binding storage", () => {
  it("saves, reads back and removes a binding by widget id", async () => {
    await saveBinding(42, binding);
    expect(await getBinding(42)).toMatchObject({ ...binding, removed: false });
    expect(await getBinding("42")).toMatchObject({ codeId: "qr_1" });

    await removeBinding(42);
    expect(await getBinding(42)).toBeNull();
  });

  it("keeps both of two saves made at the same time", async () => {
    await Promise.all([saveBinding(1, binding), saveBinding(2, { ...binding, codeId: "qr_2" })]);
    const all = await listBindings();
    expect(Object.keys(all).sort()).toEqual(["1", "2"]);
  });

  it("survives a corrupt record instead of throwing", async () => {
    await AsyncStorage.setItem("xegqr:widgetBindings", "{not json");
    expect(await listBindings()).toEqual({});
  });

  it("updates only the bindings the updater changes, and reports them", async () => {
    await saveBinding(1, binding);
    await saveBinding(2, { ...binding, codeId: "qr_2", label: "Office" });

    const changed = await updateBindings((b) => applyCodeRemoval(b, "qr_1"));

    expect(changed).toHaveLength(1);
    expect(changed[0][0]).toBe("1");
    expect((await getBinding(1)).removed).toBe(true);
    expect((await getBinding(2)).removed).toBe(false);
  });
});
