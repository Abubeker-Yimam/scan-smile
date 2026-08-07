import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { guestUrl } from "@/lib/codes";
import { kindConfig, threadVars } from "@/lib/events";
import { formatEventDate } from "@/lib/media";
import { deleteEvent } from "../../actions";
import { AddGuestForm, BulkGuestForm, EventForm } from "../../forms";

export const dynamic = "force-dynamic";

function isoDate(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await db.event.findUnique({
    where: { id },
    include: { guests: { orderBy: [{ tableName: "asc" }, { name: "asc" }] } },
  });
  if (!event) notFound();

  const kind = kindConfig(event.kind);
  const scanned = event.guests.filter((g) => g.scanCount > 0).length;
  const ready = event.guests.filter(
    (g) => (g.message ?? event.defaultMessage) && (g.photoUrl || g.videoUrl)
  ).length;

  return (
    <div className="space-y-14">
      <header>
        <Link
          href="/admin"
          className="font-mono text-[0.62rem] tracking-[0.16em] text-ash uppercase underline underline-offset-4 hover:text-coffee"
        >
          ← All events
        </Link>

        <div className="mt-5 flex items-stretch gap-5">
          <span
            style={threadVars(event.kind)}
            className="tibeb tibeb-v w-[6px] shrink-0"
            aria-hidden="true"
          />
          <div>
            <p className="font-mono text-[0.62rem] tracking-[0.18em] text-ash uppercase">
              {kind.label}
              {event.eventDate && ` · ${formatEventDate(event.eventDate)}`}
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{event.title}</h1>
            <p className="mt-1 font-body text-ash">
              {event.hostNames}
              {event.venue && ` · ${event.venue}`}
            </p>
          </div>
        </div>

        <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-4 border-y border-cotton-3 py-5">
          {[
            ["Guests", String(event.guests.length)],
            ["Cards personalised", `${ready} of ${event.guests.length}`],
            ["Guests who scanned", `${scanned} of ${event.guests.length}`],
          ].map(([term, value]) => (
            <div key={term}>
              <dt className="font-mono text-[0.62rem] tracking-[0.18em] text-ash uppercase">
                {term}
              </dt>
              <dd className="mt-1 font-display text-2xl font-semibold">{value}</dd>
            </div>
          ))}
          <div className="ml-auto self-center">
            <Link
              href={`/admin/events/${event.id}/cards`}
              className="inline-flex border border-coffee px-5 py-2.5 font-mono text-[0.68rem] tracking-[0.16em] uppercase hover:bg-coffee hover:text-cotton"
            >
              Print table cards
            </Link>
          </div>
        </dl>
      </header>

      <section>
        <h2 className="font-display text-2xl font-bold tracking-tight">Guest list</h2>
        <p className="mt-2 font-body text-ash">
          Every guest has one code and one page. Open a guest to write their message and add media.
        </p>

        {event.guests.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[42rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-cotton-3">
                  {["Code", "Guest", "Table", "Ready", "Scans"].map((heading) => (
                    <th
                      key={heading}
                      className="py-2.5 pr-4 font-mono text-[0.6rem] font-medium tracking-[0.18em] text-ash uppercase"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {event.guests.map((guest) => {
                  const hasMedia = Boolean(guest.photoUrl || guest.videoUrl);
                  const hasMessage = Boolean(guest.message ?? event.defaultMessage);
                  return (
                    <tr key={guest.id} className="border-b border-cotton-3 hover:bg-cotton-2">
                      <td className="py-3 pr-4 font-mono text-sm text-ash">{guest.code}</td>
                      <td className="py-3 pr-4">
                        <Link
                          href={`/admin/events/${event.id}/guests/${guest.id}`}
                          className="font-body font-semibold underline-offset-4 hover:underline"
                        >
                          {guest.honorific ? `${guest.honorific} ` : ""}
                          {guest.name}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 font-body text-sm text-ash">
                        {guest.tableName ?? "—"}
                      </td>
                      <td className="py-3 pr-4 font-mono text-[0.68rem] tracking-wider">
                        <span className={hasMessage ? "text-[#1E5A46]" : "text-ash/60"}>note</span>
                        <span className="mx-1.5 text-cotton-3">·</span>
                        <span className={hasMedia ? "text-[#1E5A46]" : "text-ash/60"}>media</span>
                      </td>
                      <td className="py-3 pr-4 font-mono text-sm text-ash">{guest.scanCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8 max-w-[42rem] space-y-6 border-t border-cotton-3 pt-8">
          <AddGuestForm eventId={event.id} />
          <BulkGuestForm eventId={event.id} />
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold tracking-tight">Event settings</h2>
        <p className="mt-2 font-body text-ash">
          These are the fallbacks. Anything you set on a guest wins over what&apos;s here.
        </p>
        <div className="mt-6 max-w-[42rem]">
          <EventForm
            event={{
              id: event.id,
              title: event.title,
              kind: event.kind,
              hostNames: event.hostNames,
              eventDate: isoDate(event.eventDate),
              venue: event.venue,
              defaultMessage: event.defaultMessage,
              defaultVideoUrl: event.defaultVideoUrl,
            }}
          />
        </div>

        {event.coverImageUrl && (
          <figure className="mt-6 max-w-[20rem]">
            <figcaption className="font-mono text-[0.62rem] tracking-[0.18em] text-ash uppercase">
              Cover photo
            </figcaption>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.coverImageUrl}
              alt=""
              className="mt-2 w-full border border-cotton-3 object-cover"
            />
          </figure>
        )}
      </section>

      <section className="border-t border-cotton-3 pt-8">
        <h2 className="font-mono text-[0.62rem] tracking-[0.18em] text-ash uppercase">
          Delete event
        </h2>
        <p className="mt-2 max-w-[42rem] font-body text-sm text-ash">
          Deleting {event.title} removes its {event.guests.length}{" "}
          {event.guests.length === 1 ? "guest" : "guests"} and retires every code. Printed cards stop
          working immediately.
        </p>
        <form action={deleteEvent} className="mt-4">
          <input type="hidden" name="id" value={event.id} />
          <button className="border border-[#8E1F2F] px-5 py-2.5 font-mono text-[0.68rem] tracking-[0.16em] text-[#8E1F2F] uppercase hover:bg-[#8E1F2F] hover:text-cotton">
            Delete this event
          </button>
        </form>
      </section>

      <p className="font-body text-sm text-ash">
        Guest pages live at{" "}
        <code className="font-mono text-coffee">{guestUrl("CODE")}</code>. Set{" "}
        <code className="font-mono text-coffee">NEXT_PUBLIC_BASE_URL</code> before printing so the
        codes point somewhere a phone can reach.
      </p>
    </div>
  );
}
