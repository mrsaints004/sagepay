import type { TransactionRow, NewTransaction } from "./schema";
import { nanoid } from "nanoid";

const usePostgres = !!process.env.DATABASE_URL || !!process.env.POSTGRES_URL;

// ── In-memory fallback ──────────────────────────────────────────────────────

const memTxStore = new Map<string, TransactionRow>();

function toRow(
  id: string,
  data: Omit<NewTransaction, "id" | "createdAt" | "updatedAt">
): TransactionRow {
  const now = new Date();
  return {
    id,
    userAddress: data.userAddress,
    type: data.type,
    status: data.status ?? "pending",
    amount: data.amount ?? null,
    amountUsd: data.amountUsd ?? null,
    token: data.token ?? null,
    toAddress: data.toAddress ?? null,
    toToken: data.toToken ?? null,
    sourceChains: data.sourceChains ?? null,
    settlementChain: data.settlementChain ?? null,
    txHash: data.txHash ?? null,
    particleTxId: data.particleTxId ?? null,
    linkId: data.linkId ?? null,
    error: data.error ?? null,
    metadata: data.metadata ?? null,
    chainId: data.chainId ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

// ── Postgres helpers ────────────────────────────────────────────────────────

async function pgModule() {
  const { db } = await import("./drizzle");
  const { transactions } = await import("./schema");
  const { eq, desc, sql, and } = await import("drizzle-orm");
  return { db, transactions, eq, desc, sql, and };
}

// ── Exported API ────────────────────────────────────────────────────────────

export async function createTransaction(
  data: Omit<NewTransaction, "id" | "createdAt" | "updatedAt">
): Promise<TransactionRow> {
  const id = nanoid(12);

  if (!usePostgres) {
    const row = toRow(id, data);
    memTxStore.set(id, row);
    return row;
  }

  const { db, transactions } = await pgModule();
  const [row] = await db
    .insert(transactions)
    .values({ ...data, id })
    .returning();
  return row;
}

export async function getTransaction(id: string): Promise<TransactionRow | undefined> {
  if (!usePostgres) return memTxStore.get(id);

  const { db, transactions, eq } = await pgModule();
  const [row] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1);
  return row;
}

export async function getTransactionByParticleId(
  particleTxId: string
): Promise<TransactionRow | undefined> {
  if (!usePostgres) {
    return [...memTxStore.values()].find((t) => t.particleTxId === particleTxId);
  }

  const { db, transactions, eq } = await pgModule();
  const [row] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.particleTxId, particleTxId))
    .limit(1);
  return row;
}

export async function updateTransactionStatus(
  id: string,
  status: "pending" | "confirming" | "confirmed" | "failed",
  extra?: Partial<Pick<TransactionRow, "txHash" | "error">>
): Promise<TransactionRow | undefined> {
  if (!usePostgres) {
    const row = memTxStore.get(id);
    if (!row) return undefined;
    const updated = { ...row, status, ...extra, updatedAt: new Date() };
    memTxStore.set(id, updated);
    return updated;
  }

  const { db, transactions, eq, sql } = await pgModule();
  const [row] = await db
    .update(transactions)
    .set({
      status,
      ...extra,
      updatedAt: sql`now()`,
    })
    .where(eq(transactions.id, id))
    .returning();
  return row;
}

export async function listUserTransactions(
  userAddress: string,
  limit = 20,
  offset = 0
): Promise<{ items: TransactionRow[]; total: number }> {
  const addr = userAddress.toLowerCase();

  if (!usePostgres) {
    const all = [...memTxStore.values()]
      .filter((t) => t.userAddress === addr)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { items: all.slice(offset, offset + limit), total: all.length };
  }

  const { db, transactions, eq, desc, sql } = await pgModule();
  const [items, [{ count }]] = await Promise.all([
    db
      .select()
      .from(transactions)
      .where(eq(transactions.userAddress, addr))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(transactions)
      .where(eq(transactions.userAddress, addr)),
  ]);
  return { items, total: count };
}

export async function listTransactionsByStatus(
  status: "pending" | "confirming"
): Promise<TransactionRow[]> {
  if (!usePostgres) {
    return [...memTxStore.values()]
      .filter((t) => t.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 100);
  }

  const { db, transactions, eq, desc } = await pgModule();
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.status, status))
    .orderBy(desc(transactions.createdAt))
    .limit(100);
}
