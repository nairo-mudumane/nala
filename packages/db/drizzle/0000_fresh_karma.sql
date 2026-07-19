CREATE TYPE "public"."application_status" AS ENUM('saved', 'applied', 'interviewing', 'offer', 'rejected', 'archived');--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company" text NOT NULL,
	"role" text NOT NULL,
	"job_description" text,
	"status" "application_status" DEFAULT 'saved' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
