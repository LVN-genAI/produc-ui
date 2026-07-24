import Link from "next/link";
import { LayoutDashboard, Store } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Product Catalog
          </h1>
          <p className="text-muted-foreground">
            A schema-driven, N-level category catalog.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/admin"
            className="flex flex-col items-center gap-2 rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-colors hover:bg-accent"
          >
            <LayoutDashboard className="size-6" />
            <span className="font-medium">Admin</span>
            <span className="text-xs text-muted-foreground">
              Manage categories &amp; products
            </span>
          </Link>
          <Link
            href="/catalog"
            className="flex flex-col items-center gap-2 rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-colors hover:bg-accent"
          >
            <Store className="size-6" />
            <span className="font-medium">Catalog</span>
            <span className="text-xs text-muted-foreground">
              Browse the storefront
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
