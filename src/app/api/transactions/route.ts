import { NextResponse } from "next/server";
import { createTransaction, listUserTransactions } from "@/lib/tx-store";
import { logger } from "@/lib/logger";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import * as Sentry from "@sentry/nextjs";

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const limiter = createRateLimiter({ limit: 30, windowMs: 60_000 });

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { limited } = limiter.check(ip);
  if (limited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { userAddress, type, amount, amountUsd, token, toAddress, toToken, sourceChains, settlementChain, particleTxId, linkId, chainId } = body;

    if (!userAddress || !type) {
      return NextResponse.json({ error: "userAddress and type are required" }, { status: 400 });
    }

    if (!ADDRESS_RE.test(userAddress)) {
      return NextResponse.json({ error: "Invalid address format" }, { status: 400 });
    }

    const tx = await createTransaction({
      userAddress: userAddress.toLowerCase(),
      type,
      amount: amount?.toString(),
      amountUsd: amountUsd?.toString(),
      token,
      toAddress,
      toToken,
      sourceChains: sourceChains ? JSON.stringify(sourceChains) : null,
      settlementChain,
      particleTxId,
      linkId,
      chainId,
    });

    logger.info("Transaction recorded", { txId: tx.id, type, userAddress });
    return NextResponse.json(tx, { status: 201 });
  } catch (error) {
    Sentry.captureException(error);
    logger.error("Failed to record transaction", { error: String(error) });
    return NextResponse.json({ error: "Failed to record transaction" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  if (!address) {
    return NextResponse.json({ error: "address query param required" }, { status: 400 });
  }

  if (!ADDRESS_RE.test(address)) {
    return NextResponse.json({ error: "Invalid address format" }, { status: 400 });
  }

  try {
    const result = await listUserTransactions(address, limit, offset);
    return NextResponse.json(result);
  } catch (error) {
    Sentry.captureException(error);
    logger.error("Failed to list transactions", { error: String(error) });
    return NextResponse.json({ error: "Failed to list transactions" }, { status: 500 });
  }
}
