"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "./login/actions";

export function AdminNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();

  const isEvents = pathname === "/admin" || pathname.startsWith("/admin/events");
  const isInbox = pathname.startsWith("/admin/inbox");

  return (
    <header className="no-print border-b border-cotton-3 bg-white/80 backdrop-blur-sm sticky top-0 z-30 shadow-xs">
      <div className="mx-auto flex max-w-[68rem] flex-wrap items-center justify-between gap-4 px-6 py-4">
        {/* Brand and primary navigation */}
        <div className="flex flex-wrap items-center gap-6 sm:gap-8">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 font-display text-xl font-bold tracking-tight text-coffee hover:text-ink transition-colors"
          >
            <span className="tibeb h-3.5 w-3.5 rounded-xs" aria-hidden="true" />
            Scan &amp; Smile
          </Link>

          <nav className="flex items-center gap-4 sm:gap-6 font-mono text-[0.68rem] tracking-[0.16em] uppercase">
            <Link
              href="/admin"
              className={
                "transition-colors py-1 " +
                (isEvents
                  ? "text-coffee font-semibold border-b-2 border-gold"
                  : "text-ash hover:text-coffee")
              }
            >
              Events
            </Link>

            <Link
              href="/admin/inbox"
              className={
                "inline-flex items-center gap-1.5 transition-colors py-1 " +
                (isInbox
                  ? "text-coffee font-semibold border-b-2 border-gold"
                  : "text-ash hover:text-coffee")
              }
            >
              <span>Inbox</span>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-gold px-1.5 py-0.5 font-mono text-[0.55rem] font-bold text-ink leading-none">
                  {unreadCount}
                </span>
              )}
            </Link>
          </nav>
        </div>

        {/* Secondary controls */}
        <div className="flex items-center gap-5 sm:gap-6 font-mono text-[0.65rem] tracking-[0.14em] uppercase">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-ash hover:text-coffee transition-colors"
          >
            <span>Public site</span>
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </Link>

          <span className="h-3.5 w-px bg-cotton-3" aria-hidden="true" />

          <form action={signOut}>
            <button
              type="submit"
              className="text-ash hover:text-[#8E1F2F] transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
