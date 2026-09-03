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
 *
 * VIP guests (those with a personal message or personal photo) get a subtly
 * different card: a midnight-indigo background and a brighter gold, so the
 * host can tell them apart in a stack before handing them out.
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

/**
 * A guest with their own message or photo is treated as VIP. The distinction
 * is purely visual on the card and at print time — there is no separate tier
 * field in the database.
 */
function isVip(guest: { message: string | null; photoUrl: string | null }): boolean {
  return Boolean(guest.message || guest.photoUrl);
}

type SearchParams = Promise<{ table?: string; filter?: string }>;

export default async function CardsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { table: tableFilter, filter: tierFilter } = await searchParams;

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

  // --- Filtering ---
  const allTables = Array.from(
    new Set(event.guests.map((g) => g.tableName?.trim()).filter(Boolean))
  ) as string[];

  let filteredGuests = event.guests;
  if (tableFilter && tableFilter !== "all") {
    filteredGuests = filteredGuests.filter((g) => g.tableName?.trim() === tableFilter);
  }
  if (tierFilter === "vip") {
    filteredGuests = filteredGuests.filter(isVip);
  } else if (tierFilter === "standard") {
    filteredGuests = filteredGuests.filter((g) => !isVip(g));
  }

  // --- Card generation ---
  const cards = filteredGuests.map((guest) => {
    const vip = isVip(guest);
    return {
      id: guest.id,
      name: guest.name,
      code: guest.code,
      tableName: guest.tableName,
      isVip: vip,
      svg: buildCard({
        name: guest.name,
        url: `${origin}/g/${guest.code}`,
        width: CARD.width,
        height: CARD.height,
        bleed: 0,
        fonts: { script: SCRIPT_FAMILY },
        // VIP cards get a midnight-indigo ground and a brighter, warmer gold
        // so they read as premium beside a standard card in the same stack.
        ...(vip
          ? {
              background: "#080612",
              gold: "#E0C55C",
              dearLabel: "✦ Dear",
            }
          : {}),
      }).svg,
    };
  });

  // Group by table for display. Cards without a table name go last under "—".
  const grouped: Array<{ table: string | null; cards: typeof cards }> = [];
  const seen = new Map<string | null, typeof cards>();
  for (const card of cards) {
    const key = card.tableName?.trim() || null;
    if (!seen.has(key)) {
      seen.set(key, []);
      grouped.push({ table: key, cards: seen.get(key)! });
    }
    seen.get(key)!.push(card);
  }

  // Flatten the grouped list into sheets of PER_SHEET, preserving table order.
  const flatCards = grouped.flatMap((g) => g.cards);
  const sheets = Array.from({ length: Math.ceil(flatCards.length / PER_SHEET) }, (_, index) =>
    flatCards.slice(index * PER_SHEET, index * PER_SHEET + PER_SHEET)
  );

  const vipCount = cards.filter((c) => c.isVip).length;
  const standardCount = cards.length - vipCount;

  const buildHref = (params: Record<string, string>) => {
    const merged = {
      ...(tableFilter ? { table: tableFilter } : {}),
      ...(tierFilter ? { filter: tierFilter } : {}),
      ...params,
    };
    const qs = new URLSearchParams(merged).toString();
    return `/admin/events/${id}/cards${qs ? `?${qs}` : ""}`;
  };

  const activeTab = (active: boolean) =>
    active
      ? "border-coffee bg-coffee text-cotton font-semibold"
      : "border-cotton-3 bg-white text-ash hover:border-coffee hover:text-coffee";

  return (
    <>
      <style>{FONT_FACE}</style>

      <div className="no-print mb-10 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-baseline justify-between gap-4">
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
              {sheets.length} {sheets.length === 1 ? "sheet" : "sheets"}, four to an A4 page.
              Print at 100% scale — resizing the page shrinks the codes and phones start missing
              them. Cut on the dashed lines, then round the arch if standing in bases.
            </p>
            {vipCount > 0 && (
              <p className="mt-2 font-body text-sm text-ash">
                <span className="inline-block rounded-xs bg-[#080612] px-2 py-0.5 font-mono text-[0.6rem] tracking-wider text-[#E0C55C] uppercase mr-2">
                  ✦ VIP
                </span>
                {vipCount} {vipCount === 1 ? "card has" : "cards have"} a midnight-indigo
                background and brighter gold — easy to tell from standard cards in a stack.
              </p>
            )}
          </div>
          <PrintButton />
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-6 border-t border-cotton-3 pt-5">
          {/* Tier filter */}
          <div className="space-y-1.5">
            <p className="font-mono text-[0.58rem] tracking-[0.2em] text-ash uppercase">Tier</p>
            <div className="flex gap-1.5 font-mono text-[0.62rem] tracking-wider uppercase">
              <Link
                href={buildHref({ filter: "" })}
                className={`rounded-xs border px-2.5 py-1.5 transition-colors ${activeTab(!tierFilter || tierFilter === "")}`}
              >
                All ({event.guests.length})
              </Link>
              <Link
                href={buildHref({ filter: "vip" })}
                className={`rounded-xs border px-2.5 py-1.5 transition-colors ${activeTab(tierFilter === "vip")}`}
              >
                ✦ VIP ({event.guests.filter(isVip).length})
              </Link>
              <Link
                href={buildHref({ filter: "standard" })}
                className={`rounded-xs border px-2.5 py-1.5 transition-colors ${activeTab(tierFilter === "standard")}`}
              >
                Standard ({event.guests.filter((g) => !isVip(g)).length})
              </Link>
            </div>
          </div>

          {/* Table filter */}
          {allTables.length > 0 && (
            <div className="space-y-1.5">
              <p className="font-mono text-[0.58rem] tracking-[0.2em] text-ash uppercase">Table</p>
              <div className="flex flex-wrap gap-1.5 font-mono text-[0.62rem] tracking-wider uppercase">
                <Link
                  href={buildHref({ table: "all" })}
                  className={`rounded-xs border px-2.5 py-1.5 transition-colors ${activeTab(!tableFilter || tableFilter === "all")}`}
                >
                  All tables
                </Link>
                {allTables.map((t) => (
                  <Link
                    key={t}
                    href={buildHref({ table: t })}
                    className={`rounded-xs border px-2.5 py-1.5 transition-colors ${activeTab(tableFilter === t)}`}
                  >
                    {t}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary row */}
        <div className="flex flex-wrap items-center gap-6 border border-cotton-3 bg-white px-5 py-3 font-mono text-[0.65rem] tracking-wider text-ash">
          <span>
            <span className="font-semibold text-coffee">{cards.length}</span>{" "}
            {cards.length === 1 ? "card" : "cards"} selected
          </span>
          <span>
            <span className="font-semibold text-coffee">{sheets.length}</span> A4{" "}
            {sheets.length === 1 ? "sheet" : "sheets"}
          </span>
          {vipCount > 0 && (
            <span className="text-[#E0C55C]">
              <span className="font-semibold">{vipCount}</span> VIP
            </span>
          )}
          {standardCount > 0 && (
            <span>
              <span className="font-semibold text-coffee">{standardCount}</span> standard
            </span>
          )}
        </div>
      </div>

      {cards.length === 0 ? (
        <p className="no-print border border-dashed border-cotton-3 px-6 py-10 text-center font-body text-ash">
          {event.guests.length === 0
            ? "Add guests first — each one gets a card here."
            : "No cards match the current filter."}
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
                    {card.isVip && (
                      <span className="ml-1.5 text-[#E0C55C]">✦</span>
                    )}
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
