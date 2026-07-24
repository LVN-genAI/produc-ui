import { Suspense } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { SignOutButton } from "@/components/admin/sign-out-button";

export const metadata = {
  title: "Admin · Catalog",
};

// Auth-gated, user-specific dashboard — render dynamically, never prerender.
export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex shrink-0 items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-semibold">
            Catalog Admin
          </Link>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Categories &amp; schema
          </span>
        </div>
        <SignOutButton />
      </header>
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" /> Loading workspace…
          </div>
        }
      >
        <AdminWorkspace />
      </Suspense>
    </div>
  );
}
