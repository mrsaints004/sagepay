import { NextResponse } from "next/server";
import { getLink, updateLink } from "@/lib/db";

const VALID_STATUSES = new Set(["paid", "expired"]);
const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const link = await getLink(id);

  if (!link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  // Strip sensitive fields from public response
  const { creatorEmail: _, ...publicLink } = link;
  return NextResponse.json(publicLink);
}

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (body.status && !VALID_STATUSES.has(body.status)) {
    return NextResponse.json(
      { error: "Invalid status. Must be 'paid' or 'expired'" },
      { status: 400 }
    );
  }

  // Validate that the link exists and is still pending before marking as paid
  const existingLink = await getLink(id);
  if (!existingLink) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }
  if (existingLink.status !== "pending") {
    return NextResponse.json(
      { error: "Link has already been " + existingLink.status },
      { status: 409 }
    );
  }

  // Validate paidBy address if provided
  if (body.paidBy && !ADDRESS_RE.test(body.paidBy)) {
    return NextResponse.json({ error: "Invalid paidBy address" }, { status: 400 });
  }

  // Require txHash when marking as paid
  if (body.status === "paid" && !body.txHash) {
    return NextResponse.json(
      { error: "txHash is required when marking as paid" },
      { status: 400 }
    );
  }

  // Validate txHash format (allow both on-chain hashes and Particle tx IDs)
  if (body.txHash && typeof body.txHash === "string" && body.txHash.length > 200) {
    return NextResponse.json({ error: "Invalid txHash" }, { status: 400 });
  }

  const updated = await updateLink(id, {
    status: body.status,
    paidBy: body.paidBy,
    paidFromChain: body.paidFromChain,
    txHash: body.txHash,
  });

  if (!updated) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
