"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import type { UnifiedBalance, Asset } from "@/types";
import { getUA } from "@/lib/particle";
import { getMagicProvider, signAuthorization } from "@/lib/eip7702";
import { withRetry, shouldRetryBlockchainOp } from "@/lib/retry";
import { getChainNames, getSupportedChainIds, getDefaultChain } from "@/lib/chains";
import { getTokenAddress } from "@/lib/tokens";
import type {
  IAsset,
  ITransaction,
} from "@particle-network/universal-account-sdk";

const CHAIN_NAMES = getChainNames();
const SUPPORTED_CHAINS = getSupportedChainIds();
const DEFAULT_CHAIN_ID = getDefaultChain().id;

export interface DelegationStatus {
  isDelegated: boolean;
  chains: Record<number, boolean>;
}

function mapAssets(sdkAssets: IAsset[]): Asset[] {
  const result: Asset[] = [];
  for (const asset of sdkAssets) {
    for (const chain of asset.chainAggregation) {
      if (chain.amountInUSD < 0.01) continue;
      result.push({
        symbol: (chain.token.symbol ?? asset.tokenType).toUpperCase(),
        name: chain.token.name ?? asset.tokenType.toUpperCase(),
        balance: chain.amount,
        balanceUSD: chain.amountInUSD,
        chain: CHAIN_NAMES[chain.token.chainId] ?? `Chain ${chain.token.chainId}`,
        chainId: chain.token.chainId,
        address: chain.token.address,
        logo: chain.token.image,
      });
    }
  }
  return result.sort((a, b) => b.balanceUSD - a.balanceUSD);
}

async function signTransaction(
  transaction: ITransaction
): Promise<{ signature: string; authorizations: { userOpHash: string; signature: string }[] }> {
  const provider = getMagicProvider();
  const authorizations: { userOpHash: string; signature: string }[] = [];
  const { userOps } = transaction;

  // Sign the transaction rootHash (per Particle SDK docs)
  const signature = (await provider.request({
    method: "personal_sign",
    params: [transaction.rootHash, userOps[0]?.userOp?.sender],
  })) as string;

  for (const op of userOps) {
    if (op.eip7702Auth && !op.eip7702Delegated) {
      try {
        const authResult = await signAuthorization({
          chainId: op.eip7702Auth.chainId ?? DEFAULT_CHAIN_ID,
          contractAddress: op.eip7702Auth.address ?? op.userOp.sender,
        });
        authorizations.push({
          userOpHash: op.userOpHash,
          signature: typeof authResult === "string" ? authResult : (authResult as { signature?: string })?.signature ?? signature,
        });
      } catch {
        const authSig = (await provider.request({
          method: "personal_sign",
          params: [op.userOpHash, op.userOp.sender],
        })) as string;
        authorizations.push({ userOpHash: op.userOpHash, signature: authSig });
      }
    }
  }

  return { signature, authorizations };
}

export interface SendTransactionResult {
  txId: string;
  sourceChains: string[];
  settlementChain: string;
}

export function useUniversalAccount() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<UnifiedBalance>({
    totalUSD: 0,
    assets: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [delegationStatus, setDelegationStatus] = useState<DelegationStatus>({
    isDelegated: false,
    chains: {},
  });
  const fetchedRef = useRef(false);

  const checkDelegation = useCallback(async () => {
    if (!user.address) return;
    try {
      const ua = getUA(user.address);
      const authResult = await ua.getEIP7702Auth(SUPPORTED_CHAINS) as Record<number, { delegated: boolean }> | null;
      if (authResult) {
        const chains: Record<number, boolean> = {};
        for (const chainId of SUPPORTED_CHAINS) {
          chains[chainId] = authResult[chainId]?.delegated ?? false;
        }
        const isDelegated = Object.values(chains).some(Boolean);
        setDelegationStatus({ isDelegated, chains });
      } else {
        // If getEIP7702Auth is not available, assume delegated since useEIP7702 is enabled
        const chains: Record<number, boolean> = {};
        for (const chainId of SUPPORTED_CHAINS) {
          chains[chainId] = true;
        }
        setDelegationStatus({ isDelegated: true, chains });
      }
    } catch (err) {
      console.warn("EIP-7702 delegation check failed:", err);
      // Don't assume delegation status on error — leave as unknown/false
      // so users can retry the upgrade if needed
    }
  }, [user.address]);

  const fetchBalance = useCallback(async (): Promise<UnifiedBalance> => {
    if (!user.address) return { totalUSD: 0, assets: [] };

    setIsLoading(true);
    try {
      const ua = getUA(user.address);
      const response = await withRetry(() => ua.getPrimaryAssets(), {
        shouldRetry: shouldRetryBlockchainOp,
      });
      const assets = mapAssets(response.assets);
      const result = { totalUSD: response.totalAmountInUSD, assets };
      setBalance(result);
      return result;
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      const empty = { totalUSD: 0, assets: [] };
      setBalance(empty);
      return empty;
    } finally {
      setIsLoading(false);
    }
  }, [user.address]);

  useEffect(() => {
    if (user.isLoggedIn && user.address && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchBalance();
      checkDelegation();
    }
    if (!user.isLoggedIn) {
      fetchedRef.current = false;
    }
  }, [user.isLoggedIn, user.address, fetchBalance, checkDelegation]);

  const sendTransaction = useCallback(
    async (to: string, amount: number, tokenSymbol: string): Promise<SendTransactionResult> => {
      if (!user.address) throw new Error("Not logged in");
      if (!amount || amount <= 0) throw new Error("Amount must be greater than 0");
      if (!to || !/^0x[a-fA-F0-9]{40}$/.test(to)) throw new Error("Invalid recipient address");

      const ua = getUA(user.address);

      const asset = balance.assets.find(
        (a) => a.symbol.toUpperCase() === tokenSymbol.toUpperCase()
      );

      const tokenAddress = asset?.address ?? "0x0000000000000000000000000000000000000000";
      const chainId = asset?.chainId ?? DEFAULT_CHAIN_ID;

      const transaction: ITransaction = await withRetry(
        () => ua.createTransferTransaction({
          token: { chainId, address: tokenAddress },
          amount: amount.toString(),
          receiver: to,
        }),
        { shouldRetry: shouldRetryBlockchainOp }
      );

      // Extract chain routing info from userOps
      const sourceChains = [...new Set(
        transaction.userOps.map(op => CHAIN_NAMES[op.chainId] ?? "Unknown")
      )];
      const settlementChain = CHAIN_NAMES[chainId] ?? "Unknown";

      const { signature, authorizations } = await signTransaction(transaction);
      const result = await ua.sendTransaction(transaction, signature, authorizations);

      return {
        txId: result.transactionId || transaction.transactionId,
        sourceChains,
        settlementChain,
      };
    },
    [user.address, balance.assets]
  );

  const swapTokens = useCallback(
    async (amountUSD: number, _fromToken: string, toTokenSymbol: string): Promise<SendTransactionResult> => {
      if (!user.address) throw new Error("Not logged in");
      if (!amountUSD || amountUSD <= 0) throw new Error("Amount must be greater than 0");

      const ua = getUA(user.address);

      const defaultChainId = SUPPORTED_CHAINS[0];
      const tokenAddress = getTokenAddress(toTokenSymbol, defaultChainId)
        ?? "0x0000000000000000000000000000000000000000";

      const target = { chainId: defaultChainId, address: tokenAddress };

      const transaction: ITransaction = await withRetry(
        () => ua.createBuyTransaction({
          token: { chainId: target.chainId, address: target.address },
          amountInUSD: amountUSD.toString(),
        }),
        { shouldRetry: shouldRetryBlockchainOp }
      );

      const sourceChains = [...new Set(
        transaction.userOps.map(op => CHAIN_NAMES[op.chainId] ?? "Unknown")
      )];

      const { signature, authorizations } = await signTransaction(transaction);
      const result = await ua.sendTransaction(transaction, signature, authorizations);

      return {
        txId: result.transactionId || transaction.transactionId,
        sourceChains,
        settlementChain: CHAIN_NAMES[target.chainId] ?? "Unknown",
      };
    },
    [user.address]
  );

  const moveToLowestFee = useCallback(async (): Promise<{ chain: string; txId: string }> => {
    if (!user.address) throw new Error("Not logged in");

    const ua = getUA(user.address);
    const response = await ua.getPrimaryAssets();
    const assets = mapAssets(response.assets);

    const chainTotals: Record<number, { name: string; total: number }> = {};
    for (const a of assets) {
      if (!chainTotals[a.chainId]) {
        chainTotals[a.chainId] = { name: a.chain, total: 0 };
      }
      chainTotals[a.chainId].total += a.balanceUSD;
    }

    let bestChainId = DEFAULT_CHAIN_ID;
    let bestName = CHAIN_NAMES[DEFAULT_CHAIN_ID] ?? "Unknown";
    let bestTotal = 0;

    // Prefer L2 chains (first two supported chains, typically Arbitrum and Base)
    const l2Preference = SUPPORTED_CHAINS.filter((id) => id !== 1 && id !== 11155111);
    for (const chainId of l2Preference) {
      if (chainTotals[chainId] && chainTotals[chainId].total > bestTotal) {
        bestChainId = chainId;
        bestName = chainTotals[chainId].name;
        bestTotal = chainTotals[chainId].total;
      }
    }

    const targetToken = {
      chainId: bestChainId,
      address: getTokenAddress("USDC", bestChainId)
        ?? "0x0000000000000000000000000000000000000000",
    };

    const otherChainValue = assets
      .filter((a) => a.chainId !== bestChainId)
      .reduce((sum, a) => sum + a.balanceUSD, 0);

    if (otherChainValue < 0.01) {
      return { chain: bestName, txId: "no-op" };
    }

    const transaction: ITransaction = await withRetry(
      () => ua.createBuyTransaction({
        token: targetToken,
        amountInUSD: otherChainValue.toFixed(2),
      }),
      { shouldRetry: shouldRetryBlockchainOp }
    );

    const { signature, authorizations } = await signTransaction(transaction);
    const result = await ua.sendTransaction(transaction, signature, authorizations);

    return {
      chain: bestName,
      txId: result.transactionId || transaction.transactionId,
    };
  }, [user.address]);

  return {
    balance,
    isLoading,
    fetchBalance,
    sendTransaction,
    swapTokens,
    moveToLowestFee,
    delegationStatus,
    checkDelegation,
  };
}
