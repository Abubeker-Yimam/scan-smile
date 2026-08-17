"use server";

import { db } from "@/lib/db";
import { dictionary } from "@/lib/dictionaries";
import { EVENT_KINDS, type EventKind } from "@/lib/events";
import { DEFAULT_LOCALE, fill, isLocale, type Locale } from "@/lib/i18n";
import { CONTACT } from "@/lib/site";

export type ContactState = { error?: string; ok?: string };

/**
 * Caps, so an unauthenticated form cannot post a novel into the database.
 * Generous enough that nobody writing in good faith ever meets one.
 *
 * Counted in UTF-16 units rather than characters, which matters here: Amharic
 * is one unit per syllable, so the limits are as roomy in ግዕዝ as in Latin.
 */
const MAX = { name: 120, email: 200, phone: 40, message: 4000 };

function text(form: FormData, key: string): string {
  return (form.get(key) as string | null)?.trim() ?? "";
}

/**
 * Deliberately loose. The point is to catch a typo, not to adjudicate RFC 5322 —
 * a validator strict enough to be interesting rejects real addresses, and the
 * cost of a wrong one here is a reply that bounces, not a security hole.
 */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** A headcount, or null. Nonsense is dropped rather than refused — the message is what matters. */
function parseGuestCount(value: string): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 100_000) return null;
  return parsed;
}

/**
 * An enquiry from the public contact page.
 *
 * This is the one write path in the app that anyone on the internet can reach,
 * so it carries its own defences: a honeypot field no human ever sees, length
 * caps on every column, and nothing rendered back to the sender that they
 * supplied. It writes a row and stops — no email, no webhook, nothing that can
 * be turned into a way to send mail from someone else's address.
 *
 * The language comes from a hidden field rather than a header, so someone who
 * read the page in Afaan Oromoo is refused in Afaan Oromoo. It is only ever
 * used to choose a message: an unrecognised value falls back to English rather
 * than reaching anything.
 */
export async function sendInquiry(_prev: ContactState, form: FormData): Promise<ContactState> {
  const submitted = text(form, "lang");
  const lang: Locale = isLocale(submitted) ? submitted : DEFAULT_LOCALE;
  const t = dictionary(lang).contact;

  // Bots fill in every field they find. A human never sees this one, so
  // anything in it is a bot — answered with the same success message it would
  // get from a real submission, because telling a spammer why they failed is
  // how they learn to pass.
  if (text(form, "website")) {
    return { ok: t.sentShort };
  }

  const name = text(form, "name").slice(0, MAX.name);
  const email = text(form, "email").slice(0, MAX.email);
  const message = text(form, "message").slice(0, MAX.message);

  if (!name) return { error: t.errors.name };
  if (!looksLikeEmail(email)) return { error: t.errors.email };
  if (message.length < 10) return { error: t.errors.message };

  const kind = text(form, "kind");

  try {
    await db.inquiry.create({
      data: {
        name,
        email,
        phone: text(form, "phone").slice(0, MAX.phone) || null,
        kind: kind in EVENT_KINDS ? (kind as EventKind) : "OTHER",
        message,
        eventDate: parseDate(text(form, "eventDate")),
        guestCount: parseGuestCount(text(form, "guestCount")),
        // Which language they wrote in, so the reply can start in the same one.
        locale: lang,
      },
    });
  } catch (error) {
    console.error("Could not save a contact enquiry:", error);
    // Someone took the trouble to write. Losing that silently is worse than
    // admitting the failure and handing them an address that does not depend
    // on this app being healthy.
    return { error: fill(t.errors.saveFailed, CONTACT.email) };
  }

  return { ok: fill(t.sent, CONTACT.replyWithin[lang]) };
}
