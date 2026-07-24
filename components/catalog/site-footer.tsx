import Link from "next/link";
import {
  AtSign,
  Boxes,
  Globe,
  Heart,
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react";

/**
 * Storefront footer: brand, contact details, quick links, and credit.
 * Replace the placeholder contact values below with your real details.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t bg-muted/40">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/catalog" className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm">
                <Boxes className="size-4.5" />
              </span>
              <span className="text-base font-semibold tracking-tight">
                Catalog
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              A schema-driven product catalog with rich specifications and
              interactive 3D previews — organised across unlimited category
              levels.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <a
                href="https://lvn.dev"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Website"
                className="flex size-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              >
                <Globe className="size-4" />
              </a>
              <a
                href="mailto:hello@lvn.dev"
                aria-label="Email"
                className="flex size-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              >
                <AtSign className="size-4" />
              </a>
              <a
                href="https://t.me/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="flex size-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              >
                <Send className="size-4" />
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold">Contact</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <a
                  href="mailto:hello@lvn.dev"
                  className="flex items-center gap-2 hover:text-foreground"
                >
                  <Mail className="size-4 shrink-0" />
                  hello@lvn.dev
                </a>
              </li>
              <li>
                <a
                  href="tel:+15550000000"
                  className="flex items-center gap-2 hover:text-foreground"
                >
                  <Phone className="size-4 shrink-0" />
                  +1 (555) 000-0000
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>
                  221B Product Street,
                  <br />
                  Bengaluru, India
                </span>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold">Explore</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/catalog" className="hover:text-foreground">
                  Catalog
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-foreground">
                  Admin dashboard
                </Link>
              </li>
              <li>
                <a href="mailto:hello@lvn.dev" className="hover:text-foreground">
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {year} LVN. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Developed with
            <Heart className="size-4 fill-rose-500 text-rose-500" />
            by
            <a
              href="https://lvn.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground hover:underline"
            >
              LVN Studio
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
