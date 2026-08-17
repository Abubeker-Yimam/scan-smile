"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES, LOCALE_COOKIE, LOCALE_NAMES, pathInLocale, type Locale } from "@/lib/i18n";

const YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/**
 * English, አማርኛ, Afaan Oromoo.
 *
 * Built on `<details>` rather than a button and a state flag, so it opens on a
 * machine where the JavaScript failed to load — which, on a hall's wifi, is not
 * a hypothetical. The options stay real links underneath: a reader can open one
 * in a new tab, and a crawler follows them to the other two languages.
 *
 * Choosing also writes a cookie, which is what `/` reads next time to decide
 * where to send someone — so the choice outlives the visit without ever being
 * the thing that decides what a shared link says.
 *
 * Each option is tagged with its own `lang`, so a screen reader pronounces
 * "አማርኛ" as Amharic rather than as mangled English.
 */
export function LanguageToggle({ current, label }: { current: Locale; label: string }) {
  const pathname = usePathname();
  const details = useRef<HTMLDetailsElement>(null);

  // A menu that only closes when you pick something is a menu people leave
  // hanging over the page. Escape and a click anywhere else both shut it, and
  // Escape hands focus back to the control that opened it.
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const node = details.current;
      if (node?.open && !node.contains(event.target as Node)) node.open = false;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const node = details.current;
      if (event.key !== "Escape" || !node?.open) return;
      node.open = false;
      node.querySelector("summary")?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details ref={details} className="relative">
      <summary
        aria-label={label}
        className="flex cursor-pointer list-none items-center gap-2 border border-cotton/15 px-3 py-2.5 font-mono sm:py-1.5 text-[0.62rem] tracking-[0.14em] text-cotton/70 uppercase transition-colors select-none hover:border-cotton/40 hover:text-cotton [&::-webkit-details-marker]:hidden"
      >
        {LOCALE_NAMES[current].short}
        <svg
          viewBox="0 0 10 6"
          className="h-1.5 w-2.5 fill-none stroke-current"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M1 1l4 4 4-4" />
        </svg>
      </summary>

      <ul className="absolute right-0 z-20 mt-2 min-w-[11rem] border border-cotton/15 bg-ink-2 py-1 shadow-[0_18px_40px_-12px_rgb(0_0_0/0.8)]">
        {LOCALES.map((locale) => {
          const active = locale === current;
          return (
            <li key={locale}>
              <Link
                href={pathInLocale(pathname, locale)}
                hrefLang={locale}
                lang={locale}
                aria-current={active ? "true" : undefined}
                onClick={() => {
                  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${YEAR_IN_SECONDS}; samesite=lax`;
                  if (details.current) details.current.open = false;
                }}
                className={
                  "flex items-center gap-2.5 px-3.5 py-3 font-body text-sm transition-colors sm:py-2 " +
                  (active ? "text-gold" : "text-cotton/70 hover:bg-ink-3 hover:text-cotton")
                }
              >
                {/* A woven thread marks the current language — the same band
                    that edges every card, one option high. */}
                <span
                  className={active ? "tibeb h-2.5 w-2.5 shrink-0" : "h-2.5 w-2.5 shrink-0"}
                  aria-hidden="true"
                />
                {LOCALE_NAMES[locale].name}
              </Link>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
