import Link from "next/link";
import { notFound } from "next/navigation";
import { dictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import {
  CONTACT,
  SITE_NAV,
  dialable,
  instagramUrl,
  telegramUrl,
} from "@/lib/site";
import { LanguageToggle } from "./language-toggle";
import { SiteNav } from "./nav";

export type LangParams = { params: Promise<{ lang: string }> };

/**
 * The shell every public page shares: the hall after dark, a header you can
 * navigate from and a footer that tells you how to reach a person.
 *
 * The dashboard and the guest page deliberately do not use it. A guest holding
 * a phone at a table has no use for a marketing header, and the dashboard is a
 * tool rather than a shopfront.
 *
 * `[lang]` sits above every public page, so an unknown first segment lands
 * here and is refused once, rather than in each page separately.
 */
export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
} & LangParams) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const d = dictionary(lang);
  const year = new Date().getFullYear();
  const nav = SITE_NAV.map((item) => ({
    href: `/${lang}${item.path}`,
    label: d.nav[item.key],
  }));

  return (
    <div className="flex min-h-dvh flex-col bg-ink text-cotton">
      <header className="border-b border-cotton/10">
        {/* On a phone this is two rows — the name, the dashboard and the
            language you read it in, then the page links underneath. Four
            items sharing one wrapping row fitted, but only just, and in
            Amharic the labels are long enough to leave nothing between them. */}
        <div className="mx-auto flex max-w-[64rem] flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4 sm:gap-x-8 sm:px-6 sm:py-5">
          <Link href={`/${lang}`} className="font-display text-lg font-bold tracking-tight">
            Scan &amp; Smile
          </Link>
          <SiteNav
            items={nav}
            navLabel={d.nav.label}
            className="order-last w-full sm:order-none sm:w-auto"
          />
          {/* The language sits furthest right, past the dashboard link: it is
              the control a visitor looks for in the corner, and the one they
              need before they can read anything else on the page. */}
          <div className="ml-auto flex items-center gap-5 sm:gap-6">
            <Link
              href="/admin"
              className="font-mono text-[0.62rem] tracking-[0.18em] text-cotton/60 uppercase underline underline-offset-4 hover:text-gold"
            >
              {d.nav.dashboard}
            </Link>
            <LanguageToggle current={lang} label={d.nav.languageLabel} />
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="mt-24 border-t border-cotton/10">
        <div className="mx-auto grid max-w-[64rem] gap-10 px-5 py-10 sm:grid-cols-[1.2fr_1fr_1fr] sm:px-6 sm:py-12">
          <div>
            <p className="font-display text-lg font-bold tracking-tight">Scan &amp; Smile</p>
            <p className="mt-2 max-w-[22rem] font-body text-sm text-cotton/60">{d.footer.blurb}</p>
            <div className="tibeb mt-6 h-2 w-32" aria-hidden="true" />
          </div>

          <nav aria-label={d.nav.footerLabel}>
            <h2 className="font-mono text-[0.6rem] tracking-[0.2em] text-cotton/40 uppercase">
              {d.nav.pages}
            </h2>
            <ul className="mt-4 space-y-2 font-body text-sm">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-cotton/70 hover:text-gold">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/admin" className="text-cotton/70 hover:text-gold">
                  {d.nav.dashboard}
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="font-mono text-[0.6rem] tracking-[0.2em] text-cotton/40 uppercase">
              {d.nav.reach}
            </h2>
            <ul className="mt-4 space-y-2 font-body text-sm">
              <li>
                <a href={`mailto:${CONTACT.email}`} className="text-cotton/70 hover:text-gold">
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${dialable(CONTACT.phone)}`}
                  className="text-cotton/70 hover:text-gold"
                  dir="ltr"
                >
                  {CONTACT.phone}
                </a>
              </li>
              {CONTACT.telegram && (
                <li>
                  <a
                    href={telegramUrl(CONTACT.telegram)}
                    className="text-cotton/70 hover:text-gold"
                  >
                    {d.contact.labels.telegram} @{CONTACT.telegram}
                  </a>
                </li>
              )}
              {CONTACT.instagram && (
                <li>
                  <a
                    href={instagramUrl(CONTACT.instagram)}
                    className="text-cotton/70 hover:text-gold"
                  >
                    {d.contact.labels.instagram} @{CONTACT.instagram}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mx-auto max-w-[64rem] px-5 pb-10 sm:px-6">
          <p className="font-mono text-[0.58rem] tracking-[0.2em] text-cotton/35 uppercase">
            © {year} Scan &amp; Smile · {CONTACT.city[lang]}
          </p>
        </div>
      </footer>
    </div>
  );
}
