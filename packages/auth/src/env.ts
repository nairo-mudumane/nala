function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[@nala/auth] Variável de ambiente em falta: ${name}. ` +
        'Copia .env.example para .env e preenche o valor.',
    );
  }
  return value;
}

export const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_URL ?? process.env.BETTER_AUTH_URL;

if (!AUTH_BASE_URL) throw new Error('better auth url not set in env');

export const TRUSTED_ORIGINS = (process.env.AUTH_TRUSTED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  get BETTER_AUTH_SECRET() {
    return required('BETTER_AUTH_SECRET');
  },
  BETTER_AUTH_URL: AUTH_BASE_URL,
  TRUSTED_ORIGINS,
} as const;
