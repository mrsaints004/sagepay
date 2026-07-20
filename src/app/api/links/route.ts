import { NextResponse } from "next/server";
import { createLink, getUserLinks } from "@/lib/db";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const limiter = createRateLimiter({ limit: 30, windowMs: 60_000 });

function sanitizeMemo(memo: unknown): string | undefined {
  if (typeof memo !== "string") return undefined;
  // Strip HTML tags and limit length
  const clean = memo.replace(/<[^>]*>/g, "").trim();
  return clean.length > 0 ? clean.slice(0, 200) : undefined;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { limited } = limiter.check(ip);
  if (limited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { creatorAddress, creatorEmail, amount, token, memo } = body;
    const idempotencyKey = request.headers.get("Idempotency-Key") ?? undefined;

    if (!creatorAddress || !amount) {
      return NextResponse.json(
        { error: "creatorAddress and amount are required" },
        { status: 400 }
      );
    }

    if (!ADDRESS_RE.test(creatorAddress)) {
      return NextResponse.json(
        { error: "Invalid address format" },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0 || numAmount > 1_000_000) {
      return NextResponse.json(
        { error: "Amount must be between 0 and 1,000,000" },
        { status: 400 }
      );
    }

    const link = await createLink({
      creatorAddress,
      creatorEmail,
      amount: numAmount,
      token: token || "USDC",
      memo: sanitizeMemo(memo),
      idempotencyKey,
    });

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    Sentry.captureException(error);
    logger.error("Create link error", { error: String(error) });
    return NextResponse.json({ error: "Failed to create link" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  if (!address) {
    return NextResponse.json({ error: "address query param required" }, { status: 400 });
  }

  if (!ADDRESS_RE.test(address)) {
    return NextResponse.json({ error: "Invalid address format" }, { status: 400 });
  }

  try {
    const result = await getUserLinks(address, limit, offset);
    return NextResponse.json(result);
  } catch (error) {
    Sentry.captureException(error);
    logger.error("Get links error", { error: String(error) });
    return NextResponse.json({ error: "Failed to fetch links" }, { status: 500 });
  }
}
