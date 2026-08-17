import type { Locale } from "../i18n";
import { en, type Dictionary } from "./en";
import { am } from "./am";
import { om } from "./om";

/**
 * All three languages, loaded together.
 *
 * Dynamic imports would keep two of them out of each bundle, which is the
 * usual reason to reach for them — but these are three small objects of text,
 * they are read in server components that never ship to the browser, and the
 * async plumbing would cost more than the kilobytes it saved.
 */
const DICTIONARIES: Record<Locale, Dictionary> = { en, am, om };

export function dictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export type { Dictionary };
