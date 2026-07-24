import Link from "next/link";
import { Boxes, LayoutDashboard } from "lucide-react";

/** Sticky, frosted-glass top bar for the storefront. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/catalog" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm">
            <Boxes className="size-4.5" />
          </span>
          <span className="text-base font-semibold tracking-tight">
            Catalog
          </span>
        </Link>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LayoutDashboard className="size-4" />
          Admin
        </Link>
      </div>
    </header>
  );
}
