import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { getSession } from "@/lib/auth";

export const metadata = {
  title: "Get started — Nala",
};

/**
 * Single entry point for both signing in and creating an account. Magic-link
 * sign-in creates the user when the email is new, so the two flows differ only
 * in copy — splitting them across routes would just be two views of one form.
 */
export default async function GetStartedPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getSession()) redirect("/jd");

  const { error } = await searchParams;

  return <AuthForm initialError={error} />;
}
