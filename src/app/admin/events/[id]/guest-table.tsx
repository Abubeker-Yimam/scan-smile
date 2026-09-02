"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

export type GuestItem = {
  id: string;
  code: string;
  name: string;
  honorific: string | null;
  tableName: string | null;
  message: string | null;
  photoUrl: string | null;
  videoUrl: string | null;
  scanCount: number;
};

export function GuestTable({
  eventId,
  guests,
  defaultMessage,
}: {
  eventId: string;
  guests: GuestItem[];
  defaultMessage: string | null;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "scanned" | "unscanned" | "custom" | "media"
  >("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Filter and search computation
  const filteredGuests = useMemo(() => {
    const term = search.toLowerCase().trim();

    return guests.filter((g) => {
      // 1. Text search match
      const matchesSearch =
        !term ||
        g.name.toLowerCase().includes(term) ||
        (g.tableName && g.tableName.toLowerCase().includes(term)) ||
        g.code.toLowerCase().includes(term) ||
        (g.honorific && g.honorific.toLowerCase().includes(term));

      if (!matchesSearch) return false;

      // 2. Status filter match
      if (filter === "scanned") return g.scanCount > 0;
      if (filter === "unscanned") return g.scanCount === 0;
      if (filter === "custom") return Boolean(g.message);
      if (filter === "media") return Boolean(g.photoUrl || g.videoUrl);

      return true;
    });
  }, [guests, search, filter]);

  const scannedCount = useMemo(() => guests.filter((g) => g.scanCount > 0).length, [guests]);
  const customCount = useMemo(() => guests.filter((g) => Boolean(g.message)).length, [guests]);
  const mediaCount = useMemo(
    () => guests.filter((g) => Boolean(g.photoUrl || g.videoUrl)).length,
    [guests]
  );

  const handleCopyLink = async (code: string) => {
    const url = `${window.location.origin}/g/${code}`;
    await navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search input */}
        <div className="relative flex-1 max-w-[24rem]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, table, or code…"
            className="w-full rounded-xs border border-cotton-3 bg-white pl-9 pr-8 py-2 font-body text-sm text-coffee placeholder:text-ash/50 outline-none focus:border-gold"
          />
          <svg
            className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ash/60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-2.5 text-xs text-ash hover:text-coffee"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[0.62rem] tracking-wider uppercase">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={
              "px-2.5 py-1.5 rounded-xs border transition-colors " +
              (filter === "all"
                ? "border-coffee bg-coffee text-cotton font-semibold"
                : "border-cotton-3 bg-white text-ash hover:border-coffee hover:text-coffee")
            }
          >
            All ({guests.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("scanned")}
            className={
              "px-2.5 py-1.5 rounded-xs border transition-colors " +
              (filter === "scanned"
                ? "border-[#1E5A46] bg-[#1E5A46] text-cotton font-semibold"
                : "border-cotton-3 bg-white text-ash hover:border-[#1E5A46] hover:text-[#1E5A46]")
            }
          >
            Scanned ({scannedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unscanned")}
            className={
              "px-2.5 py-1.5 rounded-xs border transition-colors " +
              (filter === "unscanned"
                ? "border-coffee bg-coffee text-cotton font-semibold"
                : "border-cotton-3 bg-white text-ash hover:border-coffee hover:text-coffee")
            }
          >
            Waiting ({guests.length - scannedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("custom")}
            className={
              "px-2.5 py-1.5 rounded-xs border transition-colors " +
              (filter === "custom"
                ? "border-gold bg-gold text-ink font-semibold"
                : "border-cotton-3 bg-white text-ash hover:border-gold hover:text-coffee")
            }
          >
            Custom note ({customCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("media")}
            className={
              "px-2.5 py-1.5 rounded-xs border transition-colors " +
              (filter === "media"
                ? "border-coffee bg-coffee text-cotton font-semibold"
                : "border-cotton-3 bg-white text-ash hover:border-coffee hover:text-coffee")
            }
          >
            Media ({mediaCount})
          </button>
        </div>
      </div>

      {/* Guest Table */}
      {filteredGuests.length === 0 ? (
        <div className="rounded-xs border border-dashed border-cotton-3 bg-white/50 px-6 py-12 text-center">
          <p className="font-body text-ash">
            {search || filter !== "all"
              ? "No guests match this search or filter."
              : "No guests added yet. Use the form below or paste a guest list."}
          </p>
          {(search || filter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
              className="mt-3 font-mono text-[0.65rem] tracking-wider uppercase text-gold underline underline-offset-4"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xs border border-cotton-3 bg-white shadow-xs">
          <table className="w-full min-w-[44rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-cotton-3 bg-cotton/50 font-mono text-[0.6rem] font-medium tracking-[0.18em] text-ash uppercase">
                <th className="py-3 pl-4 pr-3">Code</th>
                <th className="py-3 pr-4">Guest</th>
                <th className="py-3 pr-4">Table</th>
                <th className="py-3 pr-4">Personalization</th>
                <th className="py-3 pr-4">Scans</th>
                <th className="py-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cotton-3/60 font-body text-sm">
              {filteredGuests.map((guest) => {
                const hasMedia = Boolean(guest.photoUrl || guest.videoUrl);
                const hasCustomMessage = Boolean(guest.message);
                const hasMessage = Boolean(guest.message ?? defaultMessage);
                const isCopied = copiedCode === guest.code;

                return (
                  <tr
                    key={guest.id}
                    className="transition-colors hover:bg-cotton-2/60 group"
                  >
                    {/* Code */}
                    <td className="py-3 pl-4 pr-3 font-mono text-xs text-ash font-medium">
                      {guest.code}
                    </td>

                    {/* Guest Name */}
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/events/${eventId}/guests/${guest.id}`}
                        className="font-semibold text-coffee underline-offset-4 group-hover:text-ink group-hover:underline flex items-center gap-1.5"
                      >
                        <span>
                          {guest.honorific ? `${guest.honorific} ` : ""}
                          {guest.name}
                        </span>
                      </Link>
                    </td>

                    {/* Table */}
                    <td className="py-3 pr-4 font-mono text-xs text-ash">
                      {guest.tableName ? (
                        <span className="inline-block rounded-xs bg-cotton-2 px-2 py-0.5 text-coffee">
                          {guest.tableName}
                        </span>
                      ) : (
                        <span className="text-ash/40">—</span>
                      )}
                    </td>

                    {/* Status badges */}
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[0.6rem] tracking-wider uppercase">
                        {hasCustomMessage ? (
                          <span className="rounded-xs bg-[#1E5A46]/10 px-1.5 py-0.5 text-[#1E5A46] font-medium">
                            Personal note
                          </span>
                        ) : hasMessage ? (
                          <span className="rounded-xs bg-cotton-2 px-1.5 py-0.5 text-ash/80">
                            Event note
                          </span>
                        ) : (
                          <span className="rounded-xs bg-ash/10 px-1.5 py-0.5 text-ash/50">
                            No note
                          </span>
                        )}

                        {hasMedia ? (
                          <span className="rounded-xs bg-gold/15 px-1.5 py-0.5 text-[#855B18] font-medium">
                            Media attached
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Scans */}
                    <td className="py-3 pr-4 font-mono text-xs">
                      {guest.scanCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[#1E5A46] font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#1E5A46]" />
                          {guest.scanCount} {guest.scanCount === 1 ? "scan" : "scans"}
                        </span>
                      ) : (
                        <span className="text-ash/50">0</span>
                      )}
                    </td>

                    {/* Quick Row Actions */}
                    <td className="py-3 pr-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(guest.code)}
                          title="Copy guest link"
                          className={
                            "inline-flex items-center gap-1 rounded-xs border px-2 py-1 font-mono text-[0.6rem] tracking-wider uppercase transition-colors " +
                            (isCopied
                              ? "border-[#1E5A46] bg-[#1E5A46] text-cotton"
                              : "border-cotton-3 bg-white text-ash hover:border-coffee hover:text-coffee")
                          }
                        >
                          {isCopied ? (
                            <>
                              <svg
                                className="h-3 w-3"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <svg
                                className="h-3 w-3"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                              <span>Link</span>
                            </>
                          )}
                        </button>

                        <Link
                          href={`/admin/events/${eventId}/guests/${guest.id}`}
                          className="rounded-xs border border-cotton-3 bg-white px-2 py-1 font-mono text-[0.6rem] tracking-wider uppercase text-ash hover:border-coffee hover:text-coffee transition-colors"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Results footer tally */}
      <div className="flex items-center justify-between font-mono text-[0.62rem] text-ash tracking-wider">
        <span>
          Showing {filteredGuests.length} of {guests.length} guests
        </span>
        {filter !== "all" || search ? (
          <span className="text-gold">Filtered view active</span>
        ) : null}
      </div>
    </div>
  );
}
