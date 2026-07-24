import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js 16 "proxy" convention (formerly "middleware"). Refreshes the Supabase
 * session app-wide and guards /admin via updateSession().
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  /**
   * Run on all paths except static assets and files. This both refreshes the
   * session app-wide and lets updateSession() guard /admin.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|glb|gltf)$).*)",
  ],
};
