import {
  buildWifi,
  buildVCard,
  buildMeCard,
  buildEmail,
  buildSms,
  buildPhone,
  buildGeo,
  buildEvent,
  buildCrypto,
  buildWhatsApp,
  buildPaypal,
  buildEpcPayment,
  buildOtp,
  buildSocial,
  buildAppStore,
  buildUrl,
  ensureProtocol,
  normalizePhone,
  toICalDate,
  defaultValuesFor,
  isFieldVisible,
  missingRequiredFields,
  buildPayload,
  QR_TYPES,
} from "../qrPayloads";

describe("escaping", () => {
  // The delimiter characters are the whole reason these formats need escaping —
  // an unescaped ';' in a password silently produces a code that joins a
  // different network, with no error anywhere.
  it("escapes delimiters in WiFi credentials", () => {
    const out = buildWifi({ ssid: "Cafe; Bar", password: 'p@ss:w"rd\\x', encryption: "WPA" });
    expect(out).toBe('WIFI:T:WPA;S:Cafe\\; Bar;P:p@ss\\:w\\"rd\\\\x;;');
  });

  it("omits the password entirely for an open network", () => {
    const out = buildWifi({ ssid: "Free", password: "ignored", encryption: "nopass" });
    expect(out).toBe("WIFI:T:nopass;S:Free;;");
    expect(out).not.toContain("ignored");
  });

  it("marks hidden networks", () => {
    expect(buildWifi({ ssid: "H", password: "p", encryption: "WPA", hidden: true })).toContain("H:true");
  });

  it("escapes vCard values per RFC 6350", () => {
    const out = buildVCard({ firstName: "A,B", lastName: "C;D", note: "line1\nline2" });
    expect(out).toContain("N:C\\;D;A\\,B;");
    expect(out).toContain("NOTE:line1\\nline2");
  });

  it("escapes MeCard values", () => {
    expect(buildMeCard({ firstName: "A", lastName: "B;C", phone: "+1 555 0100" }))
      .toBe("MECARD:N:B\\;C,A;TEL:+15550100;;");
  });
});

describe("phone and protocol normalising", () => {
  it("keeps a leading + and drops formatting", () => {
    expect(normalizePhone("+44 (0)20 7946-0958")).toBe("+442079460958");
    expect(normalizePhone("020 7946 0958")).toBe("02079460958");
  });

  it("keeps a bracketed North American area code but drops an international trunk prefix", () => {
    // The parentheses mean opposite things in these two formats.
    expect(normalizePhone("(555) 010-0100")).toBe("5550100100");
    expect(normalizePhone("+1 (555) 010-0100")).toBe("+15550100100");
    expect(normalizePhone("+49 (0) 30 123456")).toBe("+4930123456");
  });

  it("adds https to a bare domain but leaves real schemes alone", () => {
    expect(ensureProtocol("example.com")).toBe("https://example.com");
    expect(ensureProtocol("http://example.com")).toBe("http://example.com");
    expect(ensureProtocol("mailto:a@b.c")).toBe("mailto:a@b.c");
    expect(ensureProtocol("")).toBe("");
  });

  it("builds tel and url payloads", () => {
    expect(buildPhone({ phone: "555 0100" })).toBe("tel:5550100");
    expect(buildUrl({ url: "xegster.dev" })).toBe("https://xegster.dev");
  });
});

describe("query-string builders", () => {
  it("drops empty parameters instead of emitting bare keys", () => {
    expect(buildEmail({ to: "a@b.c", subject: "", body: "" })).toBe("mailto:a@b.c");
    expect(buildEmail({ to: "a@b.c", subject: "Hi there" })).toBe("mailto:a@b.c?subject=Hi%20there");
  });

  it("encodes an SMS body after the number", () => {
    expect(buildSms({ phone: "+15550100", message: "hello" })).toBe("SMSTO:+15550100:hello");
    expect(buildSms({ phone: "+15550100" })).toBe("SMSTO:+15550100");
  });

  it("strips the + for wa.me links", () => {
    expect(buildWhatsApp({ phone: "+1 555 0100", message: "hi" })).toBe("https://wa.me/15550100?text=hi");
  });

  it("builds a BIP-21 crypto URI", () => {
    expect(buildCrypto({ currency: "bitcoin", address: "bc1qxy", amount: "0.5" }))
      .toBe("bitcoin:bc1qxy?amount=0.5");
  });

  it("appends amount and currency to a PayPal.me link", () => {
    expect(buildPaypal({ username: "@sam", amount: "25", currency: "gbp" }))
      .toBe("https://paypal.me/sam/25GBP");
    expect(buildPaypal({ username: "sam" })).toBe("https://paypal.me/sam");
  });

  it("builds social and store links", () => {
    expect(buildSocial({ network: "x", handle: "@someone" })).toBe("https://x.com/someone");
    expect(buildAppStore({ store: "play", appId: "com.xegster.xegqr" }))
      .toBe("https://play.google.com/store/apps/details?id=com.xegster.xegqr");
    expect(buildAppStore({ store: "apple", appId: "id123456" })).toBe("https://apps.apple.com/app/id123456");
  });

  it("puts the counter on HOTP and the period on TOTP, never both", () => {
    const totp = buildOtp({ issuer: "Acme", account: "a@b.c", secret: "jbsw y3dp", otpType: "totp", period: "30", counter: "7" });
    expect(totp).toContain("period=30");
    expect(totp).not.toContain("counter=");
    expect(totp).toContain("secret=JBSWY3DP");

    const hotp = buildOtp({ issuer: "Acme", account: "a@b.c", secret: "JBSWY3DP", otpType: "hotp", period: "30", counter: "7" });
    expect(hotp).toContain("counter=7");
    expect(hotp).not.toContain("period=");
  });
});

describe("calendar events", () => {
  it("formats timed events as UTC stamps", () => {
    expect(toICalDate("2026-09-08T14:30:00Z")).toBe("20260908T143000Z");
  });

  it("formats all-day events as bare dates", () => {
    expect(toICalDate("2026-09-08T14:30:00Z", true)).toBe("20260908");
  });

  it("ignores an unparseable date rather than emitting garbage", () => {
    expect(toICalDate("not a date")).toBe("");
  });

  it("wraps the event in a VCALENDAR with DATE-valued all-day fields", () => {
    const out = buildEvent({
      title: "Launch",
      start: "2026-09-08T09:00:00Z",
      end: "2026-09-09T09:00:00Z",
      allDay: true,
    });
    expect(out).toContain("BEGIN:VCALENDAR");
    expect(out).toContain("DTSTART;VALUE=DATE:20260908");
    expect(out).toContain("END:VEVENT");
  });
});

describe("EPC payments", () => {
  it("keeps the fixed positional line order", () => {
    const lines = buildEpcPayment({ name: "Acme", iban: "DE89 3704 0044 0532 0130 00", amount: "12.50" }).split("\n");
    expect(lines[0]).toBe("BCD");
    expect(lines[3]).toBe("SCT");
    expect(lines[5]).toBe("Acme");
    expect(lines[6]).toBe("DE89370400440532013000");
    expect(lines[7]).toBe("EUR12.50");
    expect(lines).toHaveLength(12);
  });
});

describe("geo", () => {
  it("uses a query label when given, altitude otherwise", () => {
    expect(buildGeo({ latitude: "51.5", longitude: "-0.12" })).toBe("geo:51.5,-0.12");
    expect(buildGeo({ latitude: "51.5", longitude: "-0.12", altitude: "20" })).toBe("geo:51.5,-0.12,20");
    expect(buildGeo({ latitude: "51.5", longitude: "-0.12", query: "The Office" }))
      .toBe("geo:51.5,-0.12?q=The%20Office");
  });
});

describe("schema", () => {
  it("gives every type a unique id, an icon, a gradient and a builder", () => {
    const ids = QR_TYPES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const type of QR_TYPES) {
      expect(typeof type.build).toBe("function");
      expect(type.icon).toBeTruthy();
      expect(type.gradient).toBeTruthy();
      expect(type.fields.length).toBeGreaterThan(0);
    }
  });

  it("gives every field a unique key within its type", () => {
    for (const type of QR_TYPES) {
      const keys = type.fields.map((f) => f.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("seeds defaults from the schema", () => {
    const values = defaultValuesFor("wifi");
    expect(values.encryption).toBe("WPA");
    expect(values.hidden).toBe(false);
    expect(values.ssid).toBe("");
  });

  it("hides dependent fields when their guard fails", () => {
    const password = QR_TYPES.find((t) => t.id === "wifi").fields.find((f) => f.key === "password");
    expect(isFieldVisible(password, { encryption: "WPA" })).toBe(true);
    expect(isFieldVisible(password, { encryption: "nopass" })).toBe(false);
  });

  it("only reports required fields that are actually visible", () => {
    expect(missingRequiredFields("wifi", { ssid: "", encryption: "WPA" }))
      .toEqual(["Network name (SSID)"]);
    expect(missingRequiredFields("wifi", { ssid: "Home", encryption: "nopass" })).toEqual([]);
  });

  it("builds an empty string for an unknown type instead of throwing", () => {
    expect(buildPayload("does-not-exist", {})).toBe("");
  });

  it("routes through the right builder", () => {
    expect(buildPayload("wifi", { ssid: "Home", password: "pw", encryption: "WPA" }))
      .toBe("WIFI:T:WPA;S:Home;P:pw;;");
  });
});
