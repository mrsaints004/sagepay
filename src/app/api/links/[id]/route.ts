import { NextResponse } from "next/server";
import { getLink, updateLink } from "@/lib/db";

const VALID_STATUSES = new Set(["paid", "expired"]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const link = await getLink(id);

  if (!link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  return NextResponse.json(link);
}

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
