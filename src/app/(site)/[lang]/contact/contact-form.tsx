"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { sendInquiry, type ContactState } from "./actions";

const LABEL = "block font-mono text-[0.6rem] uppercase tracking-[0.18em] text-cotton/50";
const FIELD =
  "mt-2 w-full border border-cotton/20 bg-ink-2 px-3 py-2.5 font-body text-cotton placeholder:text-cotton/30 outline-none focus:border-gold";

function Submit({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center border border-gold bg-gold px-6 py-3 font-mono text-[0.7rem] tracking-[0.16em] text-ink uppercase transition-colors hover:bg-transparent hover:text-gold disabled:opacity-40"
    >
      {pending ? busy : idle}
    </button>
  );
}

export function ContactForm({
  locale,
  text,
  occasions,
}: {
  locale: Locale;
  text: Dictionary["contact"]["form"];
  occasions: { value: string; label: string }[];
}) {
  const [state, action] = useActionState<ContactState, FormData>(sendInquiry, {});

  // A sent message is not a form any more. Replacing it outright is clearer
  // than a green line above fields that still hold what was just sent, and it
  // makes double-sending take a deliberate click.
  if (state.ok) {
    return (
      <div className="border border-[#1E5A46] bg-[#1E5A46]/10 px-7 py-8">
        <p className="font-display text-2xl font-semibold text-cotton">{text.sentTitle}</p>
        <p className="mt-3 font-body text-cotton/70">{state.ok}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 font-mono text-[0.62rem] tracking-[0.16em] text-cotton/60 uppercase underline underline-offset-4 hover:text-gold"
        >
          {text.sendAnother}
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      {/* Which language they are reading, so an error comes back in it. */}
      <input type="hidden" name="lang" value={locale} />

      {state.error && (
        <p className="border-l-2 border-[#C4525F] bg-[#C4525F]/10 px-4 py-3 font-body text-sm text-[#E8A0A8]">
          {state.error}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block">
          <span className={LABEL}>{text.name}</span>
          <input name="name" className={FIELD} placeholder={text.namePlaceholder} required />
        </label>
        <label className="block">
          <span className={LABEL}>{text.email}</span>
          <input
            type="email"
            name="email"
            className={FIELD}
            placeholder={text.emailPlaceholder}
            dir="ltr"
            required
          />
        </label>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block">
          <span className={LABEL}>{text.phone}</span>
          <input name="phone" className={FIELD} placeholder={text.phonePlaceholder} dir="ltr" />
        </label>
        <label className="block">
          <span className={LABEL}>{text.occasion}</span>
          <select name="kind" defaultValue="WEDDING" className={FIELD}>
            {occasions.map((option) => (
              <option key={option.value} value={option.value} className="bg-ink-2">
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block">
          <span className={LABEL}>{text.date}</span>
          <input type="date" name="eventDate" className={FIELD} />
        </label>
        <label className="block">
          <span className={LABEL}>{text.guests}</span>
          <input
            type="number"
            name="guestCount"
            min={1}
            className={FIELD}
            placeholder={text.guestsPlaceholder}
          />
        </label>
      </div>

      <label className="block">
        <span className={LABEL}>{text.message}</span>
        <textarea
          name="message"
          rows={6}
          className={FIELD}
          placeholder={text.messagePlaceholder}
          required
        />
      </label>

      {/* Not a real field. Hidden from sight, from the keyboard and from a
          screen reader, so only something filling the form in programmatically
          ever puts anything in it. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          {text.honeypot}
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <Submit idle={text.submit} busy={text.submitting} />
        <p className="font-body text-xs text-cotton/40">{text.privacy}</p>
      </div>
    </form>
  );
}
