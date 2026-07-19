/**
 * Better Auth schema (core tables: user, session, account, verification).
 *
 * The tables live here — and not in `@nala/auth` — so that there is **a single**
 * `drizzle.config.ts` and **a single** migrations folder across the monorepo.
 * The `@nala/auth` package consumes these tables via `drizzleAdapter`.
 *
 * When changing the Better Auth config (plugins, extra fields), run
 * `bun run auth:verify` (in `packages/auth`) and reflect the differences here
 * before running `bun run db:generate`.
 */
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { TABLE_DEFAULTS } from "../utils";

export const user = pgTable("user", {
  ...TABLE_DEFAULTS,
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
});

export const session = pgTable(
  "session",
  {
    ...TABLE_DEFAULTS,
    token: text().notNull().unique(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    ...TABLE_DEFAULTS,
    /** Account ID at the provider (or `user.id` for `credential` accounts). */
    accountId: text().notNull(),
    /** `credential` for email/password, or the OAuth slug (`github`, ...). */
    providerId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    /** Password hash (only for `providerId = "credential"`). */
    password: text(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    ...TABLE_DEFAULTS,
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;
