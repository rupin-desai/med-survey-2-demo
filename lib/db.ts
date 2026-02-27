import { neon } from "@neondatabase/serverless";

/**
 * Returns a Neon SQL query function.
 *
 * Vercel injects env vars with the custom prefix "STORAGE":
 *   STORAGE_URL          – pooled connection (for serverless)
 *   STORAGE_URL_NON_POOLING – direct connection (for migrations)
 *
 * Falls back to POSTGRES_URL / DATABASE_URL for flexibility.
 */
function getSQL() {
  const url =
    process.env.STORAGE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    "";

  if (!url) {
    throw new Error(
      "Database URL not found. Set STORAGE_URL, POSTGRES_URL, or DATABASE_URL.",
    );
  }

  return neon(url);
}

/** Create the submissions table if it doesn't exist. */
export async function ensureTable() {
  const sql = getSQL();
  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      doctor_name  TEXT NOT NULL,
      answers      JSONB NOT NULL,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
}

export { getSQL };
