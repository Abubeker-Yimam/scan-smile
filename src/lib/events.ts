import type { CSSProperties } from "react";

/**
 * Every celebration gets its own set of threads.
 *
 * The tibeb band that frames a guest card is woven from three colors; changing
 * them is the only thing that separates a wedding card from a graduation card,
 * the same way one loom produces both.
 */
export type EventKind =
  | "WEDDING"
  | "ENGAGEMENT"
  | "BIRTHDAY"
  | "GRADUATION"
  | "TRADITIONAL"
  | "ANNIVERSARY"
  | "BABY_SHOWER"
  | "OTHER";

export type KindConfig = {
  label: string;
  /** Shown in the eyebrow above the guest's name. */
  eyebrow: string;
  /** Warp, weft and highlight threads of the band, in that order. */
  threads: [string, string, string];
};

export const EVENT_KINDS: Record<EventKind, KindConfig> = {
  WEDDING: {
    label: "Wedding",
    eyebrow: "Wedding",
    threads: ["#8E1F2F", "#1E5A46", "#D4A24C"],
  },
  ENGAGEMENT: {
    label: "Engagement (Shengerena)",
    eyebrow: "Shengerena",
    threads: ["#6B2D5B", "#C97A1E", "#E4C169"],
  },
  BIRTHDAY: {
    label: "Birthday",
    eyebrow: "Birthday",
    threads: ["#1E5F8E", "#D9542B", "#EBC15C"],
  },
  GRADUATION: {
    label: "Graduation",
    eyebrow: "Graduation",
    threads: ["#23366B", "#1E5A46", "#B98A2E"],
  },
  TRADITIONAL: {
    label: "Traditional ceremony",
    eyebrow: "Ceremony",
    threads: ["#7A1E1E", "#33251A", "#D4A24C"],
  },
  ANNIVERSARY: {
    label: "Anniversary",
    eyebrow: "Anniversary",
    threads: ["#6E1B2B", "#2E4A3F", "#C08552"],
  },
  BABY_SHOWER: {
    label: "Baby shower",
    eyebrow: "Baby shower",
    threads: ["#2E7F79", "#E0A46A", "#F0D8A8"],
  },
  OTHER: {
    label: "Special occasion",
    eyebrow: "Celebration",
    threads: ["#8E1F2F", "#1E5A46", "#D4A24C"],
  },
};

export function kindConfig(kind: string): KindConfig {
  return EVENT_KINDS[kind as EventKind] ?? EVENT_KINDS.OTHER;
}

export const KIND_OPTIONS = Object.entries(EVENT_KINDS).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));

/**
 * The fields of an event that decide how its cards look. Anything with these
 * three properties will do, so pages can pass a Prisma row straight in.
 */
export type Themed = {
  kind: string;
  eyebrow?: string | null;
  themeThreads?: string | null;
};

/**
 * Reads three hex colours out of the stored `themeThreads` string, or null if
 * it is absent or malformed. A bad value falls back to the built-in palette
 * rather than rendering a card with missing threads.
 */
export function parseThreads(value: string | null | undefined): KindConfig["threads"] | null {
  if (!value) return null;
  const parts = value.split(",").map((part) => part.trim());
  if (parts.length !== 3) return null;
  if (!parts.every((part) => /^#[0-9a-fA-F]{6}$/.test(part))) return null;
  return [parts[0], parts[1], parts[2]];
}

/**
 * How one particular event should look.
 *
 * The built-in palettes are defaults, not the whole set. A host who wants an
 * occasion the list does not name, or their own colours, sets `eyebrow` and
 * `themeThreads` in the dashboard — so a new kind of celebration is a form
 * submission rather than an edit to this file and a deploy.
 */
export function eventTheme(event: Themed): KindConfig {
  const base = kindConfig(event.kind);
  return {
    label: base.label,
    eyebrow: event.eyebrow?.trim() || base.eyebrow,
    threads: parseThreads(event.themeThreads) ?? base.threads,
  };
}

/** CSS custom properties that drive the tibeb band for an event. */
export function threadVars(event: Themed | string): CSSProperties {
  const [t1, t2, t3] =
    typeof event === "string" ? kindConfig(event).threads : eventTheme(event).threads;
  return { "--t1": t1, "--t2": t2, "--t3": t3 } as CSSProperties;
}
