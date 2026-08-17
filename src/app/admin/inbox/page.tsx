import { db } from "@/lib/db";
import { kindConfig, threadVars } from "@/lib/events";
import { LOCALE_NAMES, isLocale } from "@/lib/i18n";
import { formatEventDate } from "@/lib/media";
import { deleteInquiry, setInquiryHandled } from "./actions";

export const dynamic = "force-dynamic";

/** "3 August 2026, 14:20" — enough to tell two messages from the same day apart. */
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
  // Unanswered first, then newest — the order you actually work through them in.
  const inquiries = await db.inquiry.findMany({
    orderBy: [{ handled: "asc" }, { createdAt: "desc" }],
  });

  const waiting = inquiries.filter((inquiry) => !inquiry.handled).length;

  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-display text-3xl font-bold tracking-tight">Inbox</h1>
        <p className="mt-2 font-body text-ash">
          {inquiries.length === 0
            ? "Messages from the contact page land here."
            : `${waiting} waiting for an answer, ${inquiries.length} in total.`}
        </p>
      </section>

      {inquiries.length === 0 ? (
        <p className="border border-dashed border-cotton-3 px-6 py-10 text-center font-body text-ash">
          Nothing yet. When someone writes from the contact page, their message appears here — and
          stays here until you clear it.
        </p>
      ) : (
        <ul className="space-y-5">
          {inquiries.map((inquiry) => {
            const kind = kindConfig(inquiry.kind);
            const date = formatEventDate(inquiry.eventDate);
            return (
              <li
                key={inquiry.id}
                className={
                  "flex items-stretch gap-5 border " +
                  (inquiry.handled ? "border-cotton-3 opacity-60" : "border-coffee/25 bg-white")
                }
              >
                <span
                  style={threadVars(inquiry.kind)}
                  className="tibeb tibeb-v w-[6px] shrink-0"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1 py-5 pr-5">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <p className="font-display text-xl font-semibold">{inquiry.name}</p>
                    <p className="font-mono text-[0.62rem] tracking-[0.16em] text-ash uppercase">
                      {kind.label}
                      {date && ` · ${date}`}
                      {inquiry.guestCount && ` · ${inquiry.guestCount} guests`}
                    </p>
                    <p className="ml-auto font-mono text-[0.6rem] tracking-[0.14em] text-ash">
                      {formatReceived(inquiry.createdAt)}
                    </p>
                  </div>

                  {/* The language they wrote in. Answering an Amharic enquiry
                      in English is a small insult that costs nothing to avoid. */}
                  {isLocale(inquiry.locale) && inquiry.locale !== "en" && (
                    <p className="mt-1.5 inline-block border border-coffee/20 px-2 py-0.5 font-mono text-[0.6rem] tracking-[0.14em] text-coffee uppercase">
                      {LOCALE_NAMES[inquiry.locale].name}
                    </p>
                  )}

                  <p className="mt-1.5 font-mono text-[0.72rem] text-ash">
                    <a
                      href={`mailto:${inquiry.email}`}
                      className="underline underline-offset-4 hover:text-coffee"
                    >
                      {inquiry.email}
                    </a>
                    {inquiry.phone && (
                      <>
                        {" · "}
                        <a
                          href={`tel:${inquiry.phone.replace(/[^\d+]/g, "")}`}
                          className="underline underline-offset-4 hover:text-coffee"
                        >
                          {inquiry.phone}
                        </a>
                      </>
                    )}
                  </p>

                  {/* Whitespace preserved: people write in paragraphs and a wall
                      of run-together text is harder to answer. */}
                  <p className="mt-4 max-w-[46rem] font-body break-words whitespace-pre-wrap text-coffee">
                    {inquiry.message}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-5">
                    <form action={setInquiryHandled}>
                      <input type="hidden" name="id" value={inquiry.id} />
                      <input
                        type="hidden"
                        name="handled"
                        value={inquiry.handled ? "false" : "true"}
                      />
                      <button className="font-mono text-[0.62rem] tracking-[0.16em] text-ash uppercase underline underline-offset-4 hover:text-coffee">
                        {inquiry.handled ? "Reopen" : "Mark answered"}
                      </button>
                    </form>
                    <form action={deleteInquiry}>
                      <input type="hidden" name="id" value={inquiry.id} />
                      <button className="font-mono text-[0.62rem] tracking-[0.16em] text-[#8E1F2F] uppercase underline underline-offset-4 hover:text-ink">
                        Delete
                      </button>
                    </form>
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
