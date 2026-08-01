import { auth } from "@clerk/tanstack-react-start/server";
import { type User, meSchema } from "@nala/schemas/user";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

/**
 * Where `core` lives. Server-side only — deliberately not a `VITE_` variable,
 * because the browser never calls `core` directly: every request goes out from
 * a server function, which is the only place a Clerk token can be minted
 * without shipping the secret key to the client.
 */
const CORE_URL = process.env.CORE_URL ?? "http://localhost:3001";

/**
 * Calls `core` on behalf of the signed-in user.
 *
 * `web` and `core` sit on different origins, so Clerk's session cookie is not
 * sent along — the short-lived session token goes in the `Authorization`
 * header instead, and `core` verifies it against Clerk's JWKS.
 */
export async function coreFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await (await auth()).getToken();

  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(new URL(path, CORE_URL), { ...init, headers });
}

/**
 * The outcome of resolving the current user.
 *
 * The two failure modes are kept apart on purpose. Collapsing them into a
 * single `null` is what produced a redirect loop: a signed-in visitor whose
 * request to `core` failed was sent to `/get-started`, which saw a perfectly
 * valid Clerk session and sent them straight back to `/jobs`, for ever.
 *
 * - `anonymous` — no Clerk session. Bounce to the entry page.
 * - `unavailable` — there *is* a session, but `core` could not answer for it.
 *   That is an outage or a misconfiguration, and it must surface as an error
 *   rather than as a sign-out.
 */
export type CurrentUser =
  | { status: "ok"; user: User }
  | { status: "anonymous" }
  | { status: "unavailable" };

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<CurrentUser> => {
    const { isAuthenticated } = await auth();

    // The only path to `anonymous`: Clerk itself says there is no session.
    if (!isAuthenticated) return { status: "anonymous" };

    let response: Response;

    try {
      response = await coreFetch("/me");
    } catch (error) {
      console.error("[web] core is unreachable:", error);
      return { status: "unavailable" };
    }

    // A 401 here is *not* an anonymous visitor — Clerk just vouched for the
    // session. It means `core` rejected a token it should have accepted,
    // typically because the origin is missing from AUTH_TRUSTED_ORIGINS.
    if (!response.ok) {
      console.error(`[web] core answered /me with ${response.status}.`);
      return { status: "unavailable" };
    }

    const parsed = meSchema.safeParse(await response.json());

    if (!parsed.success) {
      console.error("[web] core answered /me in an unexpected shape.");
      return { status: "unavailable" };
    }

    return { status: "ok", user: parsed.data.user };
  },
);

/**
 * Thrown when there is a session but `core` cannot serve it.
 *
 * The class name does not survive the trip from the server to the browser, so
 * nothing should test it with `instanceof` — it exists to make the intent
 * readable at the throw site. `/jobs` renders its `errorComponent` for it.
 */
export class CoreUnavailableError extends Error {
  constructor() {
    super("Could not reach the Nala API.");
    this.name = "CoreUnavailableError";
  }
}

/**
 * The signed-in user, or a redirect. Call it from a route's `beforeLoad`:
 * `redirect` is thrown, and only the router knows how to catch it.
 */
export async function requireUser(): Promise<User> {
  const result = await getCurrentUser();

  if (result.status === "anonymous") throw redirect({ to: "/get-started" });
  if (result.status === "unavailable") throw new CoreUnavailableError();

  return result.user;
}
