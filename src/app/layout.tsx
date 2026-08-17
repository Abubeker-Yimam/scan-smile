import type { Metadata } from "next";
import { headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_HEADER, isLocale } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scan & Smile",
  description: "One scan, a lifetime of memories.",
};

/**
 * `<html lang>` has to be true, and only middleware knows the answer this far
 * up — the `[lang]` segment lives two layouts below this one. Reading a header
 * here makes every page render per request, which is a real cost and a small
 * one: the pages that were static are four screens of text, and the rest of
 * the app was already dynamic.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = (await headers()).get(LOCALE_HEADER);

  return (
    <html lang={isLocale(locale ?? undefined) ? locale! : DEFAULT_LOCALE}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Noto Serif Ethiopic joins Fraunces for headings: the display face
            has no ግዕዝ, and a heading that silently falls back to a UI font is
            the difference between a designed page and a translated one. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..900;1,9..144,400..700&family=Karla:ital,wght@0,300..800;1,400..600&family=IBM+Plex+Mono:wght@400;500;600&family=Noto+Sans+Ethiopic:wght@400..700&family=Noto+Serif+Ethiopic:wght@400..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
