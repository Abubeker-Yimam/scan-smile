export type ResolvedVideo =
  | { type: "embed"; src: string }
  | { type: "file"; src: string };

/**
 * Hosts paste whatever link they have. YouTube and Vimeo become embeds;
 * anything else (including files uploaded into /uploads) plays inline.
 */
export function resolveVideo(url: string): ResolvedVideo {
  const trimmed = url.trim();

  const youtube = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (youtube) return { type: "embed", src: `https://www.youtube.com/embed/${youtube[1]}` };

  const vimeo = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { type: "embed", src: `https://player.vimeo.com/video/${vimeo[1]}` };

  return { type: "file", src: trimmed };
}

export function formatEventDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
