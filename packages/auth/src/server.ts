import { createClerkClient } from "@clerk/backend";
import { db, eq, user } from "@nala/db";
import type { User } from "@nala/db";
import { TRUSTED_ORIGINS, env } from "./env";

/**
 * Clerk Backend API client.
 *
 * Instantiated once per process: it caches the JWKS used to verify session
 * tokens, so building a new client per request would refetch it every time.
 */
export const clerk = createClerkClient({
  secretKey: env.CLERK_SECRET_KEY,
  publishableKey: env.CLERK_PUBLISHABLE_KEY,
});

/** What `core` keeps in its request context once a request is authenticated. */
export type AuthState = {
  /** Clerk user id (`user_...`). */
  userId: string;
  /** Clerk session id (`sess_...`). */
  sessionId: string;
};

/**
 * Verifies the Clerk session token carried by a request.
 *
 * `web` and `core` sit on different origins (ports 3000 and 3001 in dev), so
 * the session cookie is not sent along — `web` attaches the token explicitly as
 * `Authorization: Bearer <token>` (see `web/lib/core.ts`). `authenticateRequest`
 * accepts both, so a same-origin deployment behind one domain keeps working
 * without a code change.
 *
 * Returns `null` for anonymous or invalid requests instead of throwing:
 * deciding whether that is a 401 belongs to the route, not here.
 */
export async function authenticateRequest(
  request: Request,
): Promise<AuthState | null> {
  const state = await clerk.authenticateRequest(request, {
    authorizedParties: TRUSTED_ORIGINS,
  });

  if (!state.isAuthenticated) return null;

  const { userId, sessionId } = state.toAuth();
  if (!userId || !sessionId) return null;

  return { userId, sessionId };
}

/**
 * Reads the local mirror of a Clerk user, pulling it from Clerk and inserting
 * it if it is not there yet.
 *
 * The webhook (`POST /api/webhooks/clerk`) is the normal way rows get written,
 * but it is only eventually consistent — a brand-new user can hit a protected
 * route before the event lands, and in local development webhooks do not reach
 * `localhost` at all without a tunnel. This closes both gaps: the very first
 * authenticated request for an unknown user costs one Clerk API call, every
 * later one is a plain `SELECT`.
 */
export async function getOrSyncUser(userId: string): Promise<User> {
  const [existing] = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (existing) return existing;

  const clerkUser = await clerk.users.getUser(userId);

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error(`[@nala/auth] Clerk user ${userId} has no email address.`);
  }

  const [inserted] = await db
    .insert(user)
    .values({
      id: clerkUser.id,
      email,
      name: clerkUser.fullName,
      imageUrl: clerkUser.imageUrl,
    })
    // The webhook may have won the race between the SELECT and here.
    .onConflictDoUpdate({
      target: user.id,
      set: { email, name: clerkUser.fullName, imageUrl: clerkUser.imageUrl },
    })
    .returning();

  // biome-ignore lint/style/noNonNullAssertion: an upsert with RETURNING always yields the row.
  return inserted!;
}
