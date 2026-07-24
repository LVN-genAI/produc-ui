import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { AdminHeader } from "@/components/admin/admin-header";

export const metadata = {
  title: "Admin · Catalog",
};

// Auth-gated, user-specific dashboard — render dynamically, never prerender.
export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <div className="flex h-screen flex-col">
      <AdminHeader />
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
