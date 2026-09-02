import Link from "next/link";
import { db } from "@/lib/db";
import { kindConfig, threadVars } from "@/lib/events";
import { formatEventDate } from "@/lib/media";
import { EventForm } from "./forms";

export const dynamic = "force-dynamic";

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ inquiryId?: string }>;
}) {
  const { inquiryId } = await searchParams;

  const events = await db.event.findMany({
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { guests: true } },
      guests: { select: { scanCount: true } },
    },
  });

  const waiting = await db.inquiry.count({ where: { handled: false } });

  // If redirected from an inquiry, pre-fill the booking form
  let prefillEvent = undefined;
  if (inquiryId) {
    const inquiry = await db.inquiry.findUnique({ where: { id: inquiryId } });
    if (inquiry) {
      prefillEvent = {
        title: `${inquiry.name} — ${kindConfig(inquiry.kind).label}`,
        kind: inquiry.kind,
        hostNames: inquiry.name,
        eventDate: inquiry.eventDate ? inquiry.eventDate.toISOString().slice(0, 10) : undefined,
      };
    }
  }

  return (
    <div className="space-y-12">
      {/* Inbox alert banner */}
      {waiting > 0 && (
        <Link
          href="/admin/inbox"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xs border border-coffee/20 bg-white p-4 shadow-xs transition-colors hover:bg-cotton-2"
        >
          <span className="tibeb h-2 w-10 shrink-0" aria-hidden="true" />
          <span className="font-body text-sm font-medium text-coffee">
            {waiting === 1 ? "One customer inquiry is" : `${waiting} customer inquiries are`}{" "}
            waiting for an answer.
          </span>
          <span className="ml-auto font-mono text-[0.62rem] tracking-[0.16em] text-gold uppercase underline underline-offset-4 font-semibold">
            Open inbox →
          </span>
        </Link>
      )}

      {/* Events section */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-coffee">Events</h1>
            <p className="mt-1 font-body text-sm text-ash">
              {events.length} {events.length === 1 ? "event" : "events"} managed on this dashboard.
            </p>
          </div>
          <a
            href="#book-event"
            className="inline-flex items-center gap-2 rounded-xs border border-coffee bg-coffee px-4 py-2 font-mono text-[0.65rem] tracking-[0.16em] text-cotton uppercase hover:bg-ink transition-colors font-semibold"
          >
            <span>+ Book new event</span>
          </a>
        </div>

        {events.length === 0 ? (
          <div className="mt-6 rounded-xs border border-dashed border-cotton-3 bg-white/60 px-6 py-12 text-center font-body text-ash">
            <p>No events created yet.</p>
            <p className="mt-1 text-sm text-ash/80">
              Create your first celebration below, then add your guests.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {events.map((event) => {
              const scanned = event.guests.filter((g) => g.scanCount > 0).length;
              const total = event._count.guests;
              const scannedPercent = total > 0 ? Math.round((scanned / total) * 100) : 0;
              const date = formatEventDate(event.eventDate);
              const kind = kindConfig(event.kind);

              return (
                <div
                  key={event.id}
                  className="group relative flex flex-col justify-between rounded-xs border border-cotton-3 bg-white p-5 shadow-xs transition-all hover:border-gold hover:shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <span
                      style={threadVars(event)}
                      className="tibeb tibeb-v w-2 shrink-0 self-stretch rounded-xs"
                      aria-hidden="true"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[0.62rem] tracking-wider uppercase text-ash">
                        <span className="font-semibold text-coffee">
                          {event.eyebrow?.trim() || kind.label}
                        </span>
                        {date && <span>· {date}</span>}
                        {event.venue && <span>· {event.venue}</span>}
                      </div>

                      <Link
                        href={`/admin/events/${event.id}`}
                        className="mt-1 block font-display text-2xl font-bold tracking-tight text-coffee group-hover:text-ink group-hover:underline"
                      >
                        {event.title}
                      </Link>

                      <p className="mt-1 font-body text-sm text-ash">
                        Hosted by <span className="font-medium text-coffee">{event.hostNames}</span>
                      </p>
                    </div>

                    {/* Quick guest & scan summary */}
                    <div className="hidden sm:block text-right shrink-0">
                      <p className="font-mono text-xs font-semibold text-coffee">
                        {total} {total === 1 ? "guest" : "guests"}
                      </p>
                      <p className="font-mono text-[0.68rem] text-ash tracking-wider">
                        {scanned} scanned ({scannedPercent}%)
                      </p>
                      <div className="mt-2 h-1.5 w-28 rounded-full bg-cotton-3 overflow-hidden ml-auto">
                        <div
                          className="h-full bg-gold rounded-full"
                          style={{ width: `${scannedPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card actions footer */}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-cotton-3/60 pt-4 font-mono text-[0.62rem] tracking-wider uppercase">
                    <div className="sm:hidden font-mono text-xs text-ash">
                      {total} guests · {scanned} scanned ({scannedPercent}%)
                    </div>

                    <div className="flex items-center gap-4 ml-auto">
                      <Link
                        href={`/admin/events/${event.id}/cards`}
                        className="text-ash hover:text-coffee underline underline-offset-4"
                      >
                        Print cards
                      </Link>
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="rounded-xs border border-cotton-3 px-3 py-1 text-coffee hover:border-coffee font-semibold"
                      >
                        Manage event →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Book new event section */}
      <section id="book-event" className="border-t border-cotton-3 pt-10">
        <div className="max-w-[42rem]">
          <h2 className="font-display text-2xl font-bold tracking-tight text-coffee">
            {prefillEvent ? "Create event from inquiry" : "Book a new event"}
          </h2>
          <p className="mt-1 font-body text-sm text-ash mb-6">
            Set the occasion, hosts, date, and venue. Guests can be added immediately after.
          </p>

          <div className="rounded-xs border border-cotton-3 bg-white p-6 shadow-xs">
            <EventForm event={prefillEvent} />
          </div>
        </div>
      </section>
    </div>
  );
}
