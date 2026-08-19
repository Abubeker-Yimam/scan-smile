import type { Locale } from "./i18n";

/**
 * Everything the public pages claim about the business, in one file.
 *
 * The About and Contact pages state facts — a phone number, a city, a year.
 * Those belong in one place rather than spread across three pages, so changing
 * a number is one edit and cannot leave a stale copy behind somewhere.
 *
 * A number is a number in every language. A *phrase* is not, so the three that
 * are sentences rather than data carry one value per locale — otherwise an
 * Amharic page reads beautifully until it hits "one working day" in the middle
 * of a sentence.
 *
 * Anything set to `null` is simply not rendered, so a channel we do not run
 * costs a line on the page rather than a dead link.
 */

/** A value that has to be said, not just shown — one per language. */
type Phrase = Record<Locale, string>;

export const CONTACT = {
  /**
   * TODO: no public address yet. Until there is one the form is the written
   * route in, and the phone is what the failure message hands out instead.
   */
  email: null as string | null,
  /** Displayed as typed, and dialled with the spaces stripped. */
  phone: "0925 804 393",
  /** TODO: handle only, no @. Set to null to drop the link. */
  telegram: null as string | null,
  /** Handle only, no @. */
  instagram: "scan.and.smile" as string | null,
  /** Handle only, no @. */
  tiktok: "scan.smile" as string | null,
  /** TODO: digits only, country code first. Null drops the link. */
  whatsapp: null as string | null,

  /** TODO: where you are. Shown on the contact page, not a postal address. */
  city: {
    en: "Addis Ababa, Ethiopia",
    am: "አዲስ አበባ፣ ኢትዮጵያ",
    om: "Finfinnee, Itoophiyaa",
  } satisfies Phrase,

  /** TODO: when a message gets an answer. */
  hours: {
    en: "Monday to Saturday, 9am – 7pm (EAT)",
    am: "ከሰኞ እስከ ቅዳሜ፣ ከጠዋቱ 3:00 እስከ ምሽቱ 1:00 (የአዲስ አበባ ሰዓት)",
    om: "Wiixata hanga Sanbataa, 9am – 7pm (EAT)",
  } satisfies Phrase,

  /** TODO: how quickly you reply. Promise something you can keep. */
  replyWithin: {
    en: "one working day",
    am: "አንድ የሥራ ቀን",
    om: "guyyaa hojii tokko",
  } satisfies Phrase,
} as const;

export const ABOUT = {
  /** TODO: the year you ran the first event. */
  founded: "2025",
  /** TODO: names, or delete the team block on the About page. */
  people: [
    {
      name: "TODO — founder",
      role: { en: "Design and printing", am: "ዲዛይንና ኅትመት", om: "Dizaayinii fi maxxansa" },
    },
    {
      name: "TODO — partner",
      role: { en: "Events and setup", am: "ዝግጅትና ዝግጅት ቦታ", om: "Sagantaa fi qophii" },
    },
  ] as { name: string; role: Phrase }[],
} as const;

/** `tel:` and `wa.me` want digits; humans want the spaces. */
export const dialable = (phone: string) => phone.replace(/[^\d+]/g, "");

/**
 * The one line a message can always be answered on.
 *
 * The contact form tells people where to go when saving their enquiry fails,
 * and that route cannot be the app itself. An address is the better answer
 * when there is one; until then the phone is what we can honestly offer.
 */
export const fallbackContact = () => CONTACT.email ?? CONTACT.phone;

export const telegramUrl = (handle: string) => `https://t.me/${handle}`;
export const instagramUrl = (handle: string) => `https://instagram.com/${handle}`;
export const tiktokUrl = (handle: string) => `https://tiktok.com/@${handle}`;
export const whatsappUrl = (digits: string) => `https://wa.me/${digits}`;

/**
 * The public navigation. Paths are locale-relative — the layout prefixes them
 * with the language being read, so a link never drops a reader back into
 * English.
 */
export const SITE_NAV = [
  { path: "/how-it-works", key: "howItWorks" },
  { path: "/about", key: "about" },
  { path: "/contact", key: "contact" },
] as const;
