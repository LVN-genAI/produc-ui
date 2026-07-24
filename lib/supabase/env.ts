/**
 * Centralised, validated access to the public Supabase env vars.
 * Throws early with a clear message if they are missing/placeholder so we never
 * silently ship a broken client.
 */
function required(name: string, value: string | undefined): string {
  if (!value || value.startsWith("REPLACE_WITH")) {
    throw new Error(
      `Missing env var ${name}. Add it to .env.local (see .env.example).`,
    );
  }
  return value;
}

export const SUPABASE_URL = required(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

export const SUPABASE_ANON_KEY = required(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
