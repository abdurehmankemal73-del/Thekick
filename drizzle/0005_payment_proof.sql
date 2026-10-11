ALTER TABLE "users" ADD COLUMN "payment_proof_filename" varchar(80);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "payment_proof_submitted_at" timestamp;
