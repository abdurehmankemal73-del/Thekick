CREATE TYPE "public"."absence_type" AS ENUM('FAMILY', 'CLASS_EXAM', 'SICK', 'JOURNEY');--> statement-breakpoint
CREATE TYPE "public"."account_status" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."announcement_status" AS ENUM('DRAFT', 'PUBLISHED');--> statement-breakpoint
CREATE TYPE "public"."belt_level" AS ENUM('WHITE', 'WHITE_YELLOW_TAG', 'YELLOW', 'YELLOW_GREEN_TAG', 'GREEN', 'GREEN_BLUE_TAG', 'BLUE', 'BLUE_RED_TAG', 'RED', 'RED_BLACK_TAG', 'DAN_1');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('NEW', 'READ');--> statement-breakpoint
CREATE TYPE "public"."permission_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('ADMIN', 'STUDENT');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"image_url" text,
	"status" "announcement_status" DEFAULT 'DRAFT' NOT NULL,
	"author_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text,
	"action" varchar(80) NOT NULL,
	"target_type" varchar(80) NOT NULL,
	"target_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "belt_history" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"from_belt" "belt_level",
	"to_belt" "belt_level" NOT NULL,
	"changed_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "club_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(64) NOT NULL,
	"telegram" varchar(64) NOT NULL,
	"location" text NOT NULL,
	"schedule" text NOT NULL,
	"facebook_url" text,
	"instagram_url" text,
	"youtube_url" text,
	"about" text NOT NULL,
	"mission" text NOT NULL,
	"vision" text NOT NULL,
	"philosophy" text NOT NULL,
	"itf_info" text NOT NULL,
	"activities" text NOT NULL,
	"achievements" text NOT NULL,
	"instructors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" varchar(200) NOT NULL,
	"email" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"status" "message_status" DEFAULT 'NEW' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grades" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"assessment_name" varchar(200) NOT NULL,
	"pattern_score" integer,
	"sparring_score" integer,
	"kicks_score" integer,
	"theory_score" integer,
	"discipline_score" integer,
	"overall_score" integer,
	"result" varchar(80),
	"instructor_comment" text,
	"assessment_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permission_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"absence_type" "absence_type" NOT NULL,
	"reason" varchar(500) NOT NULL,
	"status" "permission_status" DEFAULT 'PENDING' NOT NULL,
	"admin_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" varchar(255) NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"full_name" varchar(200) NOT NULL,
	"telegram_username" varchar(64),
	"password_hash" text,
	"role" "role" DEFAULT 'STUDENT' NOT NULL,
	"belt_level" "belt_level",
	"account_status" "account_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "belt_history" ADD CONSTRAINT "belt_history_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "belt_history" ADD CONSTRAINT "belt_history_changed_by_id_users_id_fk" FOREIGN KEY ("changed_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_requests" ADD CONSTRAINT "permission_requests_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "announcements_status_idx" ON "announcements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "belt_history_student_id_idx" ON "belt_history" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "grades_student_id_idx" ON "grades" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "grades_assessment_date_idx" ON "grades" USING btree ("assessment_date");--> statement-breakpoint
CREATE INDEX "permissions_student_id_idx" ON "permission_requests" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "permissions_status_idx" ON "permission_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "permissions_absence_type_idx" ON "permission_requests" USING btree ("absence_type");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_belt_level_idx" ON "users" USING btree ("belt_level");--> statement-breakpoint
CREATE INDEX "users_account_status_idx" ON "users" USING btree ("account_status");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");