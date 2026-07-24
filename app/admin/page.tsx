import Link from "next/link";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { SignOutButton } from "@/components/admin/sign-out-button";

export const metadata = {
  title: "Admin · Catalog",
};

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
      <AdminWorkspace />
    </div>
  );
}
