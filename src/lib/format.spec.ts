import { describe, expect, it } from "vitest";

import { formatDateTime, formatTime, maskPhone } from "./format";

describe("formatTime", () => {
  it("renders in local timezone, not UTC", () => {
    // 00:00 UTC is 03:00 in Europe/Istanbul (UTC+3)
    expect(formatTime("2026-01-01T00:00:00.000Z")).toContain("03:00");
  });
});

describe("formatDateTime", () => {
  it("renders the date + time in local timezone across a day rollover", () => {
    // 22:00 UTC on Jan 1 is 01:00 in Europe/Istanbul on Jan 2.
    const out = formatDateTime("2026-01-01T22:00:00.000Z");
    expect(out).toContain("02 Oca");
    expect(out).toContain("01:00");
  });
});

describe("maskPhone", () => {
  it("shows only the last 3 digits", () => {
    expect(maskPhone("+919876543210")).toBe("••210");
  });

  it("ignores non-digit characters", () => {
    expect(maskPhone("+91 98765 43210")).toBe("••210");
  });

  it("returns empty for a value with no digits", () => {
    expect(maskPhone("")).toBe("");
  });
});
