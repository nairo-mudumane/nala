/**
 * Carregamento e validação das variáveis de ambiente da base de dados.
 *
 * O Bun carrega automaticamente o `.env` a partir do cwd, pelo que basta
 * garantir que `DATABASE_URL` está definida (ver `.env.example`).
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[@nala/db] Variável de ambiente em falta: ${name}. ` +
        "Copia packages/db/.env.example para .env e preenche o valor.",
    );
  }
  return value;
}

export const env = {
  /** String de conexão ao PostgreSQL (18). */
  DATABASE_URL: required("DATABASE_URL"),
} as const;
