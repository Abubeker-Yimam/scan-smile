import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dictionary } from "@/lib/dictionaries";
import { EVENT_KINDS, type EventKind } from "@/lib/events";
import { fill, isLocale, localeAlternates } from "@/lib/i18n";
import {
  CONTACT,
  dialable,
  instagramUrl,
  telegramUrl,
  whatsappUrl,
} from "@/lib/site";
import type { LangParams } from "../layout";
import { ContactForm } from "./contact-form";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const d = dictionary(lang);
  return {
    title: d.contact.metaTitle,
    description: d.contact.metaDescription,
    alternates: localeAlternates("/contact"),
  };
}

export default async function ContactPage({ params }: LangParams) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const d = dictionary(lang);
  const t = d.contact;

  /**
   * Two ways to reach a person, side by side on purpose.
   *
   * The form lands in the dashboard and never gets lost. The links open the
   * app someone already has open — which is what most people on a phone will
   * use, and refusing to offer it only loses the enquiry.
   */
  const direct = [
    { label: t.labels.email, value: CONTACT.email, href: `mailto:${CONTACT.email}` },
    { label: t.labels.phone, value: CONTACT.phone, href: `tel:${dialable(CONTACT.phone)}` },
    CONTACT.telegram && {
      label: t.labels.telegram,
      value: `@${CONTACT.telegram}`,
      href: telegramUrl(CONTACT.telegram),
    },
    CONTACT.whatsapp && {
      label: t.labels.whatsapp,
      value: CONTACT.phone,
      href: whatsappUrl(CONTACT.whatsapp),
    },
    CONTACT.instagram && {
      label: t.labels.instagram,
      value: `@${CONTACT.instagram}`,
      href: instagramUrl(CONTACT.instagram),
    },
  ].filter(Boolean) as { label: string; value: string; href: string }[];

  const occasions = (Object.keys(EVENT_KINDS) as EventKind[]).map((kind) => ({
    value: kind,
    label: d.occasions[kind],
  }));

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
        <p className="mt-7 font-body text-lg text-cotton/70">{t.lede}</p>
      </header>

      <div className="mt-12 grid gap-12 sm:mt-16 sm:gap-14 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <h2 className="font-mono text-[0.6rem] tracking-[0.2em] text-cotton/45 uppercase">
            {t.formHeading}
          </h2>
          <div className="mt-7">
            <ContactForm locale={lang} text={t.form} occasions={occasions} />
          </div>
        </section>

        <aside className="space-y-10">
          <div>
            <h2 className="font-mono text-[0.6rem] tracking-[0.2em] text-cotton/45 uppercase">
              {t.directHeading}
            </h2>
            <dl className="mt-6 divide-y divide-cotton/10 border-y border-cotton/10">
              {direct.map((item) => (
                <div key={item.label} className="flex items-baseline gap-4 py-3.5">
                  <dt className="w-24 shrink-0 font-mono text-[0.58rem] tracking-[0.18em] text-cotton/40 uppercase">
                    {item.label}
                  </dt>
                  <dd className="min-w-0 font-body text-sm">
                    <a
                      href={item.href}
                      dir="ltr"
                      className="break-words text-cotton/80 hover:text-gold"
                    >
                      {item.value}
                    </a>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="border border-cotton/15 px-6 py-6">
            <div className="tibeb h-2 w-16" aria-hidden="true" />
            <h2 className="mt-5 font-display text-lg font-semibold">{t.whenHeading}</h2>
            <p className="mt-2 font-body text-sm text-cotton/65">{CONTACT.hours[lang]}</p>
            <p className="mt-3 font-body text-sm text-cotton/65">
              {fill(t.whenBody, CONTACT.replyWithin[lang])}
            </p>
          </div>

          <div>
            <h2 className="font-mono text-[0.6rem] tracking-[0.2em] text-cotton/45 uppercase">
              {t.whereHeading}
            </h2>
            <p className="mt-4 font-display text-xl font-semibold">{CONTACT.city[lang]}</p>
            <p className="mt-2 font-body text-sm text-cotton/60">{t.whereBody}</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
