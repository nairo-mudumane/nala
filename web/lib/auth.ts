import "server-only";

import type { AuthSession } from "@nala/auth";
import { AUTH_BASE_URL } from "@nala/auth/env";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export const getSession = cache(async (): Promise<AuthSession | null> => {
  const cookie = (await headers()).get("cookie");
  if (!cookie) return null;

  const response = await fetch(`${AUTH_BASE_URL}/api/auth/get-session`, {
    headers: { cookie },
    cache: "no-store",
  });

  if (!response.ok) return null;

  return (await response.json()) as AuthSession | null;
});

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}
