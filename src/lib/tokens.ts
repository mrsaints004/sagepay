const TESTNET_TOKENS: Record<string, Record<number, string>> = {
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

const MAINNET_TOKENS: Record<string, Record<number, string>> = {
  USDC: {
    42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",  // Arbitrum
    1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",      // Ethereum
    8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",   // Base
  },
  ETH: {
    42161: "0x0000000000000000000000000000000000000000",
    1: "0x0000000000000000000000000000000000000000",
    8453: "0x0000000000000000000000000000000000000000",
  },
  USDT: {
    42161: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    1: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  },
};

function getChainEnv(): "testnet" | "mainnet" {
  return process.env.NEXT_PUBLIC_CHAIN_ENV === "mainnet" ? "mainnet" : "testnet";
}

export const TOKENS = getChainEnv() === "mainnet" ? MAINNET_TOKENS : TESTNET_TOKENS;

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
