import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { eventTheme, threadVars } from "@/lib/events";
import { formatEventDate, resolveVideo } from "@/lib/media";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string }> };

async function loadGuest(code: string) {
  return db.guest.findUnique({
    where: { code: code.toUpperCase() },
    include: { event: true },
  });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { code } = await params;
  const guest = await loadGuest(code);
  if (!guest) return { title: "Scan & Smile" };
  return {
    title: `Welcome, ${guest.name} — ${guest.event.title}`,
    description: `A personal note from ${guest.event.hostNames}.`,
  };
}

export default async function GuestPage({ params }: Params) {
  const { code } = await params;
  const guest = await loadGuest(code);
  if (!guest) notFound();

  const now = new Date();
  await db.guest.update({
    where: { id: guest.id },
    data: {
      scanCount: { increment: 1 },
      lastScannedAt: now,
      ...(guest.firstScannedAt ? {} : { firstScannedAt: now }),
    },
  });

  const { event } = guest;
  const kind = eventTheme(event);
  const message = guest.message?.trim() || event.defaultMessage?.trim() || null;
  const videoUrl = guest.videoUrl?.trim() || event.defaultVideoUrl?.trim() || null;
  const video = videoUrl ? resolveVideo(videoUrl) : null;
  const photo = guest.photoUrl?.trim() || event.coverImageUrl?.trim() || null;
  const date = formatEventDate(event.eventDate);
  const seating = [guest.tableName, guest.seat].filter(Boolean).join(" · ");

  return (
    <main
      style={threadVars(event)}
      className="min-h-dvh bg-ink px-4 py-6 sm:px-6 sm:py-12"
    >
      <div
        className="mx-auto w-full max-w-[38rem] overflow-hidden bg-cotton"
        style={{ boxShadow: "0 30px 80px -20px rgb(0 0 0 / 0.75)" }}
      >
        {/* Woven selvedge — the top end of the cloth. */}
        <div className="tibeb u-band h-4" aria-hidden="true" />

        <div className="px-6 pt-9 pb-10 sm:px-12 sm:pt-14 sm:pb-14">
          <p
            className="u-rise font-mono text-[0.68rem] tracking-[0.22em] text-ash uppercase"
            style={{ animationDelay: "0.15s" }}
          >
            {kind.eyebrow}
            <span className="mx-2 text-cotton-3">/</span>
            {event.hostNames}
            {date && (
              <>
                <span className="mx-2 text-cotton-3">/</span>
                {date}
              </>
            )}
          </p>

          <p
            className="u-rise mt-9 font-body text-lg text-ash sm:text-xl"
            style={{ animationDelay: "0.25s" }}
          >
            Welcome,
          </p>

          {guest.honorific && (
            <p
              className="u-rise mt-2 font-display text-xl text-gold italic sm:text-2xl"
              style={{ animationDelay: "0.3s" }}
            >
              {guest.honorific}
            </p>
          )}

          <h1
            className="u-rise mt-1 font-display font-black text-coffee"
            style={{
              animationDelay: "0.35s",
              fontSize: "clamp(2.75rem, 11.5vw, 4.5rem)",
              lineHeight: "0.94",
              letterSpacing: "-0.035em",
            }}
          >
            {guest.name}
          </h1>

          {photo && (
            <figure className="u-rise mt-10" style={{ animationDelay: "0.5s" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt={`${guest.name} with ${event.hostNames}`}
                className="w-full object-cover"
                style={{ aspectRatio: "4 / 3", boxShadow: "0 2px 0 var(--color-cotton-3)" }}
              />
            </figure>
          )}

          {message && (
            <>
              <div className="tibeb-rule u-rise mt-10" style={{ animationDelay: "0.55s" }} aria-hidden="true" />
              <blockquote
                className="u-rise mt-8"
                style={{ animationDelay: "0.6s" }}
              >
                <p
                  className="font-display text-coffee italic"
                  style={{
                    fontSize: "clamp(1.25rem, 4.4vw, 1.6rem)",
                    lineHeight: "1.5",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {message}
                </p>
                <footer className="mt-6 font-mono text-[0.7rem] tracking-[0.2em] text-ash uppercase">
                  — {event.hostNames}
                </footer>
              </blockquote>
            </>
          )}

          {video && (
            <div className="u-rise mt-10" style={{ animationDelay: "0.7s" }}>
              {video.type === "embed" ? (
                <iframe
                  src={video.src}
                  title={`A message for ${guest.name}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full border-0 bg-ink-2"
                  style={{ aspectRatio: "16 / 9" }}
                />
              ) : (
                <video
                  src={video.src}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full bg-ink-2"
                  style={{ aspectRatio: "16 / 9" }}
                />
              )}
              <p className="mt-3 font-mono text-[0.65rem] tracking-[0.2em] text-ash uppercase">
                A message for you
              </p>
            </div>
          )}

          {(seating || event.venue) && (
            <>
              <div className="tibeb-rule mt-10" aria-hidden="true" />
              <dl className="mt-7 flex flex-wrap gap-x-12 gap-y-5">
                {seating && (
                  <div>
                    <dt className="font-mono text-[0.65rem] tracking-[0.2em] text-ash uppercase">
                      Your seat
                    </dt>
                    <dd className="mt-1.5 font-display text-2xl font-semibold text-coffee">
                      {seating}
                    </dd>
                  </div>
                )}
                {event.venue && (
                  <div>
                    <dt className="font-mono text-[0.65rem] tracking-[0.2em] text-ash uppercase">
                      Venue
                    </dt>
                    <dd className="mt-1.5 font-display text-2xl font-semibold text-coffee">
                      {event.venue}
                    </dd>
                  </div>
                )}
              </dl>
            </>
          )}
        </div>

        <div className="tibeb h-4" aria-hidden="true" />
      </div>

      <p className="mx-auto mt-7 max-w-[38rem] text-center font-mono text-[0.6rem] tracking-[0.28em] text-ash/70 uppercase">
        Scan &amp; Smile
      </p>
    </main>
  );
}
