CREATE TABLE "payment_links" (
	"id" text PRIMARY KEY NOT NULL,
	"idempotency_key" text,
	"creator_address" text NOT NULL,
	"creator_email" text,
	"amount" numeric(18, 6) NOT NULL,
	"token" text DEFAULT 'USDC' NOT NULL,
	"memo" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"paid_by" text,
	"paid_from_chain" text,
	"tx_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_links_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_address" text NOT NULL,
	"type" text NOT NULL,
	"tx_status" text DEFAULT 'pending' NOT NULL,
	"amount" numeric(18, 6),
	"amount_usd" numeric(18, 2),
	"token" text,
	"to_address" text,
	"to_token" text,
	"source_chains" text,
	"settlement_chain" text,
	"tx_hash" text,
	"particle_tx_id" text,
	"link_id" text,
	"error" text,
	"metadata" text,
	"chain_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_links_creator" ON "payment_links" USING btree ("creator_address");--> statement-breakpoint
CREATE INDEX "idx_links_status" ON "payment_links" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tx_user" ON "transactions" USING btree ("user_address");--> statement-breakpoint
CREATE INDEX "idx_tx_status" ON "transactions" USING btree ("tx_status");--> statement-breakpoint
CREATE INDEX "idx_tx_particle_id" ON "transactions" USING btree ("particle_tx_id");