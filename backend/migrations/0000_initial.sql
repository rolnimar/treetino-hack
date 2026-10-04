CREATE TABLE "indexed_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sequence" bigserial NOT NULL,
	"stream" text NOT NULL,
	"signature" text NOT NULL,
	"event_index" integer NOT NULL,
	"name" text NOT NULL,
	"data_json" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "indexed_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stream" text NOT NULL,
	"signature" text NOT NULL,
	"slot" bigint NOT NULL,
	"block_time" bigint NOT NULL,
	"error_json" jsonb,
	"transaction_json" jsonb,
	CONSTRAINT "indexed_transactions_stream_signature" UNIQUE("stream","signature")
);
--> statement-breakpoint
CREATE TABLE "indexed_trees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stream" text NOT NULL,
	"address" text NOT NULL,
	"tree_id" text NOT NULL,
	"creator" text NOT NULL,
	"supplier" text NOT NULL,
	"client" text NOT NULL,
	"reporter" text NOT NULL,
	"payment_mint" text NOT NULL,
	"share_mint" text NOT NULL,
	"funding_token_account" text NOT NULL,
	"target" text NOT NULL,
	"raised" text NOT NULL,
	"phase" text NOT NULL,
	"max_interval_wh" integer NOT NULL,
	"block_time" bigint NOT NULL,
	"signature" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "indexer_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rpc_url" text NOT NULL,
	"program_id" text NOT NULL,
	"stream" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "indexer_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stream" text NOT NULL,
	"start_time" bigint NOT NULL,
	"cursor" text,
	CONSTRAINT "indexer_state_stream" UNIQUE("stream")
);
--> statement-breakpoint
ALTER TABLE "indexed_events" ADD CONSTRAINT "indexed_events_stream_signature_indexed_transactions_stream_signature_fk" FOREIGN KEY ("stream","signature") REFERENCES "public"."indexed_transactions"("stream","signature") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "indexed_transactions" ADD CONSTRAINT "indexed_transactions_stream_indexer_state_stream_fk" FOREIGN KEY ("stream") REFERENCES "public"."indexer_state"("stream") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "indexed_trees" ADD CONSTRAINT "indexed_trees_stream_indexer_state_stream_fk" FOREIGN KEY ("stream") REFERENCES "public"."indexer_state"("stream") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "indexer_sources" ADD CONSTRAINT "indexer_sources_stream_indexer_state_stream_fk" FOREIGN KEY ("stream") REFERENCES "public"."indexer_state"("stream") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "indexed_events_transaction_event" ON "indexed_events" USING btree ("stream","signature","event_index");--> statement-breakpoint
CREATE UNIQUE INDEX "indexed_events_sequence" ON "indexed_events" USING btree ("sequence");--> statement-breakpoint
CREATE INDEX "indexed_events_stream_sequence" ON "indexed_events" USING btree ("stream","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "indexed_trees_stream_address" ON "indexed_trees" USING btree ("stream","address");--> statement-breakpoint
CREATE INDEX "indexed_trees_stream_phase" ON "indexed_trees" USING btree ("stream","phase");--> statement-breakpoint
CREATE UNIQUE INDEX "indexer_sources_rpc_program" ON "indexer_sources" USING btree ("rpc_url","program_id");