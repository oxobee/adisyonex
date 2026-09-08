import { describe, expect, it } from "vitest";
import { NetgsmProvider } from "./netgsm.provider";

describe("NetgsmProvider", () => {
  const provider = new NetgsmProvider();

  it("parses standard incoming ringing webhook", () => {
    const payload = {
      caller: "05321234567",
      callee: "08503000000",
      callid: "call_abc_123",
      event: "ringing",
      dahili: "101",
    };

    const parsed = provider.parseWebhook(payload);
    expect(parsed).not.toBeNull();
    expect(parsed?.fromNumber).toBe("05321234567");
    expect(parsed?.normalizedFromNumber).toBe("+905321234567");
    expect(parsed?.toNumber).toBe("08503000000");
    expect(parsed?.providerCallId).toBe("call_abc_123");
    expect(parsed?.event).toBe("RINGING");
    expect(parsed?.sipExtension).toBe("101");
  });

  it("parses missed call webhook", () => {
    const payload = {
      caller_id: "5339998877",
      event: "missed",
    };

    const parsed = provider.parseWebhook(payload);
    expect(parsed).not.toBeNull();
    expect(parsed?.normalizedFromNumber).toBe("+905339998877");
    expect(parsed?.event).toBe("MISSED");
  });

  it("returns null when caller phone is missing", () => {
    const parsed = provider.parseWebhook({ some_other_key: "value" });
    expect(parsed).toBeNull();
  });
});
