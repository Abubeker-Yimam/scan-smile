import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dictionary } from "@/lib/dictionaries";
import { fill, isLocale, localeAlternates } from "@/lib/i18n";
import { ABOUT, CONTACT } from "@/lib/site";
import type { LangParams } from "../layout";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const d = dictionary(lang);
  return {
    title: d.about.metaTitle,
    description: d.about.metaDescription,
    alternates: localeAlternates("/about"),
  };
}

/**
 * TODO — the story in the dictionaries is a draft in your voice, not a
 * transcript. Everything factual is either a placeholder from `src/lib/site.ts`
 * or marked there. Read it through once and make it true: the first event, why
 * you started, and what you would rather not promise. A page about who you are
 * is the one page nobody else can write for you — in any of the three
 * languages.
 */
export default async function AboutPage({ params }: LangParams) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const d = dictionary(lang);
  const t = d.about;

  return (
    <main className="mx-auto max-w-[64rem] px-5 py-10 sm:px-6 sm:py-20">
      <header className="max-w-[38rem]">
        <p className="font-mono text-[0.62rem] tracking-[0.2em] text-gold uppercase">{t.eyebrow}</p>
        <h1
          className="mt-5 font-display font-black tracking-tight"
          style={{ fontSize: "clamp(2.5rem, 7vw, 4rem)", lineHeight: "0.98" }}
        >
          {t.title}
        </h1>
        <p className="mt-7 font-body text-lg text-cotton/70">{fill(t.lede, ABOUT.founded)}</p>
      </header>

      <div className="tibeb mt-12 h-3 w-full sm:mt-16" aria-hidden="true" />

      <section className="mt-12 grid gap-10 sm:mt-16 lg:grid-cols-[1.3fr_1fr]">
        <div className="max-w-[38rem] space-y-6 font-body text-cotton/70">
          {t.story.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <aside className="border border-cotton/15 px-6 py-7 sm:px-7 sm:py-8">
          <h2 className="font-mono text-[0.6rem] tracking-[0.2em] text-cotton/45 uppercase">
            {t.whereHeading}
          </h2>
          <p className="mt-4 font-display text-2xl font-semibold">{CONTACT.city[lang]}</p>
          <p className="mt-4 font-body text-sm text-cotton/60">{t.whereBody}</p>
          <div className="tibeb mt-7 h-2 w-20" aria-hidden="true" />
        </aside>
      </section>

      <section className="mt-16 border-t border-cotton/10 pt-12 sm:mt-24">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {t.principlesHeading}
        </h2>
        <div className="mt-12 grid gap-12 sm:grid-cols-3">
          {t.principles.map((principle) => (
            <div key={principle.title}>
              <div className="tibeb h-2 w-14" aria-hidden="true" />
              <h3 className="mt-5 font-display text-xl font-bold tracking-tight">
                {principle.title}
              </h3>
              <p className="mt-3 font-body text-sm text-cotton/65">{principle.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TODO: real names and roles, or delete this section outright — an
          honest two-line page beats a team grid with placeholders in it. */}
      <section className="mt-16 border-t border-cotton/10 pt-12 sm:mt-24">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {t.teamHeading}
        </h2>
        <ul className="mt-10 grid gap-8 sm:grid-cols-2">
          {ABOUT.people.map((person) => (
            <li key={person.name} className="border-l-2 border-gold/40 pl-5">
              <p className="font-display text-xl font-semibold">{person.name}</p>
              <p className="mt-1 font-mono text-[0.6rem] tracking-[0.18em] text-cotton/50 uppercase">
                {person.role[lang]}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16 border border-cotton/15 px-6 py-10 sm:mt-24 sm:px-12 sm:py-12">
        <h2 className="font-display text-3xl font-bold tracking-tight">{t.ctaHeading}</h2>
        <p className="mt-4 max-w-[34rem] font-body text-cotton/70">
          {fill(t.ctaBody, CONTACT.replyWithin[lang])}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <Link
            href={`/${lang}/contact`}
            className="border border-gold bg-gold px-6 py-3 font-mono text-[0.7rem] tracking-[0.16em] text-ink uppercase hover:bg-transparent hover:text-gold"
          >
            {t.ctaButton}
          </Link>
          <Link
            href={`/${lang}/how-it-works`}
            className="font-mono text-[0.7rem] tracking-[0.16em] text-cotton/70 uppercase underline underline-offset-4 hover:text-gold"
          >
            {t.ctaLink}
          </Link>
        </div>
      </section>
    </main>
  );
}
