export const CHAINS = {
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
} as const;

export const DEFAULT_CHAIN = CHAINS.ARBITRUM_SEPOLIA;

export function getChainName(chainId: number): string {
  const chain = Object.values(CHAINS).find((c) => c.id === chainId);
  return chain?.name ?? `Chain ${chainId}`;
}

export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const chain = Object.values(CHAINS).find((c) => c.id === chainId);
  return chain ? `${chain.explorer}/tx/${txHash}` : `#`;
}
