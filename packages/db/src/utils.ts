import { nanoid } from "nanoid";
import { text, timestamp } from "drizzle-orm/pg-core";

export const TABLE_DEFAULTS = {
  id: text("id")
    .notNull()
    .$defaultFn(() => nanoid(21)),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
