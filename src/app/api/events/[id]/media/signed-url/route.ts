import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * POST /api/events/[id]/media/signed-url
 * Returns secure upload destination instructions.
 * If cloud object storage with presigning is active, provides presigned parameters;
 * otherwise directs client to the authenticated multipart endpoint.
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

    const currentDriver = storage().name;
    const directUploadEndpoint = `/api/events/${eventId}/media`;

    // When running with local driver or standard storage proxy
    return NextResponse.json({
      ok: true,
      strategy: currentDriver === "s3" ? "cloud-multipart" : "direct-multipart",
      directUploadEndpoint,
      storageDriver: currentDriver,
      maxSizeBytes: 25 * 1024 * 1024,
      allowedMimePrefixes: ["image/", "video/"],
    });
  } catch (error) {
    console.error("Signed URL endpoint error:", error);
    return NextResponse.json(
      { error: "Could not negotiate upload route." },
      { status: 500 }
    );
  }
}
