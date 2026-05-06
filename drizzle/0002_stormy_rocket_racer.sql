CREATE TABLE IF NOT EXISTS "funnel_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"funnel_slug" text NOT NULL,
	"variant_key" text NOT NULL,
	"session_id" text NOT NULL,
	"ip" text,
	"country" text,
	"amount_cents" integer,
	"currency" text,
	"stripe_session_id" text,
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "funnel_events_lookup_idx" ON "funnel_events" USING btree ("funnel_slug","variant_key","event_type","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "funnel_events_session_idx" ON "funnel_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "funnel_events_stripe_session_idx" ON "funnel_events" USING btree ("stripe_session_id");
