import type { CSSProperties } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { EVENT_KINDS } from "@/lib/events";

export const dynamic = "force-dynamic";

const DEMO_CODE = "DEMO247";

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

export default async function HomePage() {
  const { demo, unavailable } = await loadDemo();

  return (
    <main className="min-h-dvh bg-ink text-cotton">
      <div className="mx-auto max-w-[64rem] px-6 py-12 sm:py-20">
        <header className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <p className="font-display text-lg font-bold tracking-tight">Scan &amp; Smile</p>
          <Link
            href="/admin"
            className="ml-auto font-mono text-[0.62rem] tracking-[0.18em] text-cotton/60 uppercase underline underline-offset-4 hover:text-gold"
          >
            Host dashboard
          </Link>
        </header>

        {/* The hero is the product: a code on a table, waiting to be scanned. */}
        <section className="mt-16 grid items-center gap-12 sm:mt-24 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <h1
              className="font-display font-black tracking-tight"
              style={{ fontSize: "clamp(2.75rem, 8vw, 5rem)", lineHeight: "0.95" }}
            >
              One scan,
              <br />
              <span className="text-gold italic">a lifetime</span>
              <br />
              of memories
            </h1>
            <p className="mt-8 max-w-[30rem] font-body text-lg text-cotton/70">
              Every guest at your celebration finds a card at their place with their name on it.
              They scan it, and a page opens that was written for them alone — a welcome, a note
              from you, a photo, a short video.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Link
                href="/admin"
                className="border border-gold bg-gold px-6 py-3 font-mono text-[0.7rem] tracking-[0.16em] text-ink uppercase hover:bg-transparent hover:text-gold"
              >
                Set up an event
              </Link>
              {demo && (
                <Link
                  href={`/g/${demo.code}`}
                  // Prefetching would render the guest page and count as a scan.
                  prefetch={false}
                  className="font-mono text-[0.7rem] tracking-[0.16em] text-cotton/70 uppercase underline underline-offset-4 hover:text-gold"
                >
                  See a guest&apos;s page
                </Link>
              )}
            </div>
          </div>

          {demo ? (
            <figure className="mx-auto w-full max-w-[20rem]">
              <div className="bg-cotton">
                <div className="tibeb h-3" aria-hidden="true" />
                <div className="px-8 py-9 text-center">
                  <p className="font-mono text-[0.6rem] tracking-[0.2em] text-ash uppercase">
                    Wedding · 12 September 2026
                  </p>
                  <p className="mt-5 font-display text-2xl font-bold text-coffee">{demo.name}</p>
                  <p className="mt-1 font-mono text-[0.6rem] tracking-[0.18em] text-ash uppercase">
                    Table 4
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/qr/${demo.code}?size=800`}
                    alt={`QR code opening the sample page for ${demo.name}`}
                    className="mx-auto mt-6 w-40"
                    width={800}
                    height={800}
                  />
                  <p className="mt-2 font-mono text-[0.75rem] tracking-[0.28em] text-coffee">
                    {demo.code}
                  </p>
                  <p className="mt-5 font-body text-xs text-ash">
                    Scan for a message from Megersa &amp; Sara
                  </p>
                </div>
                <div className="tibeb h-3" aria-hidden="true" />
              </div>
              <figcaption className="mt-4 text-center font-mono text-[0.6rem] tracking-[0.18em] text-cotton/50 uppercase">
                A real card — point your phone at it
              </figcaption>
            </figure>
          ) : (
            <p className="border border-dashed border-cotton/20 px-6 py-10 text-center font-body text-cotton/60">
              {unavailable ? (
                <>The sample card is taking a moment to load. Refresh in a few seconds.</>
              ) : (
                <>
                  Run <code className="font-mono text-gold">npm run setup</code> to load the sample
                  event and see a live card here.
                </>
              )}
            </p>
          )}
        </section>

        <section className="mt-24 border-t border-cotton/10 pt-10 sm:mt-32">
          <h2 className="font-mono text-[0.62rem] tracking-[0.2em] text-cotton/50 uppercase">
            Made for
          </h2>
          <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            {Object.entries(EVENT_KINDS)
              .filter(([value]) => value !== "OTHER")
              .map(([value, config]) => (
                <li key={value} className="flex items-center gap-3">
                  <span
                    className="tibeb h-3 w-8"
                    style={
                      {
                        "--t1": config.threads[0],
                        "--t2": config.threads[1],
                        "--t3": config.threads[2],
                      } as CSSProperties
                    }
                    aria-hidden="true"
                  />
                  <span className="font-display text-lg">{config.label}</span>
                </li>
              ))}
          </ul>
          <p className="mt-8 max-w-[34rem] font-body text-cotton/60">
            Each occasion is woven in its own colours, so a graduation card never looks like a
            wedding card.
          </p>
        </section>
      </div>
    </main>
  );
}
