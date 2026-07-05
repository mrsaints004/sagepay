import { describe, it, expect } from "vitest";
import { getTokenAddress, resolveToken, TOKENS } from "../tokens";

describe("resolveToken", () => {
  it("resolves USDC directly", () => {
    expect(resolveToken("USDC")).toBe("USDC");
  });

  it("resolves ETH directly", () => {
    expect(resolveToken("ETH")).toBe("ETH");
  });

  it("is case-insensitive", () => {
    expect(resolveToken("usdc")).toBe("USDC");
    expect(resolveToken("eth")).toBe("ETH");
  });

  it("resolves DOLLAR alias to USDC", () => {
    expect(resolveToken("DOLLAR")).toBe("USDC");
  });

  it("resolves DOLLARS alias to USDC", () => {
    expect(resolveToken("DOLLARS")).toBe("USDC");
  });

  it("resolves USD alias to USDC", () => {
    expect(resolveToken("USD")).toBe("USDC");
  });

  it("resolves ETHER alias to ETH", () => {
    expect(resolveToken("ETHER")).toBe("ETH");
  });

  it("resolves ETHEREUM alias to ETH", () => {
    expect(resolveToken("ETHEREUM")).toBe("ETH");
  });

  it("returns unknown tokens as-is (uppercased)", () => {
    expect(resolveToken("DAI")).toBe("DAI");
  });

  it("trims whitespace", () => {
    expect(resolveToken("  USDC  ")).toBe("USDC");
  });
});

describe("getTokenAddress", () => {
  it("returns USDC address on Arbitrum Sepolia", () => {
    expect(getTokenAddress("USDC", 421614)).toBe(
      "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"
    );
  });

  it("returns USDC address on Ethereum Sepolia", () => {
    expect(getTokenAddress("USDC", 11155111)).toBe(
      "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
    );
  });

  it("returns USDC address on Base Sepolia", () => {
    expect(getTokenAddress("USDC", 84532)).toBe(
      "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
    );
  });

  it("returns native zero address for ETH", () => {
    expect(getTokenAddress("ETH", 421614)).toBe(
      "0x0000000000000000000000000000000000000000"
    );
  });

  it("is case-insensitive for symbol", () => {
    expect(getTokenAddress("usdc", 421614)).toBe(
      "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"
    );
  });

  it("returns undefined for unknown token", () => {
    expect(getTokenAddress("DAI", 421614)).toBeUndefined();
  });

  it("returns undefined for unknown chain", () => {
    expect(getTokenAddress("USDC", 99999)).toBeUndefined();
  });
});

describe("TOKENS constant", () => {
  it("has USDC and ETH entries", () => {
    expect(TOKENS.USDC).toBeDefined();
    expect(TOKENS.ETH).toBeDefined();
  });

  it("has addresses for all supported chains", () => {
    const chains = [421614, 11155111, 84532];
    for (const chain of chains) {
      expect(TOKENS.USDC[chain]).toBeDefined();
      expect(TOKENS.ETH[chain]).toBeDefined();
    }
  });
});
