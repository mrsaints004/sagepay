import type { PaymentLink } from "@/types";
import { nanoid } from "nanoid";

interface KVStore {
  set(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | null>;
  zadd(key: string, entry: { score: number; member: string }): Promise<void>;
  zrange(key: string, start: number, end: number, opts?: { rev: boolean }): Promise<string[]>;
}

let kv: KVStore | null = null;

async function getKV(): Promise<KVStore | null> {
  if (kv) return kv;
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null;
  }
  try {
    const mod = await import("@vercel/kv");
    kv = mod.kv as unknown as KVStore;
    return kv;
  } catch {
    return null;
  }
}

// Fallback in-memory store for local dev without KV
const memLinks = new Map<string, PaymentLink>();
const memUserIndex = new Map<string, string[]>();

export async function createLink(data: {
  creatorAddress: string;
  creatorEmail?: string;
  amount: number;
  token: string;
  memo?: string;
}): Promise<PaymentLink> {
  const id = nanoid(10);
  const link: PaymentLink = {
    id,
    creatorAddress: data.creatorAddress,
    creatorEmail: data.creatorEmail,
    amount: data.amount,
    token: data.token || "USDC",
    memo: data.memo,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const store = await getKV();
  if (store) {
    await store.set(`link:${id}`, JSON.stringify(link));
    await store.zadd(`user-links:${data.creatorAddress.toLowerCase()}`, {
      score: Date.now(),
      member: id,
    });
  } else {
    memLinks.set(id, link);
    const key = data.creatorAddress.toLowerCase();
    const ids = memUserIndex.get(key) ?? [];
    ids.unshift(id);
    memUserIndex.set(key, ids);
  }

  return link;
}

export async function getLink(id: string): Promise<PaymentLink | undefined> {
  const store = await getKV();
  if (store) {
    const raw = await store.get(`link:${id}`);
    if (!raw) return undefined;
    return typeof raw === "string" ? JSON.parse(raw) : raw as PaymentLink;
  }
  return memLinks.get(id);
}

export async function getUserLinks(address: string): Promise<PaymentLink[]> {
  const store = await getKV();
  if (store) {
    const ids: string[] = await store.zrange(
      `user-links:${address.toLowerCase()}`,
      0,
      -1,
      { rev: true }
    );
    if (!ids.length) return [];
    const links: PaymentLink[] = [];
    for (const id of ids) {
      const raw = await store.get(`link:${id}`);
      if (raw) {
        links.push(typeof raw === "string" ? JSON.parse(raw) : raw as PaymentLink);
      }
    }
    return links;
  }

  return Array.from(memLinks.values())
    .filter((l) => l.creatorAddress.toLowerCase() === address.toLowerCase())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updateLink(
  id: string,
  data: Partial<Pick<PaymentLink, "status" | "paidBy" | "paidFromChain" | "txHash">>
): Promise<PaymentLink | undefined> {
  const store = await getKV();
  if (store) {
    const raw = await store.get(`link:${id}`);
    if (!raw) return undefined;
    const link = typeof raw === "string" ? JSON.parse(raw) : raw as PaymentLink;
    const updated = { ...link, ...data };
    await store.set(`link:${id}`, JSON.stringify(updated));
    return updated;
  }

  const link = memLinks.get(id);
  if (!link) return undefined;
  const updated = { ...link, ...data };
  memLinks.set(id, updated);
  return updated;
}
