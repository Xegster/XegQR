import * as store from "../../store";
import { create, update } from "../savedCodeRepository";

// An in-memory stand-in for the SQLite/IndexedDB store, so these tests cover
// the repository's own rules rather than the database.
jest.mock("../../store", () => {
  const records = new Map();
  return {
    getCode: jest.fn(async (id) => records.get(id) ?? null),
    putCode: jest.fn(async (code) => {
      records.set(code.id, code);
      return code;
    }),
    deleteCode: jest.fn(async (id) => {
      records.delete(id);
    }),
    allCodes: jest.fn(async () => [...records.values()]),
  };
});

const wifiValues = { ssid: "Cabin", password: "secret", encryption: "WPA" };

describe("update", () => {
  it("keeps the existing name when the change does not mention one", async () => {
    const code = await create({ name: "Home network", type: "wifi", values: wifiValues });
    const updated = await update(code.id, { style: { color: "#ff0000" } });
    expect(updated.name).toBe("Home network");
  });

  it("chooses a name, as create() does, when the name is cleared", async () => {
    // The column is NOT NULL: an undefined name used to fail the whole save.
    const code = await create({ name: "Home network", type: "wifi", values: wifiValues });
    for (const blank of ["", "   ", null]) {
      const updated = await update(code.id, { name: blank, values: wifiValues });
      expect(updated.name).toBe("Cabin");
      expect(store.putCode).toHaveBeenLastCalledWith(expect.objectContaining({ name: "Cabin" }));
    }
  });

  it("trims a new name", async () => {
    const code = await create({ name: "Home network", type: "wifi", values: wifiValues });
    expect((await update(code.id, { name: "  Guest Wi-Fi  " })).name).toBe("Guest Wi-Fi");
  });

  it("returns null for a code that does not exist", async () => {
    expect(await update("qr_missing", { name: "x" })).toBeNull();
  });
});
