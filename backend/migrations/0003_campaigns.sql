CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tree_address" text NOT NULL,
	"tree_id" text,
	"title" text NOT NULL,
	"subtitle" text,
	"category" text NOT NULL,
	"category_badge" text NOT NULL,
	"narrative" text NOT NULL,
	"story" text,
	"investor_highlight" text,
	"victron_site_id" integer,
	"city" text NOT NULL,
	"country" text NOT NULL,
	"projected_apy" text NOT NULL,
	"tariff_rate" text NOT NULL,
	"off_taker_name" text NOT NULL,
	"off_taker_description" text,
	"supplier_name" text,
	"target_usdc" text NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "campaigns_tree_address" ON "campaigns" USING btree ("tree_address");
