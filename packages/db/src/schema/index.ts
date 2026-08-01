/**
 * Schema barrel. Each table lives in its own file and is re-exported here —
 * `drizzle.config.ts` and the client both point at this single entry point.
 */
export * from "./user";
