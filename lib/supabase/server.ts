import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Server Supabase client for Server Components, Server Actions, and route
 * handlers. Reads/writes the session cookie so RLS runs as the signed-in user.
 *
 * `cookies()` is async in Next 15+, hence this is an async factory.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // `setAll` was called from a Server Component. Safe to ignore when
          // middleware is refreshing the session on every request.
        }
      },
    },
  });
}
