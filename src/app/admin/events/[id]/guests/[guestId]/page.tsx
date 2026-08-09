import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { guestUrl } from "@/lib/codes";
import { eventTheme, threadVars } from "@/lib/events";
import { clearGuestMedia, deleteGuest } from "../../../../actions";
import { CopyLink, GuestForm } from "../../../../forms";

export const dynamic = "force-dynamic";

export default async function GuestEditorPage({
  params,
}: {
  params: Promise<{ id: string; guestId: string }>;
}) {
  const { id, guestId } = await params;
  const guest = await db.guest.findUnique({
    where: { id: guestId },
    include: { event: true },
  });
  if (!guest || guest.eventId !== id) notFound();

  const url = guestUrl(guest.code);
  const kind = eventTheme(guest.event);

  return (
    <div className="space-y-12">
      <header>
        <Link
          href={`/admin/events/${id}`}
          className="font-mono text-[0.62rem] tracking-[0.16em] text-ash uppercase underline underline-offset-4 hover:text-coffee"
        >
          ← {guest.event.title}
        </Link>
        <div className="mt-5 flex items-stretch gap-5">
          <span
            style={threadVars(guest.event)}
            className="tibeb tibeb-v w-[6px] shrink-0"
            aria-hidden="true"
          />
          <div>
            <p className="font-mono text-[0.62rem] tracking-[0.18em] text-ash uppercase">
              {kind.eyebrow} · Code {guest.code}
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
              {guest.honorific ? `${guest.honorific} ` : ""}
              {guest.name}
            </h1>
          </div>
        </div>
      </header>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <section>
          <h2 className="font-display text-2xl font-bold tracking-tight">What this guest sees</h2>
          <div className="mt-6 max-w-[42rem]">
            <GuestForm
              guest={{
                id: guest.id,
                eventId: guest.eventId,
                name: guest.name,
                honorific: guest.honorific,
                tableName: guest.tableName,
                seat: guest.seat,
                message: guest.message,
                videoUrl: guest.videoUrl,
              }}
            />
          </div>

          {(guest.photoUrl || guest.videoUrl) && (
            <div className="mt-10 border-t border-cotton-3 pt-8">
              <h3 className="font-mono text-[0.62rem] tracking-[0.18em] text-ash uppercase">
                Attached media
              </h3>
              <div className="mt-4 flex flex-wrap gap-8">
                {guest.photoUrl && (
                  <figure className="w-48">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={guest.photoUrl}
                      alt=""
                      className="w-full border border-cotton-3 object-cover"
                      style={{ aspectRatio: "4 / 3" }}
                    />
                    <form action={clearGuestMedia} className="mt-2">
                      <input type="hidden" name="id" value={guest.id} />
                      <input type="hidden" name="eventId" value={guest.eventId} />
                      <input type="hidden" name="field" value="photo" />
                      <button className="font-mono text-[0.62rem] tracking-[0.16em] text-ash uppercase underline underline-offset-4 hover:text-[#8E1F2F]">
                        Remove photo
                      </button>
                    </form>
                  </figure>
                )}
                {guest.videoUrl && (
                  <figure className="w-64">
                    <p className="truncate border border-cotton-3 bg-white px-3 py-2 font-mono text-xs text-ash">
                      {guest.videoUrl}
                    </p>
                    <form action={clearGuestMedia} className="mt-2">
                      <input type="hidden" name="id" value={guest.id} />
                      <input type="hidden" name="eventId" value={guest.eventId} />
                      <input type="hidden" name="field" value="video" />
                      <button className="font-mono text-[0.62rem] tracking-[0.16em] text-ash uppercase underline underline-offset-4 hover:text-[#8E1F2F]">
                        Remove video
                      </button>
                    </form>
                  </figure>
                )}
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="border border-cotton-3 bg-white p-5">
            <h2 className="font-mono text-[0.62rem] tracking-[0.18em] text-ash uppercase">
              This guest&apos;s code
            </h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/qr/${guest.code}?size=600`}
              alt={`QR code for ${guest.name}`}
              className="mt-3 w-full"
              width={600}
              height={600}
            />
            <p className="mt-2 text-center font-mono text-lg tracking-[0.3em] text-coffee">
              {guest.code}
            </p>
            <div className="mt-4 space-y-2 font-mono text-[0.62rem] tracking-[0.16em] uppercase">
              <a
                href={`/api/qr/${guest.code}?format=svg&download=1`}
                className="block text-ash underline underline-offset-4 hover:text-coffee"
              >
                Download SVG (for print)
              </a>
              <a
                href={`/api/qr/${guest.code}?size=2400&download=1`}
                className="block text-ash underline underline-offset-4 hover:text-coffee"
              >
                Download PNG 2400px
              </a>
              <a
                href={`/g/${guest.code}`}
                target="_blank"
                rel="noreferrer"
                className="block text-ash underline underline-offset-4 hover:text-coffee"
              >
                Open guest page
              </a>
              <CopyLink url={url} />
            </div>
          </div>

          <div className="border border-cotton-3 p-5">
            <h2 className="font-mono text-[0.62rem] tracking-[0.18em] text-ash uppercase">Scans</h2>
            <p className="mt-2 font-display text-3xl font-semibold">{guest.scanCount}</p>
            <p className="mt-1 font-body text-sm text-ash">
              {guest.firstScannedAt
                ? `First scanned ${guest.firstScannedAt.toLocaleString("en-GB")}`
                : "Not scanned yet."}
            </p>
          </div>

          <form action={deleteGuest}>
            <input type="hidden" name="id" value={guest.id} />
            <input type="hidden" name="eventId" value={guest.eventId} />
            <button className="w-full border border-[#8E1F2F] px-5 py-2.5 font-mono text-[0.68rem] tracking-[0.16em] text-[#8E1F2F] uppercase hover:bg-[#8E1F2F] hover:text-cotton">
              Remove guest
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
