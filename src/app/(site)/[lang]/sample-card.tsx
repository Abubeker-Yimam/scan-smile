"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/dictionaries";
import { EVENT_KINDS, threadVars, type EventKind } from "@/lib/events";
import { fill } from "@/lib/i18n";

/** Every occasion but OTHER, which is the fallback rather than a choice. */
type Occasion = Exclude<EventKind, "OTHER">;

const OCCASIONS = (Object.keys(EVENT_KINDS) as EventKind[]).filter(
  (kind): kind is Occasion => kind !== "OTHER"
);

/**
 * Only the strings this card needs, rather than the whole dictionary. They
 * cross into the browser as part of the payload, and three languages of copy
 * for four pages is not something to ship in order to label seven chips.
 */
export type SampleCardText = {
  caption: string;
  weaveFor: string;
  blurb: string;
  link: string;
  /** Carries a `{v}` where the host names belong. */
  scanFor: string;
  samples: Dictionary["home"]["samples"];
  occasions: Dictionary["occasions"];
};

/**
 * The hero card, re-woven on demand.
 *
 * Picking an occasion swaps the three threads, the eyebrow and the sample
 * details, and the bands unfold again — the same `u-band` and `u-rise` the
 * guest page uses on arrival, restarted by re-keying the elements. Both are
 * already switched off under prefers-reduced-motion, so the card simply
 * changes rather than animating for anyone who asked for less movement.
 *
 * Recolouring alone would read as a swatch. Changing the hosts, the date and
 * the table as well makes the point the product is making: the same card
 * dresses a wedding and a graduation without either looking borrowed.
 *
 * The QR image sits outside the keyed elements on purpose: it points at the
 * same demo guest whatever the occasion, and re-mounting it would flash a
 * fresh request through /api/qr for no reason.
 */
export function SampleCard({
  demo,
  text,
}: {
  demo: { code: string; name: string };
  text: SampleCardText;
}) {
  const [occasion, setOccasion] = useState<Occasion>("WEDDING");
  const sample = text.samples[occasion];

  return (
    <div className="mx-auto w-full max-w-[22rem]">
      <figure style={threadVars(occasion)}>
        <div className="bg-cotton">
          <div key={`top-${occasion}`} className="tibeb u-band h-3" aria-hidden="true" />
          <div className="px-8 py-9 text-center">
            <p
              key={`eyebrow-${occasion}`}
              className="u-rise font-mono text-[0.6rem] tracking-[0.2em] text-ash uppercase"
            >
              {text.occasions[occasion]} · {sample.date}
            </p>
            <p className="mt-5 font-display text-2xl font-bold text-coffee">{demo.name}</p>
            <p className="mt-1 font-mono text-[0.6rem] tracking-[0.18em] text-ash uppercase">
              {sample.table}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/qr/${demo.code}?size=800`}
              alt={`QR — ${demo.name}`}
              className="mx-auto mt-6 w-40"
              width={800}
              height={800}
            />
            <p className="mt-2 font-mono text-[0.75rem] tracking-[0.28em] text-coffee">
              {demo.code}
            </p>
            <p
              key={`hosts-${occasion}`}
              className="u-rise mt-5 font-body text-xs text-ash"
              style={{ animationDelay: "0.1s" }}
            >
              {fill(text.scanFor, sample.hosts)}
            </p>
          </div>
          <div key={`bottom-${occasion}`} className="tibeb u-band h-3" aria-hidden="true" />
        </div>
        <figcaption className="mt-4 text-center font-mono text-[0.6rem] tracking-[0.18em] text-cotton/50 uppercase">
          {text.caption}
        </figcaption>
      </figure>

      <fieldset className="mt-8">
        <legend className="font-mono text-[0.6rem] tracking-[0.2em] text-cotton/50 uppercase">
          {text.weaveFor}
        </legend>
        {/* Real radios, hidden but present: arrow keys move between occasions
            and a screen reader announces one choice out of seven, both of
            which a row of styled buttons would have had to reimplement. */}
        <div className="mt-4 flex flex-wrap gap-2">
          {OCCASIONS.map((kind) => {
            const threads = EVENT_KINDS[kind].threads;
            const selected = kind === occasion;
            return (
              <label
                key={kind}
                className={
                  "flex cursor-pointer items-center gap-2 border px-3 py-2 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold " +
                  (selected
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-cotton/15 text-cotton/60 hover:border-cotton/40 hover:text-cotton")
                }
              >
                <input
                  type="radio"
                  name="occasion"
                  value={kind}
                  checked={selected}
                  onChange={() => setOccasion(kind)}
                  className="sr-only"
                />
                <span
                  className="tibeb h-2.5 w-6 shrink-0"
                  style={
                    {
                      "--t1": threads[0],
                      "--t2": threads[1],
                      "--t3": threads[2],
                    } as CSSProperties
                  }
                  aria-hidden="true"
                />
                <span className="font-mono text-[0.6rem] tracking-[0.14em] uppercase">
                  {text.occasions[kind]}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <p className="mt-5 font-body text-sm text-cotton/60">
        {text.blurb}{" "}
        <Link
          href={`/g/${demo.code}`}
          // Prefetching would render the guest page and count as a scan.
          prefetch={false}
          className="text-gold underline underline-offset-4"
        >
          {text.link}
        </Link>
        .
      </p>
    </div>
  );
}
