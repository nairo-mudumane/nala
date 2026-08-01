/**
 * Local mirror of the Clerk user.
 *
 * **Clerk is the source of truth for identity.** Credentials, sessions, email
 * verification, and OAuth links live at Clerk and never touch this database —
 * there are deliberately no `session`, `account`, or `verification` tables.
 *
 * This table exists for one reason: so the app's own tables (applications,
 * documents, notes) can hold a real foreign key to a user and be read in a
 * single query, instead of fanning out to Clerk's API on every request.
 *
 * It is kept in sync by the `user.created` / `user.updated` / `user.deleted`
 * webhooks handled in `core` (`POST /api/webhooks/clerk`), plus the lazy
 * `getOrSyncUser()` fallback in `@nala/auth` that covers the gap before the
 * webhook lands (and local dev, where webhooks do not reach `localhost`).
 * Treat it as an eventually-consistent cache, never as the authority.
 *
 * `id` is the Clerk user id (`user_...`), assigned by Clerk — this is why the
 * table does **not** spread `TABLE_DEFAULTS` (which generates a local nanoid).
 */
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  /** Clerk user id (`user_2abc...`). Never generated locally. */
  id: text().primaryKey(),
  /** Clerk's primary email address, mirrored for lookups and display. */
  email: text().notNull().unique(),
  /** `first_name` + `last_name` at Clerk; null while the user has neither. */
  name: text(),
  /** Avatar served by Clerk's CDN. */
  imageUrl: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
