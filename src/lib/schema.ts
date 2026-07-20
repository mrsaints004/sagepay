import {
  pgTable,
  text,
  numeric,
  timestamp,
  index,
  integer,
} from "drizzle-orm/pg-core";

export const paymentLinks = pgTable(
  "payment_links",
  {
    id: text("id").primaryKey(),
    idempotencyKey: text("idempotency_key").unique(),
    creatorAddress: text("creator_address").notNull(),
    creatorEmail: text("creator_email"),
    amount: numeric("amount", { precision: 18, scale: 6 }).notNull(),
    token: text("token").notNull().default("USDC"),
    memo: text("memo"),
    status: text("status", { enum: ["pending", "paid", "expired"] })
      .notNull()
      .default("pending"),
    paidBy: text("paid_by"),
    paidFromChain: text("paid_from_chain"),
    txHash: text("tx_hash"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_links_creator").on(table.creatorAddress),
    index("idx_links_status").on(table.status),
  ]
);

export const transactions = pgTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    userAddress: text("user_address").notNull(),
    type: text("type", {
      enum: ["send", "receive", "swap", "move", "pay_link"],
    }).notNull(),
    status: text("tx_status", {
      enum: ["pending", "confirming", "confirmed", "failed"],
    })
      .notNull()
      .default("pending"),
    amount: numeric("amount", { precision: 18, scale: 6 }),
    amountUsd: numeric("amount_usd", { precision: 18, scale: 2 }),
    token: text("token"),
    toAddress: text("to_address"),
    toToken: text("to_token"),
    sourceChains: text("source_chains"),
    settlementChain: text("settlement_chain"),
    txHash: text("tx_hash"),
    particleTxId: text("particle_tx_id"),
    linkId: text("link_id"),
    error: text("error"),
    metadata: text("metadata"),
    chainId: integer("chain_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_tx_user").on(table.userAddress),
    index("idx_tx_status").on(table.status),
    index("idx_tx_particle_id").on(table.particleTxId),
  ]
);

export type PaymentLinkRow = typeof paymentLinks.$inferSelect;
export type NewPaymentLink = typeof paymentLinks.$inferInsert;
export type TransactionRow = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
