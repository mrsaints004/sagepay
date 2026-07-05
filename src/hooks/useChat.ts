"use client";

import { useState, useCallback, useRef } from "react";
import type { ChatMessage, ParsedIntent } from "@/types";
import { generateId, formatUSD } from "@/lib/utils";
import { parseIntentLocally } from "@/lib/intent-parser";
import { useUniversalAccount } from "./useUniversalAccount";
import { useAuth } from "@/context/AuthContext";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<ParsedIntent | null>(null);
  const { balance, fetchBalance, sendTransaction, swapTokens, moveToLowestFee } =
    useUniversalAccount();
  const { user } = useAuth();

  const balanceRef = useRef(balance);
  balanceRef.current = balance;

  const addMessage = useCallback((msg: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: generateId(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMsg]);
    return newMsg;
  }, []);

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
          await fetchBalance();
          const b = balanceRef.current;
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
          setPendingConfirmation(intent);
          addMessage({
            role: "assistant",
            content: `Send ${intent.amount} ${intent.token || "USDC"} to ${intent.toAddress}?\n\nFunds will be routed cross-chain via EIP-7702.\nPlease confirm to proceed.`,
            intent,
          });
          break;
        }

        case "SWAP": {
          setPendingConfirmation(intent);
          addMessage({
            role: "assistant",
            content: `Swap ${intent.amount} ${intent.token || "USDC"} to ${intent.toToken}?\n\nCross-chain routing will find the best rate.\nPlease confirm to proceed.`,
            intent,
          });
          break;
        }

        case "PAY": {
          setPendingConfirmation(intent);
          addMessage({
            role: "assistant",
            content: `Pay ${intent.serviceName}${intent.amount ? ` $${intent.amount}` : ""}?\n\nPlease confirm to proceed.`,
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
      if (intent.type === "SEND" || intent.type === "PAY") {
        const result = await sendTransaction(
          intent.toAddress || "0x0000000000000000000000000000000000000000",
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
                  content: `Transaction confirmed.${routeInfo}`,
                  txStatus: {
                    state: "confirmed",
                    txHash: result.txId,
                    chain: result.settlementChain,
                    sourceChains: result.sourceChains,
                    settlementChain: result.settlementChain,
                  },
                }
              : m
          )
        );
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
                  content: `Swap confirmed.${routeInfo}`,
                  txStatus: {
                    state: "confirmed",
                    txHash: result.txId,
                    chain: result.settlementChain,
                    sourceChains: result.sourceChains,
                    settlementChain: result.settlementChain,
                  },
                }
              : m
          )
        );
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
                  content: `Funds consolidated to ${result.chain}.`,
                  txStatus: {
                    state: "confirmed",
                    txHash: result.txId,
                    chain: result.chain,
                    settlementChain: result.chain,
                  },
                }
              : m
          )
        );
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
                content: "Transaction failed.",
                txStatus: {
                  state: "failed",
                  error: error instanceof Error ? error.message : "Unknown error",
                },
              }
            : m
        )
      );
    }
  }, [pendingConfirmation, addMessage, sendTransaction, swapTokens, moveToLowestFee, fetchBalance]);

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
