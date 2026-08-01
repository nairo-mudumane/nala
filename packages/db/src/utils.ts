import { text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

/**
 * Columns every application-owned table spreads in.
 *
 * The `user` table deliberately does **not** use these: its id is Clerk's, not
 * a locally generated nanoid (see `schema/user.ts`).
 *
 * `deletedAt` makes every table that spreads this soft-deletable. It is a
 * marker, not a filter — Drizzle will happily return deleted rows, so every
 * read has to exclude them explicitly with `isNull(<table>.deletedAt)`. There
 * is no global scope doing it for you.
 */
export const TABLE_DEFAULTS = {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid(21)),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  /** Null while the row is live; set to the moment it was soft-deleted. */
  deletedAt: timestamp({ withTimezone: true }),
};
