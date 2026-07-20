"use client";

import { useState, useCallback } from "react";
import type { ChatMessage, ParsedIntent } from "@/types";
import { generateId, formatUSD } from "@/lib/utils";
import { parseIntentLocally } from "@/lib/intent-parser";
import { useUniversalAccount } from "./useUniversalAccount";
import { useTransactionPoller } from "./useTransactionPoller";
import { useAuth } from "@/context/AuthContext";

async function recordTransaction(data: {
  userAddress: string;
  type: string;
  amount?: number;
  token?: string;
  toAddress?: string;
  toToken?: string;
  sourceChains?: string[];
  settlementChain?: string;
  particleTxId?: string;
  linkId?: string;
}) {
  try {
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        amountUsd: data.amount?.toString(),
        amount: data.amount?.toString(),
      }),
    });
  } catch (err) {
    // Non-critical: don't block UX if recording fails
    console.warn("Failed to record transaction:", err);
  }
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<ParsedIntent | null>(null);
  const { fetchBalance, sendTransaction, swapTokens, moveToLowestFee } =
    useUniversalAccount();
  const { poll } = useTransactionPoller();
  const { user } = useAuth();

  const addMessage = useCallback((msg: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: generateId(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMsg]);
    return newMsg;
  }, []);

  // Poll for on-chain confirmation in the background
  const pollConfirmation = useCallback(
    (txId: string, messageId: string) => {
      poll(txId).then((result) => {
        if (result.status === "confirmed") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId && m.txStatus?.state !== "failed"
                ? { ...m, txStatus: { ...m.txStatus!, state: "confirmed" } }
                : m
            )
          );
          fetchBalance();
        } else if (result.status === "failed") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    content: "Transaction failed on-chain. Please try again.",
                    txStatus: { ...m.txStatus!, state: "failed", error: "Transaction failed on-chain" },
                  }
                : m
            )
          );
        } else if (result.status === "timeout") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    content: "Transaction confirmation timed out. It may still complete — check your balance.",
                    txStatus: { ...m.txStatus!, state: "failed", error: "Confirmation timed out" },
                  }
                : m
            )
          );
          fetchBalance();
        }
      });
    },
    [poll, fetchBalance]
  );

  const parseIntent = useCallback(async (message: string): Promise<ParsedIntent> => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      return { ...data, raw: message };
    } catch {
      return parseIntentLocally(message);
    }
  }, []);

  const executeIntent = useCallback(
    async (intent: ParsedIntent) => {
      switch (intent.type) {
        case "BALANCE": {
          const b = await fetchBalance();
          const assetLines = b.assets
            .map((a) => `  ${a.symbol} on ${a.chain}: ${a.balance} (${formatUSD(a.balanceUSD)})`)
            .join("\n");

          addMessage({
            role: "assistant",
            content: `Your unified balance is ${formatUSD(b.totalUSD)}\n\n${assetLines || "  No assets found."}`,
            intent,
          });
          break;
        }

        case "SEND": {
          if (!intent.toAddress || !/^0x[a-fA-F0-9]{40}$/.test(intent.toAddress)) {
            addMessage({
              role: "assistant",
              content: "Please provide a valid recipient address (0x...).\n\nExample: \"Send 100 USDC to 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18\"",
            });
            break;
          }
          if (!intent.amount || intent.amount <= 0) {
            addMessage({
              role: "assistant",
              content: "Please specify an amount to send.\n\nExample: \"Send 100 USDC to 0x742d...\"",
            });
            break;
          }
          setPendingConfirmation(intent);
          addMessage({
            role: "assistant",
            content: `Send ${intent.amount} ${intent.token || "USDC"} to ${intent.toAddress}?\n\nFunds will be routed cross-chain via EIP-7702.\nPlease confirm to proceed.`,
            intent,
          });
          break;
        }

        case "SWAP": {
          if (!intent.amount || intent.amount <= 0) {
            addMessage({
              role: "assistant",
              content: "Please specify an amount to swap.\n\nExample: \"Swap 50 USDC to ETH\"",
            });
            break;
          }
          if (!intent.toToken) {
            addMessage({
              role: "assistant",
              content: "Please specify which token to swap to.\n\nExample: \"Swap 50 USDC to ETH\"",
            });
            break;
          }
          setPendingConfirmation(intent);
          addMessage({
            role: "assistant",
            content: `Swap ~$${intent.amount} worth of ${intent.token || "USDC"} to ${intent.toToken}?\n\nCross-chain routing will find the best rate.\nPlease confirm to proceed.`,
            intent,
          });
          break;
        }

        case "PAY": {
          // Convert service payments to actionable options
          const payAmount = intent.amount ? `${intent.amount} ` : "";
          const payToken = intent.token || "USDC";
          addMessage({
            role: "assistant",
            content: `To pay ${intent.serviceName}${intent.amount ? ` $${intent.amount}` : ""}, you can:\n\n1. **Send directly** — type "Send ${payAmount}${payToken} to 0x..." with the recipient address\n2. **Create a payment link** — type "Request $${intent.amount || "25"} for ${intent.serviceName}"`,
            intent,
          });
          break;
        }

        case "REQUEST": {
          try {
            const res = await fetch("/api/links", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                creatorAddress: user.address,
                creatorEmail: user.email,
                amount: intent.amount,
                token: intent.token || "USDC",
                memo: intent.memo || intent.recipientName,
              }),
            });

            if (!res.ok) throw new Error("Failed to create link");
            const link = await res.json();

            const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
            const linkUrl = `${baseUrl}/pay/${link.id}`;

            addMessage({
              role: "assistant",
              content: `Payment link created!\n\n${formatUSD(intent.amount || 0)} ${intent.token || "USDC"}${intent.memo ? ` -- "${intent.memo}"` : ""}${intent.recipientName ? `\nFor: ${intent.recipientName}` : ""}\n\nShare: ${linkUrl}`,
              intent,
            });
          } catch {
            addMessage({
              role: "assistant",
              content: "Failed to create payment link. Please try again.",
            });
          }
          break;
        }

        case "MOVE": {
          setPendingConfirmation(intent);
          addMessage({
            role: "assistant",
            content: `Move all assets to the lowest-fee chain (Arbitrum)?\n\nThis will consolidate your funds for minimal gas costs. Confirm to proceed.`,
            intent,
          });
          break;
        }

        default: {
          addMessage({
            role: "assistant",
            content:
              'I can help with:\n\n  "What\'s my balance?"\n  "Send 100 USDC to 0x..."\n  "Swap 50 USDC to ETH"\n  "Request $25 for dinner"\n  "Move funds to lowest-fee chain"\n  "Show cross-chain assets"',
          });
        }
      }
    },
    [fetchBalance, addMessage, user.address, user.email]
  );

  const confirmTransaction = useCallback(async () => {
    if (!pendingConfirmation) return;

    const intent = pendingConfirmation;
    setPendingConfirmation(null);

    const statusMsg = addMessage({
      role: "assistant",
      content: "Processing transaction...",
      txStatus: { state: "pending" },
    });

    try {
      if (intent.type === "SEND") {
        if (!intent.toAddress) {
          throw new Error("No recipient address specified");
        }
        const result = await sendTransaction(
          intent.toAddress,
          intent.amount || 0,
          intent.token || "USDC"
        );

        const routeInfo = result.sourceChains.length > 0
          ? `\nRouted: ${result.sourceChains.join(", ")} -> ${result.settlementChain}`
          : "";

        setMessages((prev) =>
          prev.map((m) =>
            m.id === statusMsg.id
              ? {
                  ...m,
                  content: `Transaction submitted.${routeInfo}`,
                  txStatus: {
                    state: "confirming",
                    txHash: result.txId,
                    chain: result.settlementChain,
                    sourceChains: result.sourceChains,
                    settlementChain: result.settlementChain,
                  },
                }
              : m
          )
        );

        pollConfirmation(result.txId, statusMsg.id);

        if (user.address) {
          recordTransaction({
            userAddress: user.address,
            type: "send",
            amount: intent.amount,
            token: intent.token || "USDC",
            toAddress: intent.toAddress,
            sourceChains: result.sourceChains,
            settlementChain: result.settlementChain,
            particleTxId: result.txId,
          });
        }
      } else if (intent.type === "SWAP") {
        const result = await swapTokens(
          intent.amount || 0,
          intent.token || "USDC",
          intent.toToken || "ETH"
        );

        const routeInfo = result.sourceChains.length > 0
          ? `\nRouted: ${result.sourceChains.join(", ")} -> ${result.settlementChain}`
          : "";

        setMessages((prev) =>
          prev.map((m) =>
            m.id === statusMsg.id
              ? {
                  ...m,
                  content: `Swap submitted.${routeInfo}`,
                  txStatus: {
                    state: "confirming",
                    txHash: result.txId,
                    chain: result.settlementChain,
                    sourceChains: result.sourceChains,
                    settlementChain: result.settlementChain,
                  },
                }
              : m
          )
        );

        pollConfirmation(result.txId, statusMsg.id);

        if (user.address) {
          recordTransaction({
            userAddress: user.address,
            type: "swap",
            amount: intent.amount,
            token: intent.token || "USDC",
            toToken: intent.toToken,
            sourceChains: result.sourceChains,
            settlementChain: result.settlementChain,
            particleTxId: result.txId,
          });
        }
      } else if (intent.type === "MOVE") {
        const result = await moveToLowestFee();

        if (result.txId === "no-op") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === statusMsg.id
                ? {
                    ...m,
                    content: `Your funds are already consolidated on ${result.chain}. No action needed.`,
                    txStatus: { state: "confirmed", chain: result.chain },
                  }
                : m
            )
          );
          fetchBalance();
          return;
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === statusMsg.id
              ? {
                  ...m,
                  content: `Funds consolidating to ${result.chain}...`,
                  txStatus: {
                    state: "confirming",
                    txHash: result.txId,
                    chain: result.chain,
                    settlementChain: result.chain,
                  },
                }
              : m
          )
        );

        pollConfirmation(result.txId, statusMsg.id);

        if (user.address) {
          recordTransaction({
            userAddress: user.address,
            type: "move",
            settlementChain: result.chain,
            particleTxId: result.txId,
          });
        }
      } else {
        return;
      }

      fetchBalance();
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === statusMsg.id
            ? {
                ...m,
                content: `Transaction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
                txStatus: {
                  state: "failed",
                  error: error instanceof Error ? error.message : "Unknown error",
                },
              }
            : m
        )
      );
    }
  }, [pendingConfirmation, addMessage, sendTransaction, swapTokens, moveToLowestFee, fetchBalance, pollConfirmation, user.address]);

  const cancelTransaction = useCallback(() => {
    setPendingConfirmation(null);
    addMessage({ role: "assistant", content: "Transaction cancelled." });
  }, [addMessage]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isProcessing) return;

      addMessage({ role: "user", content });
      setIsProcessing(true);

      try {
        const intent = await parseIntent(content);
        await executeIntent(intent);
      } catch {
        addMessage({ role: "assistant", content: "Something went wrong. Please try again." });
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, addMessage, parseIntent, executeIntent]
  );

  return {
    messages,
    isProcessing,
    pendingConfirmation,
    sendMessage,
    confirmTransaction,
    cancelTransaction,
  };
}
