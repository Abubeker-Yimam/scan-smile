/**
 * Upload limits, shared by the browser and the server.
 *
 * This module is imported by client components, so it must stay free of Node
 * built-ins. The numbers live here once; `src/lib/uploads.ts` enforces them for
 * real and `src/app/admin/image-input.tsx` uses them to fail fast in the form.
 */

export const MB = 1024 * 1024;

/**
 * Biggest image we accept off the wire.
 *
 * A 48MP phone photo in HEIC is 4–8MB and the same shot as JPEG is 8–14MB, so
 * 15MB accepts anything a guest's phone produces without accepting a RAW file
 * or a scanned poster by accident. The browser downscales before sending, so
 * in practice this only catches uploads that skipped the client path.
 */
export const IMAGE_MAX_BYTES = 15 * MB;

/**
 * Ceiling on what the browser will even attempt to downscale.
 *
 * Anything under this and over `IMAGE_MAX_BYTES` is not rejected in the form —
 * it is resized down to something well inside the limit and sent. Rejecting a
 * 20MB holiday photo outright would be a worse form for no gain, since the
 * browser can trivially make it a 300KB one. Past this point the file is not a
 * photograph and the guest gets told so before their upload starts.
 */
export const IMAGE_CLIENT_MAX_BYTES = 40 * MB;

/**
 * Decode guard, applied before any pixels are processed.
 *
 * File size alone is not a bound on decode cost: a highly compressible image
 * can be a few MB on disk and gigabytes in memory. 50 megapixels is above any
 * real camera we expect and well below a size that could exhaust the container.
 */
export const IMAGE_MAX_PIXELS = 50_000_000;

/**
 * Longest edge kept in storage.
 *
 * The guest page renders a photo at most 608 CSS px wide, and the print sheet
 * needs roughly 1000px for a card at 300dpi. 2000px covers a 3x retina phone
 * and print with room to spare; beyond that a guest is downloading detail no
 * screen will ever show.
 */
export const IMAGE_MAX_EDGE = 2000;

/** WebP quality for stored images. 80 is visually lossless for photographs. */
export const IMAGE_QUALITY = 80;

/**
 * Biggest video we accept.
 *
 * Videos are stored as uploaded — we do not transcode, because ffmpeg in the
 * web container would turn a save into a multi-minute job. 50MB is roughly 60
 * seconds of 1080p phone footage, which is the length these messages actually
 * are, and it stays under the server action body limit in `next.config.ts`.
 * Anything longer belongs on YouTube, pasted in as a link.
 */
export const VIDEO_MAX_BYTES = 50 * MB;

/** Extensions the browser file picker should offer. */
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";
export const VIDEO_ACCEPT = "video/mp4,video/quicktime,video/webm";

export function formatBytes(bytes: number): string {
  if (bytes < MB) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  const mb = bytes / MB;
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)}MB`;
}
