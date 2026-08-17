import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dictionary } from "@/lib/dictionaries";
import { fill, isLocale, localeAlternates } from "@/lib/i18n";
import { CONTACT } from "@/lib/site";
import type { LangParams } from "../layout";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const d = dictionary(lang);
  return {
    title: d.howItWorks.metaTitle,
    description: d.howItWorks.metaDescription,
    alternates: localeAlternates("/how-it-works"),
  };
}

export default async function HowItWorksPage({ params }: LangParams) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const d = dictionary(lang);
  const t = d.howItWorks;

  return (
    <main className="mx-auto max-w-[64rem] px-6 py-12 sm:py-20">
      <header className="max-w-[38rem]">
        <p className="font-mono text-[0.62rem] tracking-[0.2em] text-gold uppercase">{t.eyebrow}</p>
        <h1
          className="mt-5 font-display font-black tracking-tight"
          style={{ fontSize: "clamp(2.5rem, 7vw, 4rem)", lineHeight: "0.98" }}
        >
          {t.title}
        </h1>
        <p className="mt-7 font-body text-lg text-cotton/70">{t.lede}</p>
      </header>

      <ol className="mt-20 space-y-16">
        {t.steps.map((step, index) => (
          <li key={step.title} className="grid gap-6 sm:grid-cols-[8rem_1fr] sm:gap-10">
            <div>
              <p className="font-mono text-[0.6rem] tracking-[0.2em] text-gold uppercase">
                {t.stepLabel} {index + 1}
              </p>
              <div className="tibeb mt-4 h-2 w-16" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight">{step.title}</h2>
              <p className="mt-2 font-mono text-[0.62rem] tracking-[0.16em] text-cotton/45 uppercase">
                {step.lede}
              </p>
              {step.body.map((paragraph) => (
                <p key={paragraph} className="mt-5 max-w-[38rem] font-body text-cotton/70">
                  {paragraph}
                </p>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-24 border-t border-cotton/10 pt-12 sm:mt-32">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {t.guestHeading}
        </h2>
        <ol className="mt-10 grid gap-8 sm:grid-cols-3">
          {t.guestSteps.map((text, index) => (
            <li key={text}>
              <p className="font-display text-5xl font-black text-cotton/15">{index + 1}</p>
              <p className="mt-3 font-body text-cotton/70">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-24 border-t border-cotton/10 pt-12 sm:mt-32">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {t.faqHeading}
        </h2>
        <dl className="mt-10 divide-y divide-cotton/10 border-y border-cotton/10">
          {t.faq.map((item) => (
            <div key={item.q} className="grid gap-3 py-7 sm:grid-cols-[1fr_1.4fr] sm:gap-10">
              <dt className="font-display text-xl font-semibold">{item.q}</dt>
              <dd className="font-body text-cotton/65">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-20 border border-cotton/15 px-8 py-12 sm:px-12">
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
            href={`/${lang}`}
            className="font-mono text-[0.7rem] tracking-[0.16em] text-cotton/70 uppercase underline underline-offset-4 hover:text-gold"
          >
            {t.ctaLink}
          </Link>
        </div>
      </section>
    </main>
  );
}
