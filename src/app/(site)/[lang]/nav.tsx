"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The public navigation.
 *
 * A client component only so the page you are on can say so — the underline is
 * the whole reason, and it is worth the kilobyte on a four-page site.
 */
export function SiteNav({
  items,
  navLabel,
  className = "",
}: {
  items: { href: string; label: string }[];
  navLabel: string;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={navLabel}
      className={`flex flex-wrap items-baseline gap-x-5 gap-y-2 sm:gap-x-6 ${className}`}
    >
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              "font-mono text-[0.62rem] tracking-[0.18em] uppercase underline-offset-4 transition-colors " +
              (active
                ? "text-gold underline decoration-gold"
                : "text-cotton/60 hover:text-gold hover:underline")
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
