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

/** CSS custom properties that drive the tibeb band for a given event kind. */
export function threadVars(kind: string): CSSProperties {
  const [t1, t2, t3] = kindConfig(kind).threads;
  return { "--t1": t1, "--t2": t2, "--t3": t3 } as CSSProperties;
}
