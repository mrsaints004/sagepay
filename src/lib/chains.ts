interface ChainConfig {
  id: number;
  name: string;
  rpcUrl: string;
  explorer: string;
  logo: string;
}

const TESTNET_CHAINS: Record<string, ChainConfig> = {
  ARBITRUM_SEPOLIA: {
    id: 421614,
    name: "Arbitrum Sepolia",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    explorer: "https://sepolia.arbiscan.io",
    logo: "/chains/arbitrum.svg",
  },
  ETHEREUM_SEPOLIA: {
    id: 11155111,
    name: "Ethereum Sepolia",
    rpcUrl: "https://rpc.sepolia.org",
    explorer: "https://sepolia.etherscan.io",
    logo: "/chains/ethereum.svg",
  },
  BASE_SEPOLIA: {
    id: 84532,
    name: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    explorer: "https://sepolia.basescan.org",
    logo: "/chains/base.svg",
  },
};

const MAINNET_CHAINS: Record<string, ChainConfig> = {
  ARBITRUM: {
    id: 42161,
    name: "Arbitrum One",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    explorer: "https://arbiscan.io",
    logo: "/chains/arbitrum.svg",
  },
  ETHEREUM: {
    id: 1,
    name: "Ethereum",
    rpcUrl: "https://eth.llamarpc.com",
    explorer: "https://etherscan.io",
    logo: "/chains/ethereum.svg",
  },
  BASE: {
    id: 8453,
    name: "Base",
    rpcUrl: "https://mainnet.base.org",
    explorer: "https://basescan.org",
    logo: "/chains/base.svg",
  },
};

function getChainEnv(): "testnet" | "mainnet" {
  return process.env.NEXT_PUBLIC_CHAIN_ENV === "mainnet" ? "mainnet" : "testnet";
}

export const CHAINS = getChainEnv() === "mainnet" ? MAINNET_CHAINS : TESTNET_CHAINS;

export function getDefaultChain(): ChainConfig {
  const chains = Object.values(CHAINS);
  return chains[0];
}

export function getChainName(chainId: number): string {
  const chain = Object.values(CHAINS).find((c) => c.id === chainId);
  return chain?.name ?? `Chain ${chainId}`;
}

export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const chain = Object.values(CHAINS).find((c) => c.id === chainId);
  return chain ? `${chain.explorer}/tx/${txHash}` : `#`;
}

export function getSupportedChainIds(): number[] {
  return Object.values(CHAINS).map((c) => c.id);
}

export function getChainNames(): Record<number, string> {
  const map: Record<number, string> = {};
  for (const chain of Object.values(CHAINS)) {
    map[chain.id] = chain.name;
  }
  // Include well-known chain names for SDK responses
  if (getChainEnv() === "testnet") {
    Object.assign(map, {
      1: "Ethereum",
      42161: "Arbitrum One",
      8453: "Base",
      10: "Optimism",
      137: "Polygon",
      56: "BNB Chain",
    });
  } else {
    Object.assign(map, {
      421614: "Arbitrum Sepolia",
      11155111: "Ethereum Sepolia",
      84532: "Base Sepolia",
    });
  }
  return map;
}
