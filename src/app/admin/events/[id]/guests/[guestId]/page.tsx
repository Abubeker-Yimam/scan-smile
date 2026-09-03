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
              {/* WhatsApp share — opens WA with a pre-filled message so the
                  host can forward it to the guest without typing the link. */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Hello ${guest.honorific ? `${guest.honorific} ` : ""}${guest.name},\n\nHere is your personal card — scan or tap the link to open it:\n${url}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-ash underline underline-offset-4 hover:text-[#25D366] transition-colors"
              >
                <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span>Share via WhatsApp</span>
              </a>
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
