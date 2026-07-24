"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, Boxes, Home } from "lucide-react";

import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/admin/sign-out-button";

const NAV = [
  { href: "/admin", label: "Categories", icon: Boxes, exact: true },
  { href: "/admin/settings", label: "Home page", icon: Home, exact: false },
  { href: "/admin/archive", label: "Archive", icon: Archive, exact: false },
];

export function AdminHeader() {
  const pathname = usePathname();

  return (
    <header className="flex shrink-0 items-center justify-between border-b px-4 py-2.5">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-sm font-semibold">
          Catalog Admin
        </Link>
        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <SignOutButton />
    </header>
  );
}
