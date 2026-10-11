"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { generateCode } from "@/lib/codes";
import { parseThreads } from "@/lib/events";
import { deleteUpload, deleteUploads, saveImage, saveVideo, UploadError } from "@/lib/uploads";

export type ActionState = { error?: string; ok?: string };

function text(form: FormData, key: string): string {
  return (form.get(key) as string | null)?.trim() ?? "";
}

function optional(form: FormData, key: string): string | null {
  const value = text(form, key);
  return value.length > 0 ? value : null;
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * The custom palette, or an error the host can act on.
 *
 * Three hex colours or nothing — a half-filled set would render a band with a
 * missing thread, so it is refused rather than silently completed.
 */
function readThreads(form: FormData): { threads: string | null } | { error: string } {
  const value = optional(form, "themeThreads");
  if (!value) return { threads: null };
  if (!parseThreads(value)) {
    return {
      error:
        "Custom colours need three hex codes separated by commas, like " +
        "#8E1F2F, #1E5A46, #D4A24C. Leave the field empty to use the occasion's own colours.",
    };
  }
  return { threads: value };
}

/** Codes are unique across every event, so a card can never open the wrong page. */
async function uniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = generateCode();
    const taken = await db.guest.findUnique({ where: { code }, select: { id: true } });
    if (!taken) return code;
  }
  throw new Error("Could not allocate a guest code. Try again.");
}

export async function createEvent(_prev: ActionState, form: FormData): Promise<ActionState> {
  const title = text(form, "title");
  const hostNames = text(form, "hostNames");
  if (!title) return { error: "Give the event a name — guests never see it, but you will." };
  if (!hostNames) return { error: "Add the host names. They sign every guest's message." };

  const threads = readThreads(form);
  if ("error" in threads) return { error: threads.error };

  const event = await db.event.create({
    data: {
      title,
      hostNames,
      kind: text(form, "kind") || "WEDDING",
      eventDate: parseDate(text(form, "eventDate")),
      venue: optional(form, "venue"),
      eyebrow: optional(form, "eyebrow"),
      themeThreads: threads.threads,
      defaultMessage: optional(form, "defaultMessage"),
    },
  });

  redirect(`/admin/events/${event.id}`);
}

export async function updateEvent(_prev: ActionState, form: FormData): Promise<ActionState> {
  const id = text(form, "id");
  const title = text(form, "title");
  const hostNames = text(form, "hostNames");
  if (!title || !hostNames) return { error: "Event name and host names are both required." };

  const threads = readThreads(form);
  if ("error" in threads) return { error: threads.error };

  const existing = await db.event.findUnique({
    where: { id },
    select: { coverImageUrl: true },
  });
  if (!existing) return { error: "That event no longer exists." };

  let coverImageUrl: string | null = null;
  try {
    coverImageUrl = await saveImage(form.get("coverImage"));
  } catch (error) {
    if (error instanceof UploadError) return { error: error.message };
    throw error;
  }

  await db.event.update({
    where: { id },
    data: {
      title,
      hostNames,
      kind: text(form, "kind") || "WEDDING",
      eventDate: parseDate(text(form, "eventDate")),
      venue: optional(form, "venue"),
      eyebrow: optional(form, "eyebrow"),
      themeThreads: threads.threads,
      defaultMessage: optional(form, "defaultMessage"),
      ...(coverImageUrl ? { coverImageUrl } : {}),
    },
  });

  // Only once the row points at the new file, so a failure here leaves an
  // orphan rather than a broken card.
  if (coverImageUrl) await deleteUpload(existing.coverImageUrl);

  revalidatePath(`/admin/events/${id}`);
  return { ok: "Event saved." };
}

export async function deleteEvent(form: FormData) {
  const id = text(form, "id");

  // Guests cascade in the database, but their files do not — collect them while
  // the rows still exist.
  const event = await db.event.findUnique({
    where: { id },
    select: {
      coverImageUrl: true,
      guests: { select: { photoUrl: true, videoUrl: true, photoUrls: true, videoUrls: true } },
      media: { select: { url: true } },
    },
  });

  await db.event.delete({ where: { id } });

  if (event) {
    await deleteUploads([
      event.coverImageUrl,
      ...event.guests.flatMap((guest) => [
        guest.photoUrl,
        guest.videoUrl,
        ...guest.photoUrls,
        ...guest.videoUrls,
      ]),
      ...event.media.map((m) => m.url),
    ]);
  }

  revalidatePath("/admin");
  redirect("/admin");
}

export async function addGuest(_prev: ActionState, form: FormData): Promise<ActionState> {
  const eventId = text(form, "eventId");
  const name = text(form, "name");
  if (!name) return { error: "A guest needs a name — it's the first thing they'll read." };

  await db.guest.create({
    data: {
      eventId,
      name,
      code: await uniqueCode(),
      honorific: optional(form, "honorific"),
      tableName: optional(form, "tableName"),
    },
  });

  revalidatePath(`/admin/events/${eventId}`);
  return { ok: `${name} added.` };
}

/**
 * The guest list usually arrives as a list, not a form. One guest per line,
 * with an optional table after a comma:  Ato Bekele Alemu, Table 4
 */
export async function addGuestsBulk(_prev: ActionState, form: FormData): Promise<ActionState> {
  const eventId = text(form, "eventId");
  const lines = text(form, "list")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return { error: "Paste at least one name." };

  let added = 0;
  for (const line of lines) {
    const [rawName, rawTable] = line.split(",");
    const name = rawName?.trim();
    if (!name) continue;
    await db.guest.create({
      data: {
        eventId,
        name,
        code: await uniqueCode(),
        tableName: rawTable?.trim() || null,
      },
    });
    added++;
  }

  revalidatePath(`/admin/events/${eventId}`);
  return { ok: `${added} ${added === 1 ? "guest" : "guests"} added.` };
}

export async function updateGuest(_prev: ActionState, form: FormData): Promise<ActionState> {
  const id = text(form, "id");
  const eventId = text(form, "eventId");
  const name = text(form, "name");
  if (!name) return { error: "A guest needs a name." };

  const existing = await db.guest.findUnique({
    where: { id },
    select: {
      code: true,
      photoUrl: true,
      videoUrl: true,
      photoUrls: true,
      videoUrls: true,
    },
  });
  if (!existing) return { error: "That guest no longer exists." };

  // 1. Process kept existing photo URLs
  const keptPhotoUrls = form
    .getAll("existingPhotoUrls")
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean);

  // 2. Process newly uploaded photos (support both multiple 'photos' and single 'photo')
  const photoEntries = [
    ...form.getAll("photos"),
    form.get("photo"),
  ].filter(Boolean);

  const newPhotoUrls: string[] = [];
  try {
    for (const entry of photoEntries) {
      const url = await saveImage(entry);
      if (url) newPhotoUrls.push(url);
    }
  } catch (error) {
    if (error instanceof UploadError) return { error: error.message };
    throw error;
  }

  const existingAllPhotos =
    existing.photoUrls && existing.photoUrls.length > 0
      ? existing.photoUrls
      : existing.photoUrl
        ? [existing.photoUrl]
        : [];

  const hasPhotoSubmission =
    form.has("photos") || form.has("existingPhotoUrls") || form.has("photo");

  const allPhotoUrls = hasPhotoSubmission
    ? [...keptPhotoUrls, ...newPhotoUrls]
    : existingAllPhotos;

  // 3. Process video URLs from dynamic list or single input
  const videoUrlEntries = [
    ...form.getAll("videoUrls").map(String),
    optional(form, "videoUrl"),
  ]
    .filter(Boolean)
    .map((s) => (s as string).trim())
    .filter((s) => s.length > 0);

  // Deduplicate maintaining input order
  const distinctVideoLinks = Array.from(new Set(videoUrlEntries));

  // Process optional direct video upload
  let uploadedVideoUrl: string | null = null;
  try {
    uploadedVideoUrl = await saveVideo(form.get("video"));
  } catch (error) {
    if (error instanceof UploadError) return { error: error.message };
    throw error;
  }

  const hasVideoSubmission =
    form.has("videoUrls") || form.has("videoUrl") || form.has("video");

  const existingAllVideos =
    existing.videoUrls && existing.videoUrls.length > 0
      ? existing.videoUrls
      : existing.videoUrl
        ? [existing.videoUrl]
        : [];

  let allVideoUrls = existingAllVideos;
  if (hasVideoSubmission) {
    allVideoUrls = uploadedVideoUrl
      ? [uploadedVideoUrl, ...distinctVideoLinks]
      : distinctVideoLinks;
  }

  await db.guest.update({
    where: { id },
    data: {
      name,
      honorific: optional(form, "honorific"),
      tableName: optional(form, "tableName"),
      message: optional(form, "message"),
      photoUrl: allPhotoUrls[0] ?? null,
      videoUrl: allVideoUrls[0] ?? null,
      photoUrls: allPhotoUrls,
      videoUrls: allVideoUrls,
    },
  });

  // Clean up any uploaded photos that were removed
  const oldPhotoSet = new Set(existingAllPhotos);
  for (const oldPhoto of oldPhotoSet) {
    if (!allPhotoUrls.includes(oldPhoto)) {
      await deleteUpload(oldPhoto);
    }
  }

  // Clean up any uploaded videos that were removed
  const oldVideoSet = new Set(existingAllVideos);
  for (const oldVideo of oldVideoSet) {
    if (!allVideoUrls.includes(oldVideo)) {
      await deleteUpload(oldVideo);
    }
  }

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}/guests/${id}`);
  revalidatePath(`/admin/events/${eventId}/cards`);
  if (existing.code) {
    revalidatePath(`/g/${existing.code}`);
  }
  return { ok: "Guest saved." };
}

export async function clearGuestMedia(form: FormData) {
  const id = text(form, "id");
  const eventId = text(form, "eventId");
  const field = text(form, "field");
  const targetUrl = optional(form, "url");

  const existing = await db.guest.findUnique({
    where: { id },
    select: { photoUrl: true, videoUrl: true, photoUrls: true, videoUrls: true },
  });
  if (!existing) return;

  if (field === "photo") {
    if (targetUrl) {
      const currentList =
        existing.photoUrls && existing.photoUrls.length > 0
          ? existing.photoUrls
          : existing.photoUrl
            ? [existing.photoUrl]
            : [];
      const remaining = currentList.filter((u) => u !== targetUrl);

      await db.guest.update({
        where: { id },
        data: {
          photoUrls: remaining,
          photoUrl: remaining[0] ?? null,
        },
      });
      await deleteUpload(targetUrl);
    } else {
      await db.guest.update({
        where: { id },
        data: { photoUrls: [], photoUrl: null },
      });
      await deleteUploads([existing.photoUrl, ...existing.photoUrls]);
    }
  } else if (field === "video") {
    if (targetUrl) {
      const currentList =
        existing.videoUrls && existing.videoUrls.length > 0
          ? existing.videoUrls
          : existing.videoUrl
            ? [existing.videoUrl]
            : [];
      const remaining = currentList.filter((u) => u !== targetUrl);

      await db.guest.update({
        where: { id },
        data: {
          videoUrls: remaining,
          videoUrl: remaining[0] ?? null,
        },
      });
      await deleteUpload(targetUrl);
    } else {
      await db.guest.update({
        where: { id },
        data: { videoUrls: [], videoUrl: null },
      });
      await deleteUploads([existing.videoUrl, ...existing.videoUrls]);
    }
  }

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}/guests/${id}`);
}

export async function deleteGuest(form: FormData) {
  const id = text(form, "id");
  const eventId = text(form, "eventId");

  const existing = await db.guest.findUnique({
    where: { id },
    select: { photoUrl: true, videoUrl: true, photoUrls: true, videoUrls: true },
  });

  await db.guest.delete({ where: { id } });
  if (existing) {
    await deleteUploads([
      existing.photoUrl,
      existing.videoUrl,
      ...existing.photoUrls,
      ...existing.videoUrls,
    ]);
  }

  revalidatePath(`/admin/events/${eventId}`);
  redirect(`/admin/events/${eventId}`);
}
