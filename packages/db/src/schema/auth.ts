/**
 * Schema do Better Auth (tabelas core: user, session, account, verification).
 *
 * As tabelas vivem aqui — e não em `@nala/auth` — para que exista **um único**
 * `drizzle.config.ts` e **uma única** pasta de migrações em todo o monorepo.
 * O pacote `@nala/auth` consome estas tabelas via `drizzleAdapter`.
 *
 * Ao alterar a config do Better Auth (plugins, campos extra), corre
 * `bun run auth:verify` (em `packages/auth`) e reflete as diferenças aqui
 * antes de correr `bun run db:generate`.
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
    /** ID da conta no provedor (ou o `user.id` para contas `credential`). */
    accountId: text().notNull(),
    /** `credential` para email/password, ou o slug do OAuth (`github`, ...). */
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
    /** Hash da password (apenas para `providerId = "credential"`). */
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
