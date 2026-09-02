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

export type SampleCardText = {
  caption: string;
  weaveFor: string;
  blurb: string;
  link: string;
  /** Carries a `{v}` where the host names belong. */
  scanFor: string;
  viewCard: string;
  viewPhone: string;
  phonePreviewGuest: string;
  phonePreviewVideoBadge: string;
  samples: Dictionary["home"]["samples"];
  sampleNotes: Dictionary["home"]["sampleNotes"];
  occasions: Dictionary["occasions"];
};

const DEFAULT_DEMO = {
  code: "DEMO247",
  name: "Sara Megersa",
};

/**
 * The hero interactive preview: toggle between the physical table card
 * and what the guest sees on their phone when they scan it.
 */
export function SampleCard({
  demo = DEFAULT_DEMO,
  text,
}: {
  demo?: { code: string; name: string } | null;
  text: SampleCardText;
}) {
  const activeDemo = demo?.code ? demo : DEFAULT_DEMO;
  const [occasion, setOccasion] = useState<Occasion>("WEDDING");
  const [viewMode, setViewMode] = useState<"card" | "phone">("card");
  const sample = text.samples[occasion];
  const sampleNote = text.sampleNotes[occasion];

  return (
    <div className="relative mx-auto w-full max-w-[24rem]">
      {/* Subtle warm ambient lighting behind the interactive preview */}
      <div
        className="pointer-events-none absolute -inset-6 -z-10 rounded-full opacity-60 blur-3xl transition-opacity"
        style={{
          background:
            "radial-gradient(circle, rgba(199, 154, 63, 0.18) 0%, rgba(142, 31, 47, 0.08) 45%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* View Switcher: Table Card vs Guest's Phone */}
      <div className="mb-4 flex items-center justify-center">
        <div className="inline-flex rounded-full border border-cotton/20 bg-ink-2/90 p-1 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setViewMode("card")}
            className={
              "flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-[0.65rem] tracking-[0.14em] uppercase transition-all " +
              (viewMode === "card"
                ? "bg-gold text-ink font-semibold shadow-sm"
                : "text-cotton/70 hover:text-cotton")
            }
          >
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            {text.viewCard}
          </button>
          <button
            type="button"
            onClick={() => setViewMode("phone")}
            className={
              "flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-[0.65rem] tracking-[0.14em] uppercase transition-all " +
              (viewMode === "phone"
                ? "bg-gold text-ink font-semibold shadow-sm"
                : "text-cotton/70 hover:text-cotton")
            }
          >
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="5" y="2" width="14" height="20" rx="3" />
              <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" />
            </svg>
            {text.viewPhone}
          </button>
        </div>
      </div>

      {viewMode === "card" ? (
        /* Physical Table Card View */
        <figure style={threadVars(occasion)}>
          <div className="bg-cotton shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] transition-all">
            <div key={`top-${occasion}`} className="tibeb u-band h-3" aria-hidden="true" />
            <div className="px-8 py-9 text-center">
              <p
                key={`eyebrow-${occasion}`}
                className="u-rise font-mono text-[0.6rem] tracking-[0.2em] text-ash uppercase"
              >
                {text.occasions[occasion]} · {sample.date}
              </p>
              <p className="mt-5 font-display text-2xl font-bold text-coffee">{activeDemo.name}</p>
              <p className="mt-1 font-mono text-[0.6rem] tracking-[0.18em] text-ash uppercase">
                {sample.table}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/qr/${activeDemo.code}?size=800`}
                alt={`QR — ${activeDemo.name}`}
                className="mx-auto mt-6 w-40"
                width={800}
                height={800}
              />
              <p className="mt-2 font-mono text-[0.75rem] tracking-[0.28em] text-coffee">
                {activeDemo.code}
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
          <figcaption className="mt-4 text-center font-mono text-[0.6rem] tracking-[0.18em] text-cotton/60 uppercase">
            {text.caption}
          </figcaption>
        </figure>
      ) : (
        /* Guest's Simulated Phone Screen View */
        <div style={threadVars(occasion)} className="mx-auto max-w-[21rem]">
          <div className="overflow-hidden rounded-[2.2rem] border-4 border-cotton/30 bg-ink-2 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-cotton/10">
            {/* Phone speaker & camera notch */}
            <div className="flex h-6 items-center justify-center bg-ink">
              <div className="h-1 w-12 rounded-full bg-cotton/20" />
            </div>

            {/* Mobile guest page viewport */}
            <div className="bg-cotton pb-7">
              <div key={`phone-tibeb-${occasion}`} className="tibeb u-band h-3" aria-hidden="true" />
              <div className="px-6 pt-6 text-center">
                <p
                  key={`phone-eyebrow-${occasion}`}
                  className="u-rise font-mono text-[0.55rem] tracking-[0.2em] text-ash uppercase"
                >
                  {text.occasions[occasion]} / {sample.hosts}
                </p>

                <h3 className="mt-3 font-display text-xl font-bold text-coffee">
                  {text.phonePreviewGuest}
                </h3>
                <p className="mt-0.5 font-mono text-[0.58rem] tracking-[0.16em] text-ash uppercase">
                  {sample.table} · {sample.date}
                </p>

                {/* Personal host note */}
                <div className="mt-5 rounded-lg border border-cotton-3 bg-cotton-2/70 p-3.5 text-left">
                  <p className="font-body text-xs leading-relaxed text-coffee/90">
                    &ldquo;{sampleNote}&rdquo;
                  </p>
                  <p className="mt-2 text-right font-display text-[0.75rem] font-bold text-gold">
                    — {sample.hosts}
                  </p>
                </div>

                {/* Video / media preview mockup */}
                <div className="relative mt-4 flex h-32 w-full flex-col items-center justify-center overflow-hidden rounded-lg bg-ink-2 text-cotton">
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent" />
                  <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 bg-gold/20 text-gold backdrop-blur-sm">
                    <svg
                      className="ml-0.5 h-4 w-4 fill-current"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <p className="relative z-10 mt-2 font-mono text-[0.55rem] tracking-[0.14em] text-cotton/80 uppercase">
                    {text.phonePreviewVideoBadge}
                  </p>
                </div>
              </div>
            </div>

            {/* Home indicator bar */}
            <div className="flex h-5 items-center justify-center bg-ink">
              <div className="h-1 w-20 rounded-full bg-cotton/30" />
            </div>
          </div>

          <p className="mt-4 text-center font-mono text-[0.6rem] tracking-[0.18em] text-cotton/60 uppercase">
            {text.occasions[occasion]} · {sample.hosts}
          </p>
        </div>
      )}

      {/* Occasion Switcher Chips */}
      <fieldset className="mt-7">
        <legend className="font-mono text-[0.6rem] tracking-[0.2em] text-cotton/60 uppercase">
          {text.weaveFor}
        </legend>
        <div className="mt-3.5 flex flex-wrap gap-2">
          {OCCASIONS.map((kind) => {
            const threads = EVENT_KINDS[kind].threads;
            const selected = kind === occasion;
            return (
              <label
                key={kind}
                className={
                  "flex cursor-pointer items-center gap-2 border px-3 py-1.5 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold " +
                  (selected
                    ? "border-gold bg-gold/10 text-gold font-medium"
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
                  className="tibeb h-2.5 w-5 shrink-0"
                  style={
                    {
                      "--t1": threads[0],
                      "--t2": threads[1],
                      "--t3": threads[2],
                    } as CSSProperties
                  }
                  aria-hidden="true"
                />
                <span className="font-mono text-[0.6rem] tracking-[0.12em] uppercase">
                  {text.occasions[kind]}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <p className="mt-5 font-body text-sm text-cotton/70">
        {text.blurb}{" "}
        <Link
          href={`/g/${activeDemo.code}`}
          prefetch={false}
          className="text-gold underline underline-offset-4 hover:text-gold/80"
        >
          {text.link}
        </Link>
        .
      </p>
    </div>
  );
}
