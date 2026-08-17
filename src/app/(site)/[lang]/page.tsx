import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dictionary } from "@/lib/dictionaries";
import { db } from "@/lib/db";
import { isLocale, localeAlternates } from "@/lib/i18n";
import { SampleCard } from "./sample-card";
import type { LangParams } from "./layout";

export const dynamic = "force-dynamic";

const DEMO_CODE = "DEMO247";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const d = dictionary(lang);
  return {
    title: d.home.metaTitle,
    description: d.home.metaDescription,
    alternates: localeAlternates(""),
  };
}

/**
 * The sample card is an illustration, not information. Nobody arriving at this
 * page needs it to render, so a database that is briefly unreachable costs a
 * visitor one figure rather than the whole page — which is what happened
 * before: a decorative query took down the front door.
 *
 * The two empty cases are told apart because they call for opposite things. No
 * demo guest is a setup step. A database that will not answer is a wait.
 */
async function loadDemo() {
  try {
    return {
      demo: await db.guest.findUnique({
        where: { code: DEMO_CODE },
        select: { code: true, name: true },
      }),
      unavailable: false,
    };
  } catch (error) {
    console.error("Home page could not load the sample card:", error);
    return { demo: null, unavailable: true };
  }
}

export default async function HomePage({ params }: LangParams) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const d = dictionary(lang);
  const { demo, unavailable } = await loadDemo();

  return (
    <main>
      <div className="mx-auto max-w-[64rem] px-5 py-10 sm:px-6 sm:py-20">
        {/* The hero is the product: a code on a table, waiting to be scanned. */}
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
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Link
                href={`/${lang}/contact`}
                className="border border-gold bg-gold px-6 py-3 font-mono text-[0.7rem] tracking-[0.16em] text-ink uppercase hover:bg-transparent hover:text-gold"
              >
                {d.home.heroCta}
              </Link>
              <Link
                href={`/${lang}/how-it-works`}
                className="font-mono text-[0.7rem] tracking-[0.16em] text-cotton/70 uppercase underline underline-offset-4 hover:text-gold"
              >
                {d.home.heroSecondary}
              </Link>
            </div>
          </div>

          {demo ? (
            <SampleCard
              demo={demo}
              text={{
                caption: d.home.cardCaption,
                weaveFor: d.home.weaveFor,
                blurb: d.home.cardBlurb,
                link: d.home.cardLink,
                scanFor: d.home.scanFor,
                samples: d.home.samples,
                occasions: d.occasions,
              }}
            />
          ) : (
            <p className="border border-dashed border-cotton/20 px-6 py-10 text-center font-body text-cotton/60">
              {unavailable ? (
                d.home.unavailable
              ) : (
                <>
                  {d.home.setupHintBefore}{" "}
                  <code className="font-mono text-gold">npm run setup</code> {d.home.setupHint}
                </>
              )}
            </p>
          )}
        </section>

        <section className="mt-16 border-t border-cotton/10 pt-10 sm:mt-32">
          <h2 className="font-mono text-[0.62rem] tracking-[0.2em] text-cotton/50 uppercase">
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
                <p className="mt-3 max-w-[26rem] font-body text-cotton/65">{step.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-12 font-body text-cotton/60">
            {d.home.stepsFooterBefore}{" "}
            <Link
              href={`/${lang}/how-it-works`}
              className="text-gold underline underline-offset-4"
            >
              {d.home.stepsFooterLink}
            </Link>{" "}
            {d.home.stepsFooterAfter}
          </p>
        </section>

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
                  <dd className="mt-2 font-body text-sm text-cotton/60">{stat.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mt-16 border border-cotton/15 px-6 py-10 sm:mt-32 sm:px-12 sm:py-12">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {d.home.ctaHeading}
          </h2>
          <p className="mt-4 max-w-[34rem] font-body text-cotton/70">{d.home.ctaBody}</p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Link
              href={`/${lang}/contact`}
              className="border border-gold bg-gold px-6 py-3 font-mono text-[0.7rem] tracking-[0.16em] text-ink uppercase hover:bg-transparent hover:text-gold"
            >
              {d.home.ctaButton}
            </Link>
            <Link
              href={`/${lang}/about`}
              className="font-mono text-[0.7rem] tracking-[0.16em] text-cotton/70 uppercase underline underline-offset-4 hover:text-gold"
            >
              {d.home.ctaLink}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
