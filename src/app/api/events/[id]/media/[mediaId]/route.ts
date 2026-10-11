import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteUpload } from "@/lib/uploads";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/events/[id]/media/[mediaId]
 * Removes an uploaded media entry and deletes its file from storage.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  const { id: eventId, mediaId } = await params;

  try {
    const item = await db.eventMedia.findUnique({
      where: { id: mediaId },
      select: { id: true, eventId: true, url: true },
    });

    if (!item || item.eventId !== eventId) {
      return NextResponse.json({ error: "Media record not found." }, { status: 404 });
    }

    // Delete DB record
    await db.eventMedia.delete({
      where: { id: mediaId },
    });

    // Clean up physical file from storage driver
    await deleteUpload(item.url);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete event media:", error);
    return NextResponse.json(
      { error: "Could not delete media record." },
      { status: 500 }
    );
  }
}
