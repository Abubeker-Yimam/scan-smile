"use client";

import { useRef, useState } from "react";
import {
  IMAGE_ACCEPT,
  IMAGE_CLIENT_MAX_BYTES,
  IMAGE_MAX_BYTES,
  IMAGE_MAX_EDGE,
  IMAGE_QUALITY,
  VIDEO_ACCEPT,
  VIDEO_MAX_BYTES,
  formatBytes,
} from "@/lib/upload-limits";

/**
 * File inputs that check — and for photos, shrink — what the host picked before
 * anything leaves the browser.
 *
 * Hosts fill these in at the venue, on a phone, on venue wifi. Sending a 12MB
 * photo up that link to be resized to 300KB on the far end wastes a minute of
 * someone's evening and often just times out. So the browser does the resize
 * first and uploads the small one.
 *
 * None of this is a security control. `src/lib/uploads.ts` re-checks every
 * limit and re-encodes every image server-side, because a form can be posted
 * without ever running this code.
 */

type Status =
  | { kind: "idle" }
  | { kind: "working" }
  | { kind: "ready"; note: string }
  | { kind: "error"; message: string };

/** Swaps the file the user picked for one we made, keeping the input the form reads. */
function replaceFile(input: HTMLInputElement, file: File) {
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
}

/**
 * Draws the image down to fit inside `IMAGE_MAX_EDGE` and re-encodes it as
 * WebP. Returns null when the browser cannot decode the format — HEIC outside
 * Safari, mainly — and the original has to be sent as-is.
 */
async function downscale(file: File): Promise<File | null> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null;
  }

  const scale = Math.min(1, IMAGE_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return null;
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", IMAGE_QUALITY / 100)
  );
  if (!blob) return null;

  const name = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${name}.webp`, { type: "image/webp" });
}

function Message({ status }: { status: Status }) {
  if (status.kind === "idle") return null;

  const tone =
    status.kind === "error"
      ? "text-[#8E1F2F]"
      : status.kind === "ready"
        ? "text-[#1E5A46]"
        : "text-ash";

  return (
    <span
      role={status.kind === "error" ? "alert" : "status"}
      className={`mt-1.5 block font-body text-xs ${tone}`}
    >
      {status.kind === "working" && "Preparing the photo…"}
      {status.kind === "ready" && status.note}
      {status.kind === "error" && status.message}
    </span>
  );
}

export function ImageInput({
  name,
  className,
  hint,
}: {
  name: string;
  className: string;
  hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onChange() {
    const element = input.current;
    const file = element?.files?.[0];
    if (!element || !file) return setStatus({ kind: "idle" });

    if (file.type && !IMAGE_ACCEPT.includes(file.type)) {
      element.value = "";
      return setStatus({
        kind: "error",
        message: `That is a ${file.type} file. Photos have to be JPG, PNG, WebP or HEIC.`,
      });
    }

    if (file.size > IMAGE_CLIENT_MAX_BYTES) {
      element.value = "";
      return setStatus({
        kind: "error",
        message:
          `That file is ${formatBytes(file.size)} — too large to be a photo. ` +
          `Pick one under ${formatBytes(IMAGE_CLIENT_MAX_BYTES)}.`,
      });
    }

    setStatus({ kind: "working" });
    const smaller = await downscale(file);

    if (!smaller) {
      // Undecodable here, so it goes up untouched and the server deals with it.
      if (file.size > IMAGE_MAX_BYTES) {
        element.value = "";
        return setStatus({
          kind: "error",
          message:
            `This browser cannot open ${file.name}, and at ${formatBytes(file.size)} ` +
            `it is over the ${formatBytes(IMAGE_MAX_BYTES)} limit. Save it as a JPEG and try again.`,
        });
      }
      return setStatus({ kind: "ready", note: `${file.name} · ${formatBytes(file.size)}` });
    }

    replaceFile(element, smaller);
    setStatus({
      kind: "ready",
      note:
        smaller.size < file.size
          ? `Ready — ${formatBytes(file.size)} shrunk to ${formatBytes(smaller.size)}.`
          : `Ready — ${formatBytes(smaller.size)}.`,
    });
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        name={name}
        accept={IMAGE_ACCEPT}
        onChange={onChange}
        className={className}
      />
      {hint && status.kind === "idle" && (
        <span className="mt-1.5 block font-body text-xs text-ash">{hint}</span>
      )}
      <Message status={status} />
    </>
  );
}

export function VideoInput({
  name,
  className,
  hint,
}: {
  name: string;
  className: string;
  hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function onChange() {
    const element = input.current;
    const file = element?.files?.[0];
    if (!element || !file) return setStatus({ kind: "idle" });

    // Video cannot be compressed in the browser, so an oversized clip is a
    // dead end here rather than something to fix silently.
    if (file.size > VIDEO_MAX_BYTES) {
      element.value = "";
      return setStatus({
        kind: "error",
        message:
          `That clip is ${formatBytes(file.size)}. Videos have to be under ` +
          `${formatBytes(VIDEO_MAX_BYTES)} — about a minute of phone video. For a longer ` +
          `one, put it on YouTube and paste the link below instead.`,
      });
    }

    setStatus({ kind: "ready", note: `${file.name} · ${formatBytes(file.size)}` });
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        name={name}
        accept={VIDEO_ACCEPT}
        onChange={onChange}
        className={className}
      />
      {hint && status.kind === "idle" && (
        <span className="mt-1.5 block font-body text-xs text-ash">{hint}</span>
      )}
      <Message status={status} />
    </>
  );
}
