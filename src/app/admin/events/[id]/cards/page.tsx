import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { buildCard } from "@/lib/insert-card/artwork.mjs";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

/**
 * The sheet that goes to the printer: four arch inserts per A4 page, cut apart
 * and stood in their bases.
 *
 * The artwork comes from the same buildCard() the print-shop script uses, so a
 * host printing at home and a shop printing a run of two hundred are working
 * from one drawing. What differs is only what surrounds it — no bleed here,
 * because scissors follow a line rather than a guillotine, and four to a page
 * because that is what an office printer is for.
 */

/** Two across A4's printable width, at the reference 1:1.4 arch. */
const CARD = { width: 95, height: 133 };
const PER_SHEET = 4;

/** The face the names are set in, served to the browser rather than embedded. */
const SCRIPT_FAMILY = "'Insert Script', 'Great Vibes', cursive";
const FONT_FACE = `
@font-face {
  font-family: 'Insert Script';
  src: url('/fonts/GreatVibes-Regular.ttf') format('truetype');
  font-display: block;
}`;

export default async function CardsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await db.event.findUnique({
    where: { id },
    include: { guests: { orderBy: [{ tableName: "asc" }, { name: "asc" }] } },
  });
  if (!event) notFound();

  // The origin this page was reached on, rather than a configured one. A host
  // printing from the live admin gets live codes; nobody can print two hundred
  // cards pointing at somebody's localhost.
  const head = await headers();
  const origin = `${head.get("x-forwarded-proto") ?? "https"}://${head.get("host")}`;

  const cards = event.guests.map((guest) => ({
    id: guest.id,
    name: guest.name,
    code: guest.code,
    svg: buildCard({
      name: guest.name,
      url: `${origin}/g/${guest.code}`,
      width: CARD.width,
      height: CARD.height,
      bleed: 0,
      fonts: { script: SCRIPT_FAMILY },
    }).svg,
  }));

  const sheets = Array.from({ length: Math.ceil(cards.length / PER_SHEET) }, (_, index) =>
    cards.slice(index * PER_SHEET, index * PER_SHEET + PER_SHEET)
  );

  return (
    <>
      <style>{FONT_FACE}</style>

      <div className="no-print mb-10 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <Link
            href={`/admin/events/${id}`}
            className="font-mono text-[0.62rem] tracking-[0.16em] text-ash uppercase underline underline-offset-4 hover:text-coffee"
          >
            ← {event.title}
          </Link>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">Guest cards</h1>
          <p className="mt-2 max-w-[38rem] font-body text-ash">
            {cards.length} {cards.length === 1 ? "card" : "cards"} on{" "}
            {sheets.length} {sheets.length === 1 ? "sheet" : "sheets"}, four to an A4 page. Print at
            100% scale — resizing the page shrinks the codes and phones start missing them. Cut on
            the dashed lines, then round the arch if you are standing them in bases.
          </p>
          <p className="mt-2 max-w-[38rem] font-body text-sm text-ash">
            Each card lays down a solid black arch. On an inkjet that is a lot of ink — for anything
            past a sheet or two, a print shop is cheaper and flatter.
          </p>
        </div>
        <PrintButton />
      </div>

      {cards.length === 0 ? (
        <p className="no-print border border-dashed border-cotton-3 px-6 py-10 text-center font-body text-ash">
          Add guests first — each one gets a card here.
        </p>
      ) : (
        sheets.map((sheet, index) => (
          <section key={index} className="print-sheet">
            <div className="grid grid-cols-2 justify-items-center gap-[2mm]">
              {sheet.map((card) => (
                <article
                  key={card.id}
                  className="print-card border border-dashed border-cotton-3 p-[1mm]"
                >
                  {/* Built by buildCard() from this guest's own row; every value
                      it interpolates is XML-escaped on the way in. */}
                  <div
                    style={{ width: `${CARD.width}mm`, height: `${CARD.height}mm` }}
                    dangerouslySetInnerHTML={{ __html: card.svg }}
                  />
                  <p className="no-print mt-[1mm] text-center font-mono text-[8pt] tracking-[0.2em] text-ash">
                    {card.code}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}
