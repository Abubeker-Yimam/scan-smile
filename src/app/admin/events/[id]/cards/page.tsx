import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { eventTheme, threadVars } from "@/lib/events";
import { formatEventDate } from "@/lib/media";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

/**
 * The sheet that goes to the printer: four table cards per A4 page, each one
 * cut on the dashed line and stood up next to a place setting.
 */
export default async function CardsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await db.event.findUnique({
    where: { id },
    include: { guests: { orderBy: [{ tableName: "asc" }, { name: "asc" }] } },
  });
  if (!event) notFound();

  const kind = eventTheme(event);
  const date = formatEventDate(event.eventDate);

  return (
    <div style={threadVars(event)}>
      <div className="no-print mb-10 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <Link
            href={`/admin/events/${id}`}
            className="font-mono text-[0.62rem] tracking-[0.16em] text-ash uppercase underline underline-offset-4 hover:text-coffee"
          >
            ← {event.title}
          </Link>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">Table cards</h1>
          <p className="mt-2 max-w-[38rem] font-body text-ash">
            {event.guests.length} {event.guests.length === 1 ? "card" : "cards"}, four to an A4
            sheet. Print at 100% scale — resizing the page shrinks the codes and phones start
            missing them. Cut on the dashed lines.
          </p>
        </div>
        <PrintButton />
      </div>

      {event.guests.length === 0 ? (
        <p className="no-print border border-dashed border-cotton-3 px-6 py-10 text-center font-body text-ash">
          Add guests first — each one gets a card here.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-0">
          {event.guests.map((guest) => (
            <article
              key={guest.id}
              className="print-card flex border border-dashed border-cotton-3 bg-white"
              style={{ height: "125mm" }}
            >
              <span className="tibeb tibeb-v w-[7mm] shrink-0" aria-hidden="true" />
              <div className="flex flex-1 flex-col justify-between px-[8mm] py-[9mm] text-center">
                <div>
                  <p className="font-mono text-[7pt] tracking-[0.2em] text-ash uppercase">
                    {kind.eyebrow}
                    {date && ` · ${date}`}
                  </p>
                  {guest.honorific && (
                    <p className="mt-[6mm] font-display text-[11pt] text-ash italic">
                      {guest.honorific}
                    </p>
                  )}
                  <h2
                    className="mt-[1mm] font-display font-bold text-coffee"
                    style={{ fontSize: "20pt", lineHeight: "1.05", letterSpacing: "-0.02em" }}
                  >
                    {guest.name}
                  </h2>
                  {guest.tableName && (
                    <p className="mt-[4mm] font-mono text-[8pt] tracking-[0.18em] text-ash uppercase">
                      {guest.tableName}
                      {guest.seat && ` · ${guest.seat}`}
                    </p>
                  )}
                </div>

                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/qr/${guest.code}?size=1200`}
                    alt=""
                    className="mx-auto block"
                    style={{ width: "34mm", height: "34mm" }}
                  />
                  <p className="mt-[2mm] font-mono text-[9pt] tracking-[0.28em] text-coffee">
                    {guest.code}
                  </p>
                </div>

                <p className="font-body text-[8pt] leading-snug text-ash">
                  Scan for a message from {event.hostNames}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
