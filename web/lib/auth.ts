import 'server-only';

import { auth } from '@nala/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

/** Sessão atual, ou `null` se o pedido não estiver autenticado. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Sessão atual, redirecionando para `/sign-in` se não houver. */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  return session;
}
