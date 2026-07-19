import { db, account, session, user, verification } from '@nala/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nanoid } from 'nanoid';
import { AUTH_BASE_URL, TRUSTED_ORIGINS, env } from './env';

export const auth = betterAuth({
  appName: 'Nala',
  baseURL: AUTH_BASE_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: TRUSTED_ORIGINS,

  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification },
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    password: {
      hash: (password) =>
        Bun.password.hash(password, {
          algorithm: 'argon2id',
          memoryCost: 65536,
          timeCost: 3,
        }),
      verify: ({ hash, password }) => Bun.password.verify(password, hash),
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // renew the session at most once per day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },

  advanced: {
    database: {
      generateId: () => nanoid(21),
    },

    crossSubDomainCookies: process.env.AUTH_COOKIE_DOMAIN
      ? { enabled: true, domain: process.env.AUTH_COOKIE_DOMAIN }
      : undefined,
  },
});

export type Auth = typeof auth;
export type AuthSession = Auth['$Infer']['Session'];
export type AuthUser = AuthSession['user'];
