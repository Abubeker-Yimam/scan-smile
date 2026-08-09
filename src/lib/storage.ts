import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

/**
 * Where guest photos and videos live.
 *
 * Two drivers, chosen by environment, behind one interface:
 *
 *   local — files on disk. `public/uploads` in development (Next serves them
 *           statically) or a mounted volume in a single-container deployment,
 *           in which case `/media/[file]` serves them.
 *   s3    — any S3-compatible bucket: Cloudflare R2, AWS S3, Backblaze B2,
 *           Supabase Storage. Objects are served straight from the bucket's
 *           public URL, so the app never sits in the path of a download.
 *
 * The driver is selected by whether S3_BUCKET is set. Nothing above this module
 * knows which one is active — `saveUpload()` returns a URL either way.
 */

export type StorageDriver = {
  readonly name: "local" | "s3";
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  remove(key: string): Promise<void>;
  /** Public URL for an object already written by `put`. */
  urlFor(key: string): string;
};

/** Disk location for the local driver. Also read by the `/media` route. */
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "public", "uploads");

/** True when local uploads land somewhere Next serves as a static asset. */
const servedStatically = !process.env.UPLOAD_DIR;

const localDriver: StorageDriver = {
  name: "local",
  async put(key, body) {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, key), body);
  },
  async remove(key) {
    // Missing files are not an error: the row is going away regardless, and a
    // half-deleted record is worse than an orphan.
    await unlink(path.join(UPLOAD_DIR, key)).catch(() => {});
  },
  urlFor(key) {
    return servedStatically ? `/uploads/${key}` : `/media/${key}`;
  },
};

function s3Driver(): StorageDriver {
  const bucket = required("S3_BUCKET");
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION ?? "auto";
  const publicBase = required("MEDIA_BASE_URL").replace(/\/$/, "");

  // Imported lazily and cached: a local-disk deployment should never pay to
  // load the AWS SDK, and the module is resolved once per process here.
  let clientPromise: Promise<import("@aws-sdk/client-s3").S3Client> | null = null;
  function client() {
    clientPromise ??= import("@aws-sdk/client-s3").then(
      ({ S3Client }) =>
        new S3Client({
          region,
          ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
          credentials: {
            accessKeyId: required("S3_ACCESS_KEY_ID"),
            secretAccessKey: required("S3_SECRET_ACCESS_KEY"),
          },
        })
    );
    return clientPromise;
  }

  return {
    name: "s3",
    async put(key, body, contentType) {
      const { PutObjectCommand } = await import("@aws-sdk/client-s3");
      await (await client()).send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          // Keys carry a random component and content never changes under a
          // key, so anything that fetches one can hold it forever.
          CacheControl: "public, max-age=31536000, immutable",
        })
      );
    },
    async remove(key) {
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      await (await client())
        .send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
        .catch(() => {});
    },
    urlFor(key) {
      return `${publicBase}/${key}`;
    },
  };
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is required when S3_BUCKET is set. See .env.example for the full set.`
    );
  }
  return value;
}

let cached: StorageDriver | null = null;

export function storage(): StorageDriver {
  cached ??= process.env.S3_BUCKET ? s3Driver() : localDriver;
  return cached;
}

/**
 * The storage key inside a URL this app produced, or null for anything else.
 *
 * Guests' video fields hold pasted YouTube links as often as uploads, and an
 * event that was created before a storage move still holds the old style of
 * URL. Both must be safe to pass to a cleanup call — this returns null and the
 * caller skips them. The key is always a single path segment, so a URL that
 * decodes to something with a separator in it is rejected outright.
 */
export function keyFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  let pathname: string;
  try {
    // Stored URLs are absolute for s3 and root-relative for local.
    pathname = url.startsWith("/") ? url : new URL(url).pathname;
  } catch {
    return null;
  }

  const key = decodeURIComponent(pathname.split("/").pop() ?? "");
  if (!key || key.includes("/") || key.includes("\\") || key.startsWith(".")) return null;

  // Only files this app generated: <base36 time>-<10 hex>.<ext>
  return /^[0-9a-z]+-[0-9a-f]{10}\.[a-z0-9]+$/.test(key) ? key : null;
}
