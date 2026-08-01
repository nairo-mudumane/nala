/**
 * The user's professional base profile — the material a tailored résumé is
 * built from.
 *
 * **This is the integrity boundary.** REQUIREMENTS.MD §2.2 asks for résumés
 * adapted to each role "while preserving professional integrity": the
 * generator may reorder, reword, and drop what a role does not need, but it
 * may only ever draw on facts that live here. Nothing generated is stored in
 * this table.
 *
 * A user holds **several** profiles — one per direction they are applying in
 * ("Backend Engineer", "Engineering Manager") — and picks which one a given
 * application starts from. `isDefault` marks the one preselected in the UI.
 *
 * Deletion is soft (`deletedAt` from `TABLE_DEFAULTS`): documents already
 * generated from a profile must keep resolving after the user drops it.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { TABLE_DEFAULTS } from "../utils";
import { user } from "./user";

/**
 * Language the documents generated from this profile are written in.
 *
 * A real Postgres enum rather than a `text({ enum })`: the latter is a plain
 * `text` column that only TypeScript polices, so anything writing outside
 * Drizzle can store whatever it likes. The two values match the interface
 * locales planned in REQUIREMENTS.MD §3.
 */
export const profileLocale = pgEnum("profile_locale", ["en", "pt"]);

export const jdUsrProfile = pgTable(
  "jd_usr_profile",
  {
    ...TABLE_DEFAULTS,
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** How the user tells their profiles apart, e.g. "Backend Engineer". */
    title: text().notNull(),
    /** Preselected when starting a new application. At most one per user. */
    isDefault: boolean().notNull().default(false),
    /** Name as it should print on the résumé — not necessarily Clerk's. */
    fullName: text(),
    /** One-line positioning, e.g. "Senior Backend Engineer, Go & Postgres". */
    headline: text(),
    summary: text(),
    location: text(),
    /**
     * Defaults to `pt` because the product ships Portuguese-only for now
     * (REQUIREMENTS.MD §3); `en` is already accepted so the switch to a
     * bilingual UI needs no migration.
     */
    locale: profileLocale().notNull().default("pt"),
  },
  (table) => [
    index().on(table.userId),
    /**
     * One default profile per user — enforced in the database, not just in the
     * handler, because "make this one the default" is two writes and a crash
     * between them would otherwise leave the user with two.
     *
     * Partial on purpose: it only constrains rows that are *both* the default
     * *and* live, so any number of non-default profiles coexist and a
     * soft-deleted default never blocks the next one.
     */
    uniqueIndex("jd_usr_profile_one_default_per_user")
      .on(table.userId)
      .where(sql`${table.isDefault} and ${table.deletedAt} is null`),
  ],
);

export type JdUsrProfile = typeof jdUsrProfile.$inferSelect;
export type NewJdUsrProfile = typeof jdUsrProfile.$inferInsert;
