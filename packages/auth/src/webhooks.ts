import { verifyWebhook } from "@clerk/backend/webhooks";
import type { UserJSON, WebhookEvent } from "@clerk/backend";
import { db, eq, user } from "@nala/db";
import { env } from "./env";

export type { WebhookEvent };

/**
 * Verifies a Clerk webhook signature and returns the parsed event.
 *
 * Throws when the signature, timestamp, or payload does not check out — the
 * route must answer `400` in that case so Clerk retries (and so an unsigned
 * POST can never write to the database).
 */
export function verifyClerkWebhook(request: Request): Promise<WebhookEvent> {
  return verifyWebhook(request, {
    signingSecret: env.CLERK_WEBHOOK_SIGNING_SECRET,
  });
}

/** Clerk exposes several emails per user; only the primary one is mirrored. */
function primaryEmail(data: UserJSON): string | null {
  const primary = data.email_addresses.find(
    (address) => address.id === data.primary_email_address_id,
  );

  return (
    primary?.email_address ?? data.email_addresses[0]?.email_address ?? null
  );
}

/** `first_name` + `last_name`, or null while the user has filled in neither. */
function fullName(data: UserJSON): string | null {
  const name = [data.first_name, data.last_name].filter(Boolean).join(" ");
  return name || null;
}

/**
 * Applies a `user.*` event to the local mirror (see `@nala/db`'s `user` table).
 *
 * Every other event type is acknowledged and ignored: Clerk endpoints are
 * configured per event in the dashboard, but subscribing to something extra
 * should never make the endpoint fail.
 *
 * Returns whether the event changed anything, so the route can say so in its
 * response — handy when replaying events from the Clerk dashboard.
 */
export async function syncUserFromWebhook(
  event: WebhookEvent,
): Promise<boolean> {
  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const email = primaryEmail(event.data);

      // A user without an email cannot be mirrored (the column is NOT NULL) and
      // cannot sign in through the email-link flow either — nothing to do.
      if (!email) return false;

      const values = {
        email,
        name: fullName(event.data),
        imageUrl: event.data.image_url,
      };

      await db
        .insert(user)
        .values({ id: event.data.id, ...values })
        // `user.created` is re-delivered on retry, and `getOrSyncUser` may have
        // inserted the row first — upsert rather than fail on the second write.
        .onConflictDoUpdate({ target: user.id, set: values });

      return true;
    }

    case "user.deleted": {
      // `id` is optional on the deleted-object payload.
      if (!event.data.id) return false;

      await db.delete(user).where(eq(user.id, event.data.id));

      return true;
    }

    default:
      return false;
  }
}
