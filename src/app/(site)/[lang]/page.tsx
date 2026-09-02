import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dictionary } from "@/lib/dictionaries";
import { db } from "@/lib/db";
import { isLocale, localeAlternates } from "@/lib/i18n";
import { CONTACT, telegramUrl } from "@/lib/site";
import { SampleCard } from "./sample-card";
import { FaqAccordion } from "./faq-accordion";
import type { LangParams } from "./layout";

export const dynamic = "force-dynamic";

const DEMO_CODE = "DEMO247";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const d = dictionary(lang);
  const title = `${d.home.metaTitle} — ${d.home.metaDescription}`;
  const description = d.home.heroBody;

  return {
    title,
    description,
    alternates: localeAlternates(""),
    openGraph: {
      title,
      description,
      locale: lang,
      type: "website",
      siteName: "Scan & Smile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/**
 * Load the demo guest if present in the database.
 * If the database is cold or unseeded, returns null and SampleCard falls
 * back to in-memory demo data gracefully so public visitors never see errors.
 */
async function loadDemo() {
  try {
    return await db.guest.findUnique({
      where: { code: DEMO_CODE },
      select: { code: true, name: true },
    });
  } catch (error) {
    console.warn("Home page demo guest lookup fallback:", error);
    return null;
  }
}

export default async function HomePage({ params }: LangParams) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const d = dictionary(lang);
  const demo = await loadDemo();

  return (
    <main>
      <div className="mx-auto max-w-[64rem] px-5 py-10 sm:px-6 sm:py-20">
        {/* Hero section */}
        <section className="grid items-center gap-10 sm:gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <h1
              className="font-display font-black tracking-tight"
              style={{ fontSize: "clamp(2.75rem, 8vw, 5rem)", lineHeight: "0.95" }}
            >
              {d.home.heroTop}
              <br />
              <span className="text-gold italic">{d.home.heroEm}</span>
              <br />
              {d.home.heroBottom}
            </h1>
            <p className="mt-8 max-w-[30rem] font-body text-lg text-cotton/70">{d.home.heroBody}</p>

            <div className="mt-10 flex flex-wrap items-center gap-4 sm:gap-5">
              <Link
                href={`/${lang}/contact`}
                className="border border-gold bg-gold px-6 py-3 font-mono text-[0.7rem] font-semibold tracking-[0.16em] text-ink uppercase transition-colors hover:bg-transparent hover:text-gold"
              >
                {d.home.heroCta}
              </Link>
              {CONTACT.telegram && (
                <a
                  href={telegramUrl(CONTACT.telegram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-cotton/25 bg-ink-2 px-5 py-3 font-mono text-[0.7rem] tracking-[0.14em] text-cotton uppercase transition-colors hover:border-gold hover:text-gold"
                >
                  <svg className="h-3.5 w-3.5 fill-current text-gold" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                  </svg>
                  {d.home.heroTelegramCta}
                </a>
              )}
              <Link
                href={`/${lang}/how-it-works`}
                className="font-mono text-[0.7rem] tracking-[0.16em] text-cotton/70 uppercase underline underline-offset-4 transition-colors hover:text-gold"
              >
                {d.home.heroSecondary}
              </Link>
            </div>
          </div>

          <SampleCard
            demo={demo}
            text={{
              caption: d.home.cardCaption,
              weaveFor: d.home.weaveFor,
              blurb: d.home.cardBlurb,
              link: d.home.cardLink,
              scanFor: d.home.scanFor,
              viewCard: d.home.viewCard,
              viewPhone: d.home.viewPhone,
              phonePreviewGuest: d.home.phonePreviewGuest,
              phonePreviewVideoBadge: d.home.phonePreviewVideoBadge,
              samples: d.home.samples,
              sampleNotes: d.home.sampleNotes,
              occasions: d.occasions,
            }}
          />
        </section>

        {/* Four steps */}
        <section className="mt-16 border-t border-cotton/10 pt-10 sm:mt-32">
          <h2 className="font-mono text-[0.62rem] tracking-[0.2em] text-cotton/60 uppercase">
            {d.home.stepsHeading}
          </h2>
          <ol className="mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {d.home.steps.map((step, index) => (
              <li key={step.title}>
                <div className="tibeb h-2 w-16" aria-hidden="true" />
                <p className="mt-5 font-mono text-[0.6rem] tracking-[0.2em] text-gold uppercase">
                  {d.home.stepLabel} {index + 1}
                </p>
                <h3 className="mt-2 font-display text-2xl font-bold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-[26rem] font-body text-cotton/70">{step.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-12 font-body text-cotton/70">
            {d.home.stepsFooterBefore}{" "}
            <Link
              href={`/${lang}/how-it-works`}
              className="text-gold underline underline-offset-4 hover:text-gold/80"
            >
              {d.home.stepsFooterLink}
            </Link>{" "}
            {d.home.stepsFooterAfter}
          </p>
        </section>

        {/* Stats & Value Proposition */}
        <section className="mt-16 border-t border-cotton/10 pt-10 sm:mt-32">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {d.home.keepHeading}
              </h2>
              <p className="mt-6 max-w-[32rem] font-body text-cotton/70">{d.home.keepBody}</p>
            </div>
            <dl className="grid gap-8 sm:grid-cols-2">
              {d.home.stats.map((stat) => (
                <div key={stat.value}>
                  <dt className="font-display text-3xl font-black text-gold sm:text-4xl">
                    {stat.value}
                  </dt>
                  <dd className="mt-2 font-body text-sm text-cotton/70">{stat.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Testimonials / Social Proof */}
        <section className="mt-16 border-t border-cotton/10 pt-12 sm:mt-32 sm:pt-16">
          <div className="max-w-[36rem]">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {d.home.testimonialsHeading}
            </h2>
            <p className="mt-3 font-body text-cotton/70">{d.home.testimonialsSub}</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {d.home.testimonials.map((t, idx) => (
              <div
                key={idx}
                className="relative flex flex-col justify-between border border-cotton/15 bg-ink-2/60 p-6 backdrop-blur-sm sm:p-7"
              >
                <div>
                  <div className="tibeb h-1.5 w-12" aria-hidden="true" />
                  <p className="mt-5 font-body text-sm leading-relaxed text-cotton/80">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <div className="mt-6 border-t border-cotton/10 pt-4">
                  <p className="font-display font-bold text-cotton">{t.author}</p>
                  <p className="mt-0.5 font-mono text-[0.62rem] tracking-[0.14em] text-gold uppercase">
                    {t.event} · {t.venue}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive FAQ Section */}
        <FaqAccordion
          heading={d.home.faqHeading}
          subtitle={d.home.faqSub}
          items={d.home.faqs}
        />

        {/* Final CTA Banner */}
        <section className="mt-16 border border-cotton/20 bg-ink-2/40 px-6 py-10 sm:mt-32 sm:px-12 sm:py-14">
          <div className="tibeb h-2 w-20" aria-hidden="true" />
          <h2 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {d.home.ctaHeading}
          </h2>
          <p className="mt-4 max-w-[34rem] font-body text-cotton/70">{d.home.ctaBody}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-6">
            <Link
              href={`/${lang}/contact`}
              className="border border-gold bg-gold px-6 py-3 font-mono text-[0.7rem] font-semibold tracking-[0.16em] text-ink uppercase transition-colors hover:bg-transparent hover:text-gold"
            >
              {d.home.ctaButton}
            </Link>
            {CONTACT.telegram && (
              <a
                href={telegramUrl(CONTACT.telegram)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-cotton/25 bg-ink px-5 py-3 font-mono text-[0.7rem] tracking-[0.14em] text-cotton uppercase transition-colors hover:border-gold hover:text-gold"
              >
                <svg className="h-3.5 w-3.5 fill-current text-gold" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                </svg>
                {d.home.heroTelegramCta}
              </a>
            )}
            <Link
              href={`/${lang}/about`}
              className="font-mono text-[0.7rem] tracking-[0.16em] text-cotton/70 uppercase underline underline-offset-4 transition-colors hover:text-gold"
            >
              {d.home.ctaLink}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
