CREATE TABLE "daily_spot_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" text NOT NULL,
	"quote" jsonb NOT NULL,
	CONSTRAINT "daily_spot_prices_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "indexed_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stream" text NOT NULL,
	"address" text NOT NULL,
	"tree" text NOT NULL,
	"day_start_ts" text NOT NULL,
	"submitted_at" text NOT NULL,
	"reporter" text NOT NULL,
	"wh" jsonb NOT NULL,
	"total_wh" text NOT NULL,
	"invoice_issued" boolean NOT NULL,
	"due" text NOT NULL,
	"paid" text NOT NULL,
	"pricing" jsonb,
	"pricing_error" text,
	"signature" text NOT NULL,
	"block_time" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mock_report_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"report" text NOT NULL,
	"day_start_ts" text NOT NULL,
	"raw_transaction" text NOT NULL,
	"signature" text NOT NULL,
	"last_valid_block_height" bigint NOT NULL,
	"confirmed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mock_reporters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stream" text NOT NULL,
	"tree" text NOT NULL,
	"creator" text NOT NULL,
	"wallet" text NOT NULL,
	"secret_key" text NOT NULL,
	"last_signature" text,
	"last_error" text,
	"balance_lamports" text,
	"lease_owner" text,
	"lease_until" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "indexed_reports" ADD CONSTRAINT "indexed_reports_stream_indexer_state_stream_fk" FOREIGN KEY ("stream") REFERENCES "public"."indexer_state"("stream") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_report_jobs" ADD CONSTRAINT "mock_report_jobs_reporter_id_mock_reporters_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."mock_reporters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "indexed_reports_stream_address" ON "indexed_reports" USING btree ("stream","address");--> statement-breakpoint
CREATE INDEX "indexed_reports_stream_tree" ON "indexed_reports" USING btree ("stream","tree");--> statement-breakpoint
CREATE UNIQUE INDEX "mock_report_jobs_reporter_day" ON "mock_report_jobs" USING btree ("reporter_id","day_start_ts");--> statement-breakpoint
CREATE UNIQUE INDEX "mock_reporters_stream_tree" ON "mock_reporters" USING btree ("stream","tree");