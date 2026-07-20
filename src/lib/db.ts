import type { PaymentLink } from "@/types";
import { nanoid } from "nanoid";

const usePostgres = !!process.env.DATABASE_URL || !!process.env.POSTGRES_URL;

// ── In-memory store (used when no DB is configured) ─────────────────────────

const memoryStore = new Map<string, PaymentLink>();
const idempotencyMap = new Map<string, string>();

function memCreateLink(data: {
  creatorAddress: string;
  creatorEmail?: string;
  amount: number;
  token: string;
  memo?: string;
  idempotencyKey?: string;
}): PaymentLink {
  if (data.idempotencyKey && idempotencyMap.has(data.idempotencyKey)) {
    const existing = memoryStore.get(idempotencyMap.get(data.idempotencyKey)!);
    if (existing) return existing;
  }

  const id = nanoid(10);
  const link: PaymentLink = {
    id,
    creatorAddress: data.creatorAddress.toLowerCase(),
    creatorEmail: data.creatorEmail,
    amount: data.amount,
    token: data.token || "USDC",
    memo: data.memo,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  memoryStore.set(id, link);
  if (data.idempotencyKey) idempotencyMap.set(data.idempotencyKey, id);
  return link;
}

function memGetLink(id: string): PaymentLink | undefined {
  return memoryStore.get(id);
}

function memGetUserLinks(
  address: string,
  limit: number,
  offset: number
): { items: PaymentLink[]; total: number } {
  const addr = address.toLowerCase();
  const all = [...memoryStore.values()]
    .filter((l) => l.creatorAddress === addr)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return { items: all.slice(offset, offset + limit), total: all.length };
}

function memUpdateLink(
  id: string,
  data: Partial<Pick<PaymentLink, "status" | "paidBy" | "paidFromChain" | "txHash">>
): PaymentLink | undefined {
  const link = memoryStore.get(id);
  if (!link) return undefined;
  const updated = { ...link, ...data };
  memoryStore.set(id, updated);
  return updated;
}

// ── Postgres (Drizzle) implementation ───────────────────────────────────────

async function pgModule() {
  const { db } = await import("./drizzle");
  const { paymentLinks } = await import("./schema");
  const { eq, desc, sql } = await import("drizzle-orm");
  return { db, paymentLinks, eq, desc, sql };
}

import type { PaymentLinkRow } from "./schema";

function rowToPaymentLink(row: PaymentLinkRow): PaymentLink {
  return {
    id: row.id,
    creatorAddress: row.creatorAddress,
    creatorEmail: row.creatorEmail ?? undefined,
    amount: Number(row.amount),
    token: row.token,
    memo: row.memo ?? undefined,
    status: row.status as PaymentLink["status"],
    createdAt: row.createdAt.toISOString(),
    paidBy: row.paidBy ?? undefined,
    paidFromChain: row.paidFromChain ?? undefined,
    txHash: row.txHash ?? undefined,
  };
}

// ── Exported API ────────────────────────────────────────────────────────────

export async function createLink(data: {
  creatorAddress: string;
  creatorEmail?: string;
  amount: number;
  token: string;
  memo?: string;
  idempotencyKey?: string;
}): Promise<PaymentLink> {
  if (!usePostgres) return memCreateLink(data);

  const { db, paymentLinks, eq } = await pgModule();

  if (data.idempotencyKey) {
    const [existing] = await db
      .select()
      .from(paymentLinks)
      .where(eq(paymentLinks.idempotencyKey, data.idempotencyKey))
      .limit(1);
    if (existing) return rowToPaymentLink(existing);
  }

  const id = nanoid(10);
  const [row] = await db
    .insert(paymentLinks)
    .values({
      id,
      idempotencyKey: data.idempotencyKey ?? null,
      creatorAddress: data.creatorAddress.toLowerCase(),
      creatorEmail: data.creatorEmail,
      amount: data.amount.toString(),
      token: data.token || "USDC",
      memo: data.memo,
    })
    .returning();

  return rowToPaymentLink(row);
}

export async function getLink(id: string): Promise<PaymentLink | undefined> {
  if (!usePostgres) return memGetLink(id);

  const { db, paymentLinks, eq } = await pgModule();
  const [row] = await db
    .select()
    .from(paymentLinks)
    .where(eq(paymentLinks.id, id))
    .limit(1);
  return row ? rowToPaymentLink(row) : undefined;
}

export async function getUserLinks(
  address: string,
  limit = 50,
  offset = 0
): Promise<{ items: PaymentLink[]; total: number }> {
  if (!usePostgres) return memGetUserLinks(address, limit, offset);

  const { db, paymentLinks, eq, desc, sql } = await pgModule();
  const addr = address.toLowerCase();
  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(paymentLinks)
      .where(eq(paymentLinks.creatorAddress, addr))
      .orderBy(desc(paymentLinks.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(paymentLinks)
      .where(eq(paymentLinks.creatorAddress, addr)),
  ]);
  return {
    items: rows.map(rowToPaymentLink),
    total: count,
  };
}

export async function updateLink(
  id: string,
  data: Partial<Pick<PaymentLink, "status" | "paidBy" | "paidFromChain" | "txHash">>
): Promise<PaymentLink | undefined> {
  if (!usePostgres) return memUpdateLink(id, data);

  const { db, paymentLinks, eq, sql } = await pgModule();
  const [row] = await db
    .update(paymentLinks)
    .set({
      ...data,
      updatedAt: sql`now()`,
    })
    .where(eq(paymentLinks.id, id))
    .returning();
  return row ? rowToPaymentLink(row) : undefined;
}
