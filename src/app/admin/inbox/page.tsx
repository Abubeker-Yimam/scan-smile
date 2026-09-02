import Link from "next/link";
import { db } from "@/lib/db";
import { kindConfig, threadVars } from "@/lib/events";
import { LOCALE_NAMES, isLocale } from "@/lib/i18n";
import { formatEventDate } from "@/lib/media";
import { deleteInquiry, setInquiryHandled } from "./actions";

export const dynamic = "force-dynamic";

function formatReceived(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function InboxPage() {
  const inquiries = await db.inquiry.findMany({
    orderBy: [{ handled: "asc" }, { createdAt: "desc" }],
  });

  const waiting = inquiries.filter((inquiry) => !inquiry.handled).length;

  return (
    <div className="space-y-10">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-coffee">Inbox</h1>
          <p className="mt-1 font-body text-sm text-ash">
            {inquiries.length === 0
              ? "Messages from the public contact page land here."
              : `${waiting} waiting for an answer, ${inquiries.length} total messages.`}
          </p>
        </div>
      </section>

      {inquiries.length === 0 ? (
        <div className="rounded-xs border border-dashed border-cotton-3 bg-white/60 px-6 py-12 text-center font-body text-ash">
          <p>No messages yet.</p>
          <p className="mt-1 text-sm text-ash/80">
            When someone submits an inquiry on the contact form, it will appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {inquiries.map((inquiry) => {
            const kind = kindConfig(inquiry.kind);
            const date = formatEventDate(inquiry.eventDate);
            const phoneDigits = inquiry.phone ? inquiry.phone.replace(/[^\d+]/g, "") : "";

            return (
              <li
                key={inquiry.id}
                className={
                  "flex items-stretch gap-4 sm:gap-5 rounded-xs border p-5 shadow-xs transition-all " +
                  (inquiry.handled
                    ? "border-cotton-3/80 bg-cotton/40 opacity-70"
                    : "border-coffee/20 bg-white")
                }
              >
                <span
                  style={threadVars(inquiry.kind)}
                  className="tibeb tibeb-v w-2 shrink-0 rounded-xs"
                  aria-hidden="true"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <p className="font-display text-xl font-bold text-coffee">{inquiry.name}</p>
                      <span className="font-mono text-[0.62rem] tracking-[0.16em] text-ash uppercase">
                        {kind.label}
                        {date && ` · ${date}`}
                        {inquiry.guestCount && ` · ~${inquiry.guestCount} guests`}
                      </span>
                    </div>

                    <p className="font-mono text-[0.62rem] tracking-wider text-ash">
                      {formatReceived(inquiry.createdAt)}
                    </p>
                  </div>

                  {/* Language & contact channels */}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                    {isLocale(inquiry.locale) && inquiry.locale !== "en" && (
                      <span className="rounded-xs border border-cotton-3 bg-cotton-2 px-2 py-0.5 font-mono text-[0.58rem] tracking-wider text-coffee uppercase font-medium">
                        {LOCALE_NAMES[inquiry.locale].name}
                      </span>
                    )}

                    <a
                      href={`mailto:${inquiry.email}`}
                      className="font-mono text-[0.72rem] text-ash underline underline-offset-4 hover:text-coffee"
                    >
                      {inquiry.email}
                    </a>

                    {inquiry.phone && (
                      <>
                        <span className="text-cotton-3">·</span>
                        <a
                          href={`tel:${phoneDigits}`}
                          className="font-mono text-[0.72rem] text-ash underline underline-offset-4 hover:text-coffee"
                        >
                          {inquiry.phone}
                        </a>
                      </>
                    )}
                  </div>

                  {/* Message body */}
                  <p className="mt-4 max-w-[46rem] font-body text-sm leading-relaxed break-words whitespace-pre-wrap text-coffee/90 bg-cotton-2/40 p-3.5 rounded-xs border border-cotton-3/50">
                    {inquiry.message}
                  </p>

                  {/* Action row */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-cotton-3/60 pt-3">
                    <div className="flex flex-wrap items-center gap-3 font-mono text-[0.62rem] tracking-wider uppercase">
                      {/* Convert to Event */}
                      <Link
                        href={`/admin?inquiryId=${inquiry.id}#book-event`}
                        className="inline-flex items-center gap-1.5 rounded-xs border border-gold bg-gold/15 px-3 py-1.5 text-[#855B18] font-semibold hover:bg-gold hover:text-ink transition-colors"
                      >
                        <span>+ Book as Event</span>
                      </Link>

                      {/* Call button */}
                      {inquiry.phone && (
                        <a
                          href={`tel:${phoneDigits}`}
                          className="inline-flex items-center gap-1 rounded-xs border border-cotton-3 bg-white px-2.5 py-1.5 text-coffee hover:border-coffee transition-colors"
                        >
                          <span>Call</span>
                        </a>
                      )}

                      {/* Email button */}
                      <a
                        href={`mailto:${inquiry.email}`}
                        className="inline-flex items-center gap-1 rounded-xs border border-cotton-3 bg-white px-2.5 py-1.5 text-coffee hover:border-coffee transition-colors"
                      >
                        <span>Email</span>
                      </a>
                    </div>

                    <div className="flex items-center gap-4 font-mono text-[0.62rem] tracking-wider uppercase">
                      <form action={setInquiryHandled}>
                        <input type="hidden" name="id" value={inquiry.id} />
                        <input
                          type="hidden"
                          name="handled"
                          value={inquiry.handled ? "false" : "true"}
                        />
                        <button className="text-ash underline underline-offset-4 hover:text-coffee cursor-pointer">
                          {inquiry.handled ? "Reopen" : "Mark answered"}
                        </button>
                      </form>

                      <form action={deleteInquiry}>
                        <input type="hidden" name="id" value={inquiry.id} />
                        <button className="text-[#8E1F2F] underline underline-offset-4 hover:text-ink cursor-pointer">
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
