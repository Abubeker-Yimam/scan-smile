"use client";

import { useEffect, useRef, useState } from "react";
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

type PendingPhotoItem = {
  id: string;
  file: File;
  processedFile: File | null;
  previewUrl: string;
  status: "working" | "ready" | "error";
  note?: string;
  error?: string;
};

export function MultiImageInput({
  name = "photos",
  existingUrls = [],
  hint,
}: {
  name?: string;
  existingUrls?: string[];
  className?: string;
  hint?: string;
}) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const pickerInputRef = useRef<HTMLInputElement>(null);

  const [keptExisting, setKeptExisting] = useState<string[]>(existingUrls);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhotoItem[]>([]);

  useEffect(() => {
    setKeptExisting(existingUrls);
  }, [existingUrls]);

  const syncInputFiles = (items: PendingPhotoItem[]) => {
    if (!hiddenInputRef.current) return;
    try {
      const dt = new DataTransfer();
      for (const item of items) {
        if (item.status === "ready" && item.processedFile) {
          dt.items.add(item.processedFile);
        }
      }
      hiddenInputRef.current.files = dt.files;
    } catch (err) {
      console.warn("Could not sync DataTransfer to hidden input:", err);
    }
  };

  useEffect(() => {
    return () => {
      pendingPhotos.forEach((p) => {
        try {
          URL.revokeObjectURL(p.previewUrl);
        } catch {
          // ignore cleanup errors
        }
      });
    };
  }, [pendingPhotos]);

  async function handleFiles(newFiles: FileList | null) {
    if (!newFiles || newFiles.length === 0) return;

    const addedItems: PendingPhotoItem[] = [];
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${i}`;
      const previewUrl = URL.createObjectURL(file);
      addedItems.push({
        id,
        file,
        processedFile: null,
        previewUrl,
        status: "working",
      });
    }

    setPendingPhotos((prev) => [...prev, ...addedItems]);

    for (const item of addedItems) {
      const { file, id } = item;

      if (file.type && !IMAGE_ACCEPT.includes(file.type)) {
        setPendingPhotos((current) =>
          current.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: "error",
                  error: "Invalid type. Must be JPG, PNG, WebP or HEIC.",
                }
              : p
          )
        );
        continue;
      }

      if (file.size > IMAGE_CLIENT_MAX_BYTES) {
        setPendingPhotos((current) =>
          current.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: "error",
                  error: `File is ${formatBytes(file.size)} — max is ${formatBytes(IMAGE_CLIENT_MAX_BYTES)}.`,
                }
              : p
          )
        );
        continue;
      }

      const smaller = await downscale(file);
      if (!smaller) {
        if (file.size > IMAGE_MAX_BYTES) {
          setPendingPhotos((current) =>
            current.map((p) =>
              p.id === id
                ? {
                    ...p,
                    status: "error",
                    error: `File exceeds ${formatBytes(IMAGE_MAX_BYTES)} limit. Save as JPEG.`,
                  }
                : p
            )
          );
          continue;
        }

        setPendingPhotos((current) => {
          const next = current.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: "ready" as const,
                  processedFile: file,
                  note: `Ready — ${formatBytes(file.size)}.`,
                }
              : p
          );
          syncInputFiles(next);
          return next;
        });
      } else {
        setPendingPhotos((current) => {
          const next = current.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: "ready" as const,
                  processedFile: smaller,
                  note:
                    smaller.size < file.size
                      ? `Ready — ${formatBytes(file.size)} shrunk to ${formatBytes(smaller.size)}.`
                      : `Ready — ${formatBytes(smaller.size)}.`,
                }
              : p
          );
          syncInputFiles(next);
          return next;
        });
      }
    }
  }

  function removeExisting(url: string) {
    setKeptExisting((prev) => prev.filter((u) => u !== url));
  }

  function removePending(id: string) {
    setPendingPhotos((current) => {
      const item = current.find((p) => p.id === id);
      if (item) {
        try {
          URL.revokeObjectURL(item.previewUrl);
        } catch {
          // ignore
        }
      }
      const next = current.filter((p) => p.id !== id);
      syncInputFiles(next);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {/* Underlying multi-file input submitted with the form */}
      <input
        ref={hiddenInputRef}
        type="file"
        name={name}
        multiple
        className="hidden"
        tabIndex={-1}
      />

      {/* Hidden inputs for existing photos retained by user */}
      {keptExisting.map((url) => (
        <input key={url} type="hidden" name="existingPhotoUrls" value={url} />
      ))}

      {/* Picker trigger */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={pickerInputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          multiple
          onChange={(e) => {
            handleFiles(e.target.files);
            if (pickerInputRef.current) pickerInputRef.current.value = "";
          }}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => pickerInputRef.current?.click()}
          className="inline-flex items-center gap-2 border border-cotton-3 bg-white px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-coffee shadow-2xs transition-colors hover:border-gold hover:text-ink cursor-pointer"
        >
          <span className="text-base font-semibold leading-none text-gold">+</span>
          <span>
            {keptExisting.length > 0 || pendingPhotos.length > 0
              ? "Add more photos"
              : "Choose photos"}
          </span>
        </button>

        <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ash">
          Multi-selection enabled · Auto-shrinks to WebP
        </span>
      </div>

      {hint && (
        <span className="block font-body text-xs text-ash">{hint}</span>
      )}

      {/* Thumbnails grid */}
      {(keptExisting.length > 0 || pendingPhotos.length > 0) && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {keptExisting.map((url, idx) => (
            <div
              key={`existing-${idx}-${url}`}
              className="group relative overflow-hidden border border-cotton-3 bg-cotton-2 transition-all hover:border-gold"
            >
              <div className="relative aspect-4/3 w-full bg-ink-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Saved photo ${idx + 1}`}
                  className="h-full w-full object-contain"
                />
                <span className="absolute bottom-1.5 left-1.5 bg-ink/75 px-1.5 py-0.5 font-mono text-[0.58rem] uppercase tracking-wider text-cotton backdrop-blur-xs">
                  Saved #{idx + 1}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-cotton-3 bg-white px-2.5 py-1.5">
                <span className="truncate font-mono text-[0.62rem] text-ash">Existing</span>
                <button
                  type="button"
                  onClick={() => removeExisting(url)}
                  className="font-mono text-[0.62rem] uppercase tracking-wider text-ash transition-colors hover:text-[#8E1F2F] cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {pendingPhotos.map((item, idx) => (
            <div
              key={item.id}
              className={`group relative overflow-hidden border transition-all ${
                item.status === "error"
                  ? "border-[#8E1F2F] bg-[#8E1F2F]/5"
                  : "border-cotton-3 bg-cotton-2 hover:border-gold"
              }`}
            >
              <div className="relative aspect-4/3 w-full bg-ink-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.previewUrl}
                  alt={`Pending photo ${idx + 1}`}
                  className="h-full w-full object-contain"
                />
                {item.status === "working" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-ink/60 backdrop-blur-xs">
                    <span className="font-mono text-[0.62rem] text-cotton uppercase animate-pulse">
                      Shrinking…
                    </span>
                  </div>
                )}
                {item.status === "ready" && (
                  <span className="absolute bottom-1.5 left-1.5 bg-[#1E5A46]/85 px-1.5 py-0.5 font-mono text-[0.58rem] uppercase tracking-wider text-cotton backdrop-blur-xs">
                    New #{idx + 1}
                  </span>
                )}
              </div>
              <div className="border-t border-cotton-3 bg-white p-2">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className="truncate font-mono text-[0.6rem] text-ash"
                    title={item.file.name}
                  >
                    {item.file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePending(item.id)}
                    className="shrink-0 font-mono text-[0.62rem] uppercase tracking-wider text-ash transition-colors hover:text-[#8E1F2F] cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
                {item.status === "ready" && item.note && (
                  <span className="mt-1 block font-body text-[0.65rem] text-[#1E5A46] leading-tight">
                    {item.note}
                  </span>
                )}
                {item.status === "error" && item.error && (
                  <span className="mt-1 block font-body text-[0.65rem] text-[#8E1F2F] leading-tight">
                    {item.error}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type VideoRow = {
  id: string;
  url: string;
  error: string | null;
  touched: boolean;
};

export function MultiVideoLinkInput({
  initialUrls = [],
  className,
}: {
  initialUrls?: string[];
  className?: string;
}) {
  const [rows, setRows] = useState<VideoRow[]>(() => {
    if (initialUrls.length > 0) {
      return initialUrls.map((u, i) => ({
        id: `row-${i}-${Date.now()}`,
        url: u,
        error: null,
        touched: false,
      }));
    }
    return [{ id: `row-0-${Date.now()}`, url: "", error: null, touched: false }];
  });

  useEffect(() => {
    if (initialUrls.length > 0) {
      setRows(
        initialUrls.map((u, i) => ({
          id: `init-${i}-${u}`,
          url: u,
          error: null,
          touched: false,
        }))
      );
    }
  }, [initialUrls]);

  function validateUrl(val: string): string | null {
    const trimmed = val.trim();
    if (!trimmed) return null;
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return "URL must begin with http:// or https://";
      }
      return null;
    } catch {
      return "Please enter a valid URL (e.g., https://youtu.be/... or https://vimeo.com/...)";
    }
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        url: "",
        error: null,
        touched: false,
      },
    ]);
  }

  function removeRow(id: string) {
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== id);
      return next.length > 0
        ? next
        : [{ id: `row-${Date.now()}`, url: "", error: null, touched: false }];
    });
  }

  function updateRow(id: string, val: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          url: val,
          error: validateUrl(val),
        };
      })
    );
  }

  function markTouched(id: string) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, touched: true } : r))
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row, idx) => (
        <div key={row.id} className="space-y-1">
          <div className="flex items-center gap-2">
            <input
              type="url"
              name="videoUrls"
              value={row.url}
              onChange={(e) => updateRow(row.id, e.target.value)}
              onBlur={() => markTouched(row.id)}
              placeholder="https://youtu.be/… or https://vimeo.com/…"
              className={className}
            />
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              aria-label={`Remove video link ${idx + 1}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center border border-cotton-3 bg-white text-ash transition-colors hover:border-[#8E1F2F] hover:text-[#8E1F2F] cursor-pointer"
              title="Remove link"
            >
              ✕
            </button>
          </div>
          {row.touched && row.error && (
            <span role="alert" className="block font-body text-xs text-[#8E1F2F]">
              {row.error}
            </span>
          )}
        </div>
      ))}

      <div>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 border border-dashed border-cotton-3 bg-white/70 px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-ash transition-colors hover:border-gold hover:text-coffee cursor-pointer"
        >
          <span className="text-sm font-semibold text-gold">+</span>
          <span>Add Video Link</span>
        </button>
      </div>
    </div>
  );
}
