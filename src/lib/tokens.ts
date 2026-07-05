export const TOKENS: Record<string, Record<number, string>> = {
  USDC: {
    421614: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d", // Arbitrum Sepolia
    11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Ethereum Sepolia
    84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",   // Base Sepolia
  },
  ETH: {
    421614: "0x0000000000000000000000000000000000000000",
    11155111: "0x0000000000000000000000000000000000000000",
    84532: "0x0000000000000000000000000000000000000000",
  },
};

export function getTokenAddress(symbol: string, chainId: number): string | undefined {
  return TOKENS[symbol.toUpperCase()]?.[chainId];
}

export function resolveToken(input: string): string {
  const normalized = input.toUpperCase().trim();
  if (TOKENS[normalized]) return normalized;
  const aliases: Record<string, string> = {
    DOLLAR: "USDC",
    DOLLARS: "USDC",
    USD: "USDC",
    ETHER: "ETH",
    ETHEREUM: "ETH",
  };
  return aliases[normalized] ?? normalized;
}
