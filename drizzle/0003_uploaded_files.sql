CREATE TABLE "uploaded_files" (
	"id" text PRIMARY KEY NOT NULL,
	"folder" varchar(32) NOT NULL,
	"filename" varchar(80) NOT NULL,
	"content_type" varchar(64) NOT NULL,
	"data" bytea NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX "uploaded_files_folder_filename_idx" ON "uploaded_files" USING btree ("folder","filename");
