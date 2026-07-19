import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Estado de uma candidatura no pipeline de procura de emprego.
 * (ver REQUIREMENTS.MD §2.1 — Gestão de Candidaturas)
 */
export const applicationStatus = pgEnum("application_status", [
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "archived",
]);

/** Registo dedicado para cada vaga de interesse. */
export const applications = pgTable("applications", {
  id: uuid().primaryKey().defaultRandom(),
  company: text().notNull(),
  role: text().notNull(),
  /** Descrição da vaga (Job Description) armazenada de forma centralizada. */
  jobDescription: text(),
  status: applicationStatus().notNull().default("saved"),
  /** Notas e histórico consolidado sobre o processo seletivo. */
  notes: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
