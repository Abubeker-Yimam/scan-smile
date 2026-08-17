/**
 * Three languages, carried in the URL.
 *
 * `/am/about` rather than a cookie on `/about`, because the way a link reaches
 * an Ethiopian guest is pasted into Telegram — and a language that lives in a
 * cookie arrives in whatever language the recipient's browser guessed, which
 * is usually not the one the sender was reading.
 */
export const LOCALES = ["en", "am", "om"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Each language named in itself — nobody looks for "Amharic" in an English list. */
export const LOCALE_NAMES: Record<Locale, { name: string; short: string }> = {
  en: { name: "English", short: "EN" },
  am: { name: "አማርኛ", short: "አማ" },
  om: { name: "Afaan Oromoo", short: "OM" },
};

/** The cookie remembers a choice so the next visit starts where the last one ended. */
export const LOCALE_COOKIE = "smile_lang";

/**
 * Middleware puts the locale on the request under this name, because the root
 * layout owns `<html>` and cannot see the `[lang]` segment underneath it. It
 * is the only way to make the document's own language attribute true, and a
 * screen reader reading Amharic with an English voice is the thing it prevents.
 */
export const LOCALE_HEADER = "x-smile-locale";

export function isLocale(value: string | undefined): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * The locale a request should land on, in order of how much it is worth
 * trusting: a choice the visitor made, then what their browser asks for, then
 * English.
 *
 * The Accept-Language parse is deliberately crude — it reads the base tag of
 * each entry in order and takes the first one we speak, ignoring q-values.
 * With three languages and no regional variants to weigh, a full parse would
 * arrive at the same answer for every real request.
 */
export function preferredLocale(cookie: string | undefined, acceptLanguage: string | null): Locale {
  if (isLocale(cookie)) return cookie;

  for (const entry of acceptLanguage?.split(",") ?? []) {
    const base = entry.trim().split(";")[0].split("-")[0].toLowerCase();
    if (isLocale(base)) return base;
  }

  return DEFAULT_LOCALE;
}

/**
 * Puts a value into a translated sentence.
 *
 * `{v}` rather than gluing two halves together, because *where* the value
 * falls and whether a space belongs beside it are both part of the
 * translation. English wants "within one working day" with spaces on either
 * side; Amharic prefixes በ straight onto it with none. Concatenating in the
 * component can only ever be right in one language.
 */
export const fill = (template: string, value: string) => template.replace("{v}", value);

/**
 * The `hreflang` block for one page, in all three languages.
 *
 * Without it a search engine treats `/en/about`, `/am/about` and `/om/about`
 * as three unrelated pages competing with each other, rather than one page a
 * reader should be sent to in their own language.
 */
export function localeAlternates(path: string) {
  return {
    languages: Object.fromEntries(
      LOCALES.map((locale) => [locale, `/${locale}${path}`])
    ) as Record<Locale, string>,
  };
}

/** `/am/about` → `/om/about`, keeping the reader on the page they were reading. */
export function pathInLocale(pathname: string, locale: Locale): string {
  const segments = pathname.split("/").filter(Boolean);
  if (isLocale(segments[0])) segments[0] = locale;
  else segments.unshift(locale);
  return `/${segments.join("/")}`;
}
