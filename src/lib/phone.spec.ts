import { describe, expect, it } from "vitest";
import { formatPhoneForDisplay, getPhoneSearchVariations, normalizePhoneNumber } from "./phone";

describe("phone utilities", () => {
  it("normalizes various formats to standard +905XXXXXXXXX", () => {
    const expected = "+905321234567";
    expect(normalizePhoneNumber("05321234567")).toBe(expected);
    expect(normalizePhoneNumber("5321234567")).toBe(expected);
    expect(normalizePhoneNumber("+905321234567")).toBe(expected);
    expect(normalizePhoneNumber("00905321234567")).toBe(expected);
    expect(normalizePhoneNumber("905321234567")).toBe(expected);
    expect(normalizePhoneNumber("0 (532) 123 45 67")).toBe(expected);
    expect(normalizePhoneNumber("+90 532 123-45-67")).toBe(expected);
  });

  it("normalizes Turkish landlines", () => {
    expect(normalizePhoneNumber("02123456789")).toBe("+902123456789");
    expect(normalizePhoneNumber("2123456789")).toBe("+902123456789");
    expect(normalizePhoneNumber("+902123456789")).toBe("+902123456789");
  });

  it("generates comprehensive search variations", () => {
    const variations = getPhoneSearchVariations("05321234567");
    expect(variations).toContain("+905321234567");
    expect(variations).toContain("05321234567");
    expect(variations).toContain("5321234567");
    expect(variations).toContain("905321234567");
  });

  it("formats phone for friendly display", () => {
    expect(formatPhoneForDisplay("+905321234567")).toBe("0 (532) 123 45 67");
    expect(formatPhoneForDisplay("05321234567")).toBe("0 (532) 123 45 67");
    expect(formatPhoneForDisplay("5321234567")).toBe("0 (532) 123 45 67");
  });
});
