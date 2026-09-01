ALTER TYPE "public"."account_status" ADD VALUE IF NOT EXISTS 'REJECTED';--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('TRAINING', 'BELT_EXAM', 'COMPETITION', 'GRADUATION', 'MEETING', 'SPECIAL');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "approval_email_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "rejected_at" timestamp;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
CREATE TABLE "announcement_images" (
	"id" text PRIMARY KEY NOT NULL,
	"announcement_id" text NOT NULL,
	"url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"event_type" "event_type" DEFAULT 'SPECIAL' NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp,
	"all_day" boolean DEFAULT false NOT NULL,
	"location" varchar(300),
	"status" "announcement_status" DEFAULT 'PUBLISHED' NOT NULL,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "announcement_images" ADD CONSTRAINT "announcement_images_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "announcement_images_announcement_id_idx" ON "announcement_images" USING btree ("announcement_id");--> statement-breakpoint
CREATE INDEX "calendar_events_starts_at_idx" ON "calendar_events" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "calendar_events_status_idx" ON "calendar_events" USING btree ("status");
