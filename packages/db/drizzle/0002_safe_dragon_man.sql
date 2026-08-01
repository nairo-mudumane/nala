CREATE TYPE "public"."profile_locale" AS ENUM('en', 'pt');--> statement-breakpoint
CREATE TABLE "jd_usr_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"full_name" text,
	"headline" text,
	"summary" text,
	"location" text,
	"locale" "profile_locale" DEFAULT 'pt' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jd_usr_profile" ADD CONSTRAINT "jd_usr_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "jd_usr_profile_user_id_index" ON "jd_usr_profile" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "jd_usr_profile_one_default_per_user" ON "jd_usr_profile" USING btree ("user_id") WHERE "jd_usr_profile"."is_default" and "jd_usr_profile"."deleted_at" is null;