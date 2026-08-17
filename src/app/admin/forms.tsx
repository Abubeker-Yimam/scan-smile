"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { KIND_OPTIONS } from "@/lib/events";
import { ImageInput, VideoInput } from "./media-inputs";
import {
  addGuest,
  addGuestsBulk,
  createEvent,
  updateEvent,
  updateGuest,
  type ActionState,
} from "./actions";

const LABEL = "block font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ash";
const FIELD =
  "mt-1.5 w-full border border-cotton-3 bg-white px-3 py-2 font-body text-coffee placeholder:text-ash/50 outline-none focus:border-gold";
const BUTTON =
  "inline-flex items-center justify-center border border-coffee bg-coffee px-5 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-cotton transition-colors hover:bg-ink disabled:opacity-40";

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={BUTTON} disabled={pending}>
      {pending ? "Saving…" : children}
    </button>
  );
}

function Note({ state }: { state: ActionState }) {
  if (state.error) {
    return (
      <p className="border-l-2 border-[#8E1F2F] bg-[#8E1F2F]/5 px-3 py-2 font-body text-sm text-[#8E1F2F]">
        {state.error}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p className="border-l-2 border-[#1E5A46] bg-[#1E5A46]/5 px-3 py-2 font-body text-sm text-[#1E5A46]">
        {state.ok}
      </p>
    );
  }
  return null;
}

type EventDefaults = {
  id?: string;
  title?: string;
  kind?: string;
  hostNames?: string;
  eventDate?: string;
  venue?: string | null;
  eyebrow?: string | null;
  themeThreads?: string | null;
  defaultMessage?: string | null;
};

export function EventForm({ event }: { event?: EventDefaults }) {
  const isEdit = Boolean(event?.id);
  const [state, action] = useActionState<ActionState, FormData>(
    isEdit ? updateEvent : createEvent,
    {}
  );

  return (
    <form action={action} className="space-y-5">
      {isEdit && <input type="hidden" name="id" value={event!.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={LABEL}>Event name</span>
          <input
            name="title"
            defaultValue={event?.title}
            placeholder="Megersa &amp; Sara — Wedding"
            className={FIELD}
            required
          />
        </label>
        <label className="block">
          <span className={LABEL}>Occasion</span>
          <select name="kind" defaultValue={event?.kind ?? "WEDDING"} className={FIELD}>
            {KIND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <label className="block sm:col-span-1">
          <span className={LABEL}>Hosts</span>
          <input
            name="hostNames"
            defaultValue={event?.hostNames}
            placeholder="Megersa &amp; Sara"
            className={FIELD}
            required
          />
        </label>
        <label className="block">
          <span className={LABEL}>Date</span>
          <input type="date" name="eventDate" defaultValue={event?.eventDate} className={FIELD} />
        </label>
        <label className="block">
          <span className={LABEL}>Venue</span>
          <input
            name="venue"
            defaultValue={event?.venue ?? ""}
            placeholder="Sheraton Addis, Lalibela Hall"
            className={FIELD}
          />
        </label>
      </div>

      <label className="block">
        <span className={LABEL}>Message every guest sees</span>
        <textarea
          name="defaultMessage"
          defaultValue={event?.defaultMessage ?? ""}
          rows={3}
          placeholder="Thank you so much for celebrating this special day with us. Your love and support mean everything."
          className={FIELD}
        />
        <span className="mt-1.5 block font-body text-xs text-ash">
          A guest with their own message gets that instead.
        </span>
      </label>

      {isEdit && (
        <>
          <label className="block">
            <span className={LABEL}>Cover photo</span>
            <ImageInput
              name="coverImage"
              className={FIELD}
              hint="Shown to guests who have no photo of their own."
            />
          </label>

          <fieldset className="border-t border-cotton-3 pt-6">
            <legend className="sr-only">Card appearance</legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className={LABEL}>Word above the guest&apos;s name</span>
                <input
                  name="eyebrow"
                  defaultValue={event?.eyebrow ?? ""}
                  placeholder="Shengerena"
                  className={FIELD}
                />
                <span className="mt-1.5 block font-body text-xs text-ash">
                  Leave empty to use the occasion&apos;s own word. Set it to name a celebration
                  the list above doesn&apos;t cover.
                </span>
              </label>
              <label className="block">
                <span className={LABEL}>Card colours</span>
                <input
                  name="themeThreads"
                  defaultValue={event?.themeThreads ?? ""}
                  placeholder="#8E1F2F, #1E5A46, #D4A24C"
                  className={`${FIELD} font-mono text-sm`}
                />
                <span className="mt-1.5 block font-body text-xs text-ash">
                  Three hex codes — the woven band&apos;s three threads. Empty uses the
                  occasion&apos;s colours.
                </span>
              </label>
            </div>
          </fieldset>
        </>
      )}

      <Note state={state} />
      <Submit>{isEdit ? "Save event" : "Create event"}</Submit>
    </form>
  );
}

export function AddGuestForm({ eventId }: { eventId: string }) {
  const [state, action] = useActionState<ActionState, FormData>(addGuest, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="eventId" value={eventId} />
      <div className="grid gap-4 sm:grid-cols-[7rem_1fr_9rem]">
        <label className="block">
          <span className={LABEL}>Title</span>
          <input name="honorific" placeholder="Ato" className={FIELD} />
        </label>
        <label className="block">
          <span className={LABEL}>Guest name</span>
          <input name="name" placeholder="Bekele Alemu" className={FIELD} required />
        </label>
        <label className="block">
          <span className={LABEL}>Table</span>
          <input name="tableName" placeholder="Table 4" className={FIELD} />
        </label>
      </div>
      <Note state={state} />
      <Submit>Add guest</Submit>
    </form>
  );
}

export function BulkGuestForm({ eventId }: { eventId: string }) {
  const [state, action] = useActionState<ActionState, FormData>(addGuestsBulk, {});
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-ash underline underline-offset-4 hover:text-coffee"
      >
        Paste a whole guest list
      </button>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="eventId" value={eventId} />
      <label className="block">
        <span className={LABEL}>One guest per line</span>
        <textarea
          name="list"
          rows={7}
          className={`${FIELD} font-mono text-sm`}
          placeholder={"Bekele Alemu, Table 4\nWoizero Hanna Girma, Table 4\nDr. Yonas Tesfaye, Table 7"}
        />
        <span className="mt-1.5 block font-body text-xs text-ash">
          Add a comma and a table name to seat them at the same time.
        </span>
      </label>
      <Note state={state} />
      <div className="flex items-center gap-4">
        <Submit>Add all</Submit>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-ash hover:text-coffee"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

type GuestDefaults = {
  id: string;
  eventId: string;
  name: string;
  honorific: string | null;
  tableName: string | null;
  message: string | null;
  videoUrl: string | null;
};

export function GuestForm({ guest }: { guest: GuestDefaults }) {
  const [state, action] = useActionState<ActionState, FormData>(updateGuest, {});

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={guest.id} />
      <input type="hidden" name="eventId" value={guest.eventId} />

      <div className="grid gap-5 sm:grid-cols-[7rem_1fr]">
        <label className="block">
          <span className={LABEL}>Title</span>
          <input
            name="honorific"
            defaultValue={guest.honorific ?? ""}
            placeholder="Ato"
            className={FIELD}
          />
        </label>
        <label className="block">
          <span className={LABEL}>Guest name</span>
          <input name="name" defaultValue={guest.name} className={FIELD} required />
        </label>
      </div>

      <label className="block">
        <span className={LABEL}>Table</span>
        <input
          name="tableName"
          defaultValue={guest.tableName ?? ""}
          placeholder="Table 4"
          className={FIELD}
        />
      </label>

      <label className="block">
        <span className={LABEL}>Personal message</span>
        <textarea
          name="message"
          defaultValue={guest.message ?? ""}
          rows={4}
          placeholder="Write to this guest by name. Leave empty to use the event message."
          className={FIELD}
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={LABEL}>Photo with the hosts</span>
          <ImageInput name="photo" className={FIELD} />
        </label>
        <label className="block">
          <span className={LABEL}>Personal video</span>
          <VideoInput name="video" className={FIELD} />
        </label>
      </div>

      <label className="block">
        <span className={LABEL}>Or link a video</span>
        <input
          name="videoUrl"
          defaultValue={guest.videoUrl ?? ""}
          placeholder="https://youtu.be/…"
          className={FIELD}
        />
        <span className="mt-1.5 block font-body text-xs text-ash">
          Uploading a file above replaces this link.
        </span>
      </label>

      <Note state={state} />
      <Submit>Save guest</Submit>
    </form>
  );
}

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-ash underline underline-offset-4 hover:text-coffee"
    >
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
