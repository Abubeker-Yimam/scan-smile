import { randomBytes } from "crypto";
import sharp from "sharp";
import { keyFromUrl, storage } from "@/lib/storage";
import {
  IMAGE_MAX_BYTES,
  IMAGE_MAX_EDGE,
  IMAGE_MAX_PIXELS,
  IMAGE_QUALITY,
  VIDEO_MAX_BYTES,
  formatBytes,
} from "@/lib/upload-limits";

export { UPLOAD_DIR } from "@/lib/storage";

export class UploadError extends Error {}

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const VIDEO_TYPES: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
};

function key(extension: string): string {
  return `${Date.now().toString(36)}-${randomBytes(5).toString("hex")}${extension}`;
}

/** Narrows a form field to an actual file with bytes in it. */
function uploaded(file: FormDataEntryValue | null): file is File {
  return file !== null && typeof file !== "string" && file.size > 0;
}

/**
 * Stores an uploaded photo and returns its URL, or null when the field was left
 * empty.
 *
 * The browser downscales before sending (see `admin/media-inputs.tsx`), but that is a
 * courtesy to the guest's data plan, not a control — a form can be posted
 * without it. Every limit is enforced again here, and this is the enforcement
 * that counts.
 *
 * Whatever arrives is re-encoded to WebP at a bounded size. That normalises
 * HEIC and 48MP JPEGs into one format the guest page can render, and it drops
 * EXIF along the way, so the GPS coordinates of someone's home do not ship
 * inside a wedding photo.
 */
export async function saveImage(file: FormDataEntryValue | null): Promise<string | null> {
  if (!uploaded(file)) return null;

  if (file.size > IMAGE_MAX_BYTES) {
    throw new UploadError(
      `${file.name} is ${formatBytes(file.size)}. Photos have to be under ` +
        `${formatBytes(IMAGE_MAX_BYTES)} — try again from your phone's photo library, ` +
        `which sends a smaller copy.`
    );
  }

  if (file.type && !IMAGE_TYPES.has(file.type)) {
    throw new UploadError(
      `${file.name} is a ${file.type} file. Photos have to be JPG, PNG, WebP or HEIC.`
    );
  }

  const input = Buffer.from(await file.arrayBuffer());

  // `limitInputPixels` makes sharp refuse a decompression bomb before it
  // allocates the pixel buffer, rather than after the container is out of memory.
  const image = sharp(input, { limitInputPixels: IMAGE_MAX_PIXELS, failOn: "error" });

  let width: number | undefined;
  let height: number | undefined;
  try {
    ({ width, height } = await image.metadata());
  } catch {
    throw new UploadError(
      `${file.name} could not be read as an image. If it came from an iPhone, ` +
        `open it once in Photos and share it as JPEG.`
    );
  }

  if (!width || !height) {
    throw new UploadError(`${file.name} has no readable dimensions.`);
  }
  if (width * height > IMAGE_MAX_PIXELS) {
    throw new UploadError(
      `${file.name} is ${width}×${height}, which is larger than this can process. ` +
        `Resize it below ${Math.round(IMAGE_MAX_PIXELS / 1_000_000)} megapixels and try again.`
    );
  }

  let output: Buffer;
  try {
    output = await image
      // `rotate()` with no argument applies the EXIF orientation, then the tag
      // is dropped with the rest of the metadata — without it, portrait phone
      // photos land on their side.
      .rotate()
      .resize({
        width: IMAGE_MAX_EDGE,
        height: IMAGE_MAX_EDGE,
        fit: "inside",
        // Never upscale: a small photo stays small rather than being blown up
        // into a soft 2000px version of itself.
        withoutEnlargement: true,
      })
      .webp({ quality: IMAGE_QUALITY })
      .toBuffer();
  } catch {
    throw new UploadError(
      `${file.name} could not be processed. If it is a HEIC photo, share it as ` +
        `JPEG from Photos and upload that instead.`
    );
  }

  const name = key(".webp");
  await storage().put(name, output, "image/webp");
  return storage().urlFor(name);
}

/**
 * Stores an uploaded video and returns its URL, or null when the field was left
 * empty.
 *
 * Videos are stored exactly as uploaded. Transcoding needs ffmpeg and turns a
 * form save into a job queue, which is a larger machine than this app is; the
 * size cap is what keeps that unnecessary.
 */
export async function saveVideo(file: FormDataEntryValue | null): Promise<string | null> {
  if (!uploaded(file)) return null;

  if (file.size > VIDEO_MAX_BYTES) {
    throw new UploadError(
      `${file.name} is ${formatBytes(file.size)}. Videos have to be under ` +
        `${formatBytes(VIDEO_MAX_BYTES)} — that is about a minute of phone video. ` +
        `For anything longer, upload it to YouTube and paste the link instead.`
    );
  }

  const extension = VIDEO_TYPES[file.type];
  if (!extension) {
    throw new UploadError(
      `${file.name} is a ${file.type || "unrecognised"} file. Videos have to be MP4, MOV or WebM.`
    );
  }

  const name = key(extension);
  await storage().put(name, Buffer.from(await file.arrayBuffer()), file.type);
  return storage().urlFor(name);
}

/**
 * Removes a stored file, given the URL held on an event or guest.
 *
 * Safe to call with anything a media field might hold: a pasted YouTube link,
 * a seeded placeholder, null. Only URLs matching a key this app generated are
 * acted on, and a delete that fails is swallowed — an orphaned object costs a
 * fraction of a cent, while a delete that throws would abort the surrounding
 * database write and leave a guest pointing at a file that is already gone.
 */
export async function deleteUpload(url: string | null | undefined): Promise<void> {
  const name = keyFromUrl(url);
  if (!name) return;
  try {
    await storage().remove(name);
  } catch {
    // Intentionally ignored; see above.
  }
}

/** Removes several stored files, ignoring any that are not ours. */
export async function deleteUploads(urls: Array<string | null | undefined>): Promise<void> {
  await Promise.all(urls.map(deleteUpload));
}
