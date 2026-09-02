import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { guestUrl } from "@/lib/codes";
import { eventTheme, threadVars } from "@/lib/events";
import { formatEventDate } from "@/lib/media";
import { deleteEvent } from "../../actions";
import { AddGuestForm, BulkGuestForm, EventForm } from "../../forms";
import { GuestTable } from "./guest-table";
import { EventTabs } from "./event-tabs";

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

  const kind = eventTheme(event);
  const totalGuests = event.guests.length;
  const scanned = event.guests.filter((g) => g.scanCount > 0).length;
  const ready = event.guests.filter(
    (g) => (g.message ?? event.defaultMessage) && (g.photoUrl || g.videoUrl)
  ).length;

  const scannedPercent = totalGuests > 0 ? Math.round((scanned / totalGuests) * 100) : 0;
  const readyPercent = totalGuests > 0 ? Math.round((ready / totalGuests) * 100) : 0;

  // Calculate unique tables
  const tables = new Set(
    event.guests.map((g) => g.tableName?.trim()).filter(Boolean)
  );

  // Guests tab content
  const guestsContent = (
    <div className="space-y-10">
      <GuestTable
        eventId={event.id}
        guests={event.guests}
        defaultMessage={event.defaultMessage}
      />

      {/* Add guest forms */}
      <div className="border-t border-cotton-3 pt-8">
        <h3 className="font-display text-xl font-bold text-coffee">Add to guest list</h3>
        <p className="mt-1 font-body text-sm text-ash">
          Add an individual guest, or paste a batch from a spreadsheet.
        </p>

        <div className="mt-6 max-w-[42rem] space-y-6">
          <div className="rounded-xs border border-cotton-3 bg-white p-5 shadow-xs">
            <h4 className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-coffee mb-4">
              Add single guest
            </h4>
            <AddGuestForm eventId={event.id} />
          </div>

          <div className="rounded-xs border border-cotton-3 bg-white p-5 shadow-xs">
            <BulkGuestForm eventId={event.id} />
          </div>
        </div>
      </div>
    </div>
  );

  // Settings tab content
  const settingsContent = (
    <div className="space-y-10 max-w-[44rem]">
      <div className="rounded-xs border border-cotton-3 bg-white p-6 shadow-xs">
        <h3 className="font-display text-xl font-bold text-coffee">Event details &amp; fallbacks</h3>
        <p className="mt-1 font-body text-sm text-ash mb-6">
          These settings apply to all guest cards unless overridden individually.
        </p>

        <EventForm
          event={{
            id: event.id,
            title: event.title,
            kind: event.kind,
            hostNames: event.hostNames,
            eventDate: isoDate(event.eventDate),
            venue: event.venue,
            eyebrow: event.eyebrow,
            themeThreads: event.themeThreads,
            defaultMessage: event.defaultMessage,
          }}
        />
      </div>

      {event.coverImageUrl && (
        <div className="rounded-xs border border-cotton-3 bg-white p-6 shadow-xs">
          <h4 className="font-mono text-[0.62rem] tracking-[0.18em] text-ash uppercase">
            Active cover photo
          </h4>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.coverImageUrl}
            alt=""
            className="mt-3 max-w-[20rem] border border-cotton-3 object-cover rounded-xs"
          />
        </div>
      )}

      {/* Danger Zone */}
      <div className="rounded-xs border border-[#8E1F2F]/20 bg-[#8E1F2F]/5 p-6">
        <h4 className="font-mono text-[0.62rem] tracking-[0.18em] text-[#8E1F2F] uppercase font-semibold">
          Danger zone
        </h4>
        <h3 className="mt-1 font-display text-lg font-bold text-coffee">
          Delete {event.title}
        </h3>
        <p className="mt-2 font-body text-sm text-ash leading-relaxed">
          Deleting this event permanently removes its {totalGuests}{" "}
          {totalGuests === 1 ? "guest" : "guests"} and immediately retires every QR code.
          Physical cards already printed will stop working.
        </p>
        <form action={deleteEvent} className="mt-4">
          <input type="hidden" name="id" value={event.id} />
          <button className="rounded-xs border border-[#8E1F2F] bg-white px-4 py-2 font-mono text-[0.65rem] tracking-[0.16em] text-[#8E1F2F] uppercase font-semibold hover:bg-[#8E1F2F] hover:text-cotton transition-colors cursor-pointer">
            Delete this event
          </button>
        </form>
      </div>
    </div>
  );

  // Print tab content
  const printContent = (
    <div className="max-w-[42rem] space-y-6">
      <div className="rounded-xs border border-cotton-3 bg-white p-6 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-bold text-coffee">Print-ready table cards</h3>
            <p className="mt-1 font-body text-sm text-ash">
              Generate A4 sheets with 4 cards per page, complete with dashed scissor guides.
            </p>
          </div>
          <Link
            href={`/admin/events/${event.id}/cards`}
            className="inline-flex items-center gap-2 rounded-xs border border-coffee bg-coffee px-5 py-2.5 font-mono text-[0.68rem] tracking-[0.16em] text-cotton uppercase hover:bg-ink transition-colors font-semibold shrink-0"
          >
            <span>Open card sheets</span>
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>

        <div className="mt-6 border-t border-cotton-3 pt-5 space-y-3 font-body text-sm text-ash">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-coffee">Total cards:</span>
            <span>{totalGuests}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-coffee">Sheets needed:</span>
            <span>{Math.ceil(totalGuests / 4)} A4 pages</span>
          </div>
          <p className="pt-2 text-xs text-ash/80 leading-relaxed">
            Tip: For runs of 50+ cards, consider using a professional print shop in Addis Ababa.
            You can print at 100% scale on heavy cardstock (250–300gsm) for the best result.
          </p>
        </div>
      </div>

      <div className="rounded-xs border border-cotton-3 bg-cotton/60 p-4 font-body text-xs text-ash">
        Guest links resolve at <code className="font-mono text-coffee">{guestUrl("CODE")}</code>.
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Event Header */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 font-mono text-[0.62rem] tracking-[0.16em] text-ash uppercase underline underline-offset-4 hover:text-coffee transition-colors"
        >
          ← All events
        </Link>

        <div className="mt-4 flex items-stretch gap-4 sm:gap-5">
          <span
            style={threadVars(event)}
            className="tibeb tibeb-v w-2 shrink-0 rounded-xs"
            aria-hidden="true"
          />
          <div>
            <p className="font-mono text-[0.62rem] tracking-[0.18em] text-ash uppercase">
              {kind.label}
              {event.eventDate && ` · ${formatEventDate(event.eventDate)}`}
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-coffee">
              {event.title}
            </h1>
            <p className="mt-1 font-body text-ash text-sm">
              {event.hostNames}
              {event.venue && ` · ${event.venue}`}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Card 1: Guests & Tables */}
        <div className="rounded-xs border border-cotton-3 bg-white p-5 shadow-xs">
          <p className="font-mono text-[0.62rem] font-semibold tracking-[0.18em] text-ash uppercase">
            Total guests
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-coffee">{totalGuests}</p>
          <p className="mt-1 font-mono text-[0.65rem] text-ash tracking-wider">
            {tables.size} {tables.size === 1 ? "table" : "tables"} seated
          </p>
        </div>

        {/* Card 2: Personalization Progress */}
        <div className="rounded-xs border border-cotton-3 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[0.62rem] font-semibold tracking-[0.18em] text-ash uppercase">
              Personalized
            </p>
            <span className="font-mono text-[0.65rem] font-bold text-[#1E5A46]">
              {readyPercent}%
            </span>
          </div>
          <p className="mt-2 font-display text-3xl font-bold text-coffee">
            {ready} <span className="font-body text-base font-normal text-ash">of {totalGuests}</span>
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-cotton-3 overflow-hidden">
            <div
              className="h-full bg-[#1E5A46] rounded-full transition-all duration-500"
              style={{ width: `${readyPercent}%` }}
            />
          </div>
        </div>

        {/* Card 3: Live Scans / Attendance */}
        <div className="rounded-xs border border-cotton-3 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[0.62rem] font-semibold tracking-[0.18em] text-ash uppercase">
              Scanned on table
            </p>
            <span className="font-mono text-[0.65rem] font-bold text-gold">
              {scannedPercent}%
            </span>
          </div>
          <p className="mt-2 font-display text-3xl font-bold text-coffee">
            {scanned} <span className="font-body text-base font-normal text-ash">of {totalGuests}</span>
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-cotton-3 overflow-hidden">
            <div
              className="h-full bg-gold rounded-full transition-all duration-500"
              style={{ width: `${scannedPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <EventTabs
        guestCount={totalGuests}
        guestsContent={guestsContent}
        settingsContent={settingsContent}
        printContent={printContent}
      />
    </div>
  );
}
