import type { ParsedIntent } from "@/types";

export const SYSTEM_PROMPT = `You are SagePay's AI assistant. Parse user messages into financial intents.

Respond ONLY with valid JSON matching one of these formats:

1. Balance check:
{"type":"BALANCE"}

2. Send tokens:
{"type":"SEND","amount":100,"token":"USDC","toAddress":"0x..."}

3. Swap tokens:
{"type":"SWAP","amount":50,"token":"USDC","toToken":"ETH"}

4. Pay a service:
{"type":"PAY","serviceName":"Netflix","amount":15.99,"token":"USDC"}

5. Request payment (create a payment link):
{"type":"REQUEST","amount":25,"token":"USDC","recipientName":"Alice","memo":"dinner"}

6. Move/consolidate funds to lowest-fee chain:
{"type":"MOVE"}

7. Unknown/conversational:
{"type":"UNKNOWN","message":"friendly response here"}

Rules:
- Default token is USDC if not specified
- For "pay" commands, extract the service name
- For "request" commands, extract amount, optional recipient name, and optional memo/reason
- For "move", "optimize gas", "consolidate", "lowest fee" commands, use MOVE type
- Amounts should be numbers, not strings
- If the user is just chatting, respond with UNKNOWN and a helpful message
- Always respond with valid JSON only, no markdown`;

export function buildUserPrompt(message: string): string {
  return `Parse this message: "${message}"`;
}

/**
 * Fallback local parser for when the API is unavailable.
 */
export function parseIntentLocally(message: string): ParsedIntent {
  const lower = message.toLowerCase().trim();

  // Balance
  if (
    lower.includes("balance") ||
    lower.includes("how much") ||
    lower.includes("what do i have") ||
    lower.includes("my assets")
  ) {
    return { type: "BALANCE", raw: message };
  }

  // Move / consolidate
  if (
    lower.includes("move my funds") ||
    lower.includes("move funds") ||
    lower.includes("lowest fee") ||
    lower.includes("lowest-fee") ||
    lower.includes("optimize gas") ||
    lower.includes("consolidate") ||
    lower.includes("cheapest chain")
  ) {
    return { type: "MOVE", raw: message };
  }

  // Request payment
  const requestMatch = lower.match(
    /request\s+\$?([\d.]+)\s*(\w+)?\s*(?:from\s+(\w+))?\s*(?:for\s+(.+))?$/
  );
  if (requestMatch) {
    return {
      type: "REQUEST",
      amount: parseFloat(requestMatch[1]),
      token: requestMatch[2]?.toUpperCase() || "USDC",
      recipientName: requestMatch[3],
      memo: requestMatch[4]?.trim(),
      raw: message,
    };
  }

  // Send
  const sendMatch = lower.match(
    /send\s+\$?([\d.]+)\s*(\w+)?\s+to\s+(0x[a-fA-F0-9]{40})/
  );
  if (sendMatch) {
    return {
      type: "SEND",
      amount: parseFloat(sendMatch[1]),
      token: sendMatch[2]?.toUpperCase() || "USDC",
      toAddress: sendMatch[3],
      raw: message,
    };
  }

  // Swap
  const swapMatch = lower.match(
    /swap\s+\$?([\d.]+)\s*(\w+)?\s+(?:to|for|into)\s+(\w+)/
  );
  if (swapMatch) {
    return {
      type: "SWAP",
      amount: parseFloat(swapMatch[1]),
      token: swapMatch[2]?.toUpperCase() || "USDC",
      toToken: swapMatch[3].toUpperCase(),
      raw: message,
    };
  }

  // Pay
  const payMatch = lower.match(/pay\s+(.+?)(?:\s+\$?([\d.]+))?$/);
  if (payMatch) {
    return {
      type: "PAY",
      serviceName: payMatch[1].trim(),
      amount: payMatch[2] ? parseFloat(payMatch[2]) : undefined,
      raw: message,
    };
  }

  return { type: "UNKNOWN", raw: message };
}
