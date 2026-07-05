import { describe, it, expect } from "vitest";
import { parseIntentLocally } from "../intent-parser";

describe("parseIntentLocally", () => {
  it("parses BALANCE intent", () => {
    const result = parseIntentLocally("What's my balance?");
    expect(result.type).toBe("BALANCE");
  });

  it("parses BALANCE from 'how much' phrasing", () => {
    const result = parseIntentLocally("how much do I have");
    expect(result.type).toBe("BALANCE");
  });

  it("parses BALANCE from 'my assets' phrasing", () => {
    const result = parseIntentLocally("show my assets");
    expect(result.type).toBe("BALANCE");
  });

  it("parses SEND intent with address", () => {
    const result = parseIntentLocally(
      "send 100 USDC to 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18"
    );
    expect(result.type).toBe("SEND");
    expect(result.amount).toBe(100);
    expect(result.token).toBe("USDC");
    expect(result.toAddress?.toLowerCase()).toBe("0x742d35cc6634c0532925a3b844bc9e7595f2bd18");
  });

  it("parses SWAP intent", () => {
    const result = parseIntentLocally("swap 50 USDC to ETH");
    expect(result.type).toBe("SWAP");
    expect(result.amount).toBe(50);
    expect(result.token).toBe("USDC");
    expect(result.toToken).toBe("ETH");
  });

  it("parses SWAP with 'for' keyword", () => {
    const result = parseIntentLocally("swap 25 ETH for USDC");
    expect(result.type).toBe("SWAP");
    expect(result.amount).toBe(25);
    expect(result.toToken).toBe("USDC");
  });

  it("parses PAY intent", () => {
    const result = parseIntentLocally("pay Netflix 15.99");
    expect(result.type).toBe("PAY");
    expect(result.serviceName).toBe("netflix");
    expect(result.amount).toBe(15.99);
  });

  it("parses PAY intent without amount", () => {
    const result = parseIntentLocally("pay Spotify");
    expect(result.type).toBe("PAY");
    expect(result.serviceName).toBe("spotify");
    expect(result.amount).toBeUndefined();
  });

  it("parses REQUEST intent", () => {
    const result = parseIntentLocally("request $25 for dinner");
    expect(result.type).toBe("REQUEST");
    expect(result.amount).toBe(25);
  });

  it("parses MOVE intent from 'move funds'", () => {
    const result = parseIntentLocally("move my funds to lowest fee chain");
    expect(result.type).toBe("MOVE");
  });

  it("parses MOVE intent from 'consolidate'", () => {
    const result = parseIntentLocally("consolidate funds");
    expect(result.type).toBe("MOVE");
  });

  it("parses MOVE intent from 'cheapest chain'", () => {
    const result = parseIntentLocally("move to cheapest chain");
    expect(result.type).toBe("MOVE");
  });

  it("parses MOVE intent from 'optimize gas'", () => {
    const result = parseIntentLocally("optimize gas costs");
    expect(result.type).toBe("MOVE");
  });

  it("returns UNKNOWN for unrecognized input", () => {
    const result = parseIntentLocally("hello there");
    expect(result.type).toBe("UNKNOWN");
    expect(result.raw).toBe("hello there");
  });

  it("preserves raw message", () => {
    const msg = "What's my balance?";
    const result = parseIntentLocally(msg);
    expect(result.raw).toBe(msg);
  });
});
