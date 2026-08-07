import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

/**
 * Where guest photos and videos live.
 *
 * In development this is `public/uploads`, which Next serves directly. In
 * production it points at a mounted volume (UPLOAD_DIR=/data/uploads) so files
 * outlive the container — anything outside `public/` is served by the /media
 * route instead.
 */
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "public", "uploads");

/** True when uploads land somewhere Next can serve as a static asset. */
const servedStatically = !process.env.UPLOAD_DIR;

const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
};

const MAX_BYTES = 60 * 1024 * 1024;

export class UploadError extends Error {}

/**
 * Writes an uploaded photo or video to disk and returns the URL path to store
 * on the guest. Returns null when the form field was left empty.
 *
 * Local disk is the v1 store — swap this one function for S3 or Cloudinary and
 * nothing else in the app has to change.
 */
export async function saveUpload(file: FormDataEntryValue | null): Promise<string | null> {
  if (!file || typeof file === "string") return null;
  if (file.size === 0) return null;

  if (file.size > MAX_BYTES) {
    throw new UploadError(
      `${file.name} is ${(file.size / 1024 / 1024).toFixed(0)}MB. The limit is 60MB.`
    );
  }

  const extension = ALLOWED[file.type];
  if (!extension) {
    throw new UploadError(
      `${file.name} is a ${file.type || "unrecognised"} file. Use JPG, PNG, WebP, MP4, MOV or WebM.`
    );
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${Date.now().toString(36)}-${randomBytes(5).toString("hex")}${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return servedStatically ? `/uploads/${filename}` : `/media/${filename}`;
}
