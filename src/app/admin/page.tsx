import Link from "next/link";
import { db } from "@/lib/db";
import { kindConfig, threadVars } from "@/lib/events";
import { formatEventDate } from "@/lib/media";
import { EventForm } from "./forms";
import { signOut } from "./login/actions";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const events = await db.event.findMany({
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { guests: true } },
      guests: { select: { scanCount: true } },
    },
  });

  // Someone who wrote from the contact page is waiting on a person, not on the
  // app. Surfacing the count on the first screen after signing in is the whole
  // difference between an inbox and a table nobody opens.
  const waiting = await db.inquiry.count({ where: { handled: false } });

  return (
    <div className="space-y-14">
      {waiting > 0 && (
        <Link
          href="/admin/inbox"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 border border-coffee/25 bg-white px-5 py-4 transition-colors hover:bg-cotton-2"
        >
          <span className="tibeb h-2 w-10 shrink-0" aria-hidden="true" />
          <span className="font-body">
            {waiting === 1 ? "One message is" : `${waiting} messages are`} waiting for an answer.
          </span>
          <span className="ml-auto font-mono text-[0.62rem] tracking-[0.16em] text-ash uppercase underline underline-offset-4">
            Open the inbox
          </span>
        </Link>
      )}

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="font-display text-3xl font-bold tracking-tight">Events</h1>
          <form action={signOut}>
            <button className="font-mono text-[0.62rem] tracking-[0.16em] text-ash uppercase underline underline-offset-4 hover:text-coffee">
              Sign out
            </button>
          </form>
        </div>

        {events.length === 0 ? (
          <p className="mt-6 border border-dashed border-cotton-3 px-6 py-10 text-center font-body text-ash">
            No events yet. Create one below, then add the guest list.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-cotton-3 border-y border-cotton-3">
            {events.map((event) => {
              const scanned = event.guests.filter((g) => g.scanCount > 0).length;
              const date = formatEventDate(event.eventDate);
              return (
                <li key={event.id}>
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="group flex items-stretch gap-5 py-5 transition-colors hover:bg-cotton-2"
                  >
                    <span
                      style={threadVars(event)}
                      className="tibeb tibeb-v w-[6px] shrink-0"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-[0.62rem] tracking-[0.18em] text-ash uppercase">
                        {event.eyebrow?.trim() || kindConfig(event.kind).label}
                        {date && ` · ${date}`}
                      </span>
                      <span className="mt-1 block truncate font-display text-xl font-semibold group-hover:underline">
                        {event.title}
                      </span>
                      <span className="mt-0.5 block font-body text-sm text-ash">
                        {event.hostNames}
                        {event.venue && ` · ${event.venue}`}
                      </span>
                    </span>
                    <span className="shrink-0 self-center pr-2 text-right font-mono text-[0.7rem] text-ash">
                      <span className="block text-coffee">{event._count.guests} guests</span>
                      <span className="block">{scanned} scanned</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold tracking-tight">Book a new event</h2>
        <p className="mt-2 font-body text-ash">
          Set the occasion and the hosts. Guests come next.
        </p>
        <div className="mt-6 max-w-[42rem]">
          <EventForm />
        </div>
      </section>
    </div>
  );
}
