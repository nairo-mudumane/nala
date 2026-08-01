--> Better Auth → Clerk.
--> Sessions, credentials, and email verification now live at Clerk, so the
--> tables backing them are dropped outright. What remains is `user`, reshaped
--> into a mirror of the Clerk user (see packages/db/src/schema/user.ts).
DROP TABLE "account" CASCADE;--> statement-breakpoint
DROP TABLE "session" CASCADE;--> statement-breakpoint
DROP TABLE "verification" CASCADE;--> statement-breakpoint
--> DESTRUCTIVE, and deliberately so: every existing row is keyed by a locally
--> generated nanoid, while the column now holds a Clerk id (`user_...`). Those
--> rows can never match a Clerk user again, and worse, their `email` values
--> would trip the unique constraint the first time the same person signs up
--> through Clerk. They are cleared rather than migrated.
DELETE FROM "user";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "email_verified";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "image";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "image_url" text;--> statement-breakpoint
--> Clerk lets an account exist with no name at all; the mirror has to allow it.
ALTER TABLE "user" ALTER COLUMN "name" DROP NOT NULL;
