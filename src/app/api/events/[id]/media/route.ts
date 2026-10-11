import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { saveGuestMedia, UploadError } from "@/lib/uploads";
import { GUEST_MEDIA_MAX_VIDEO_DURATION_SECONDS } from "@/lib/upload-limits";

export const dynamic = "force-dynamic";

/**
 * GET /api/events/[id]/media
 * Fetches all media captured by guests for a given event.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const { searchParams } = new URL(request.url);
  const guestId = searchParams.get("guestId");

  try {
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const media = await db.eventMedia.findMany({
      where: {
        eventId,
        ...(guestId ? { guestId } : {}),
      },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            honorific: true,
            code: true,
            tableName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, media });
  } catch (error) {
    console.error("Failed to load event media:", error);
    return NextResponse.json(
      { error: "Could not retrieve media for this event." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events/[id]/media
 * Direct multipart upload endpoint for attendees capturing photos and short videos.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;

  try {
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const guestIdOrCode = (form.get("guestId") as string | null)?.trim() || null;
    const caption = (form.get("caption") as string | null)?.trim() || null;
    const rawDuration = form.get("duration");
    const parsed = rawDuration ? parseFloat(String(rawDuration)) : null;
    const duration =
      parsed !== null && isFinite(parsed) && !isNaN(parsed) && parsed > 0
        ? parsed
        : null;

    if (duration !== null && duration > GUEST_MEDIA_MAX_VIDEO_DURATION_SECONDS + 2) {
      return NextResponse.json(
        {
          error: `Video length exceeds maximum allowed duration (${GUEST_MEDIA_MAX_VIDEO_DURATION_SECONDS} seconds).`,
        },
        { status: 400 }
      );
    }

    // Resolve guest if code or ID passed
    let resolvedGuestId: string | null = null;
    if (guestIdOrCode) {
      const guest = await db.guest.findFirst({
        where: {
          eventId,
          OR: [{ id: guestIdOrCode }, { code: guestIdOrCode.toUpperCase() }],
        },
        select: { id: true },
      });
      if (guest) {
        resolvedGuestId = guest.id;
      }
    }

    // Store media securely
    const saved = await saveGuestMedia(file);

    // Record in database
    const record = await db.eventMedia.create({
      data: {
        eventId,
        guestId: resolvedGuestId,
        mediaType: saved.mediaType,
        url: saved.url,
        caption: caption ? caption.slice(0, 500) : null,
        mimeType: saved.mimeType,
        fileSize: saved.fileSize,
        duration: duration !== null && !isNaN(duration) ? duration : null,
      },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            honorific: true,
            code: true,
            tableName: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, media: record }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Media upload error:", error);
    const message = error instanceof Error ? error.message : "Upload failed due to a server error. Please try again.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
