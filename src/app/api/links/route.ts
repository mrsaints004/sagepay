import { NextResponse } from "next/server";
import { createLink, getUserLinks } from "@/lib/db";

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creatorAddress, creatorEmail, amount, token, memo } = body;

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
      memo,
    });

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error("Create link error:", error);
    return NextResponse.json({ error: "Failed to create link" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "address query param required" }, { status: 400 });
  }

  if (!ADDRESS_RE.test(address)) {
    return NextResponse.json({ error: "Invalid address format" }, { status: 400 });
  }

  const links = await getUserLinks(address);
  return NextResponse.json(links);
}
