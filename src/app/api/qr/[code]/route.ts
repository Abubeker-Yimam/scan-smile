import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { guestUrl } from "@/lib/codes";

/**
 * GET /api/qr/[code]
 *
 * Returns a QR code image for a guest's unique code.
 *
 * Query params:
 *   size     — pixel size of the PNG (default: 600, max: 2400)
 *   format   — "png" (default) | "svg"
 *   download — if set to "1", adds Content-Disposition: attachment
 *
 * The code is looked up in the database so we can confirm it exists, but the
 * QR image itself is generated fresh each time — no storage cost, instant
 * re-generation if the base URL ever changes.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { searchParams } = request.nextUrl;

  const format = searchParams.get("format") === "svg" ? "svg" : "png";
  const download = searchParams.get("download") === "1";
  const rawSize = parseInt(searchParams.get("size") ?? "600", 10);
  const size = Math.min(Math.max(Number.isNaN(rawSize) ? 600 : rawSize, 64), 2400);

  // Verify the code exists. An unknown code returns 404 rather than generating
  // a QR that points at a dead page — a host copy-pasting a wrong code finds
  // out here rather than after printing.
  const guest = await db.guest.findUnique({
    where: { code: code.toUpperCase() },
    select: { id: true, name: true },
  });

  if (!guest) {
    return new NextResponse("Guest not found", { status: 404 });
  }

  const url = guestUrl(code.toUpperCase());

  const headers: Record<string, string> = {};

  if (format === "svg") {
    let svgString: string;
    try {
      svgString = await QRCode.toString(url, {
        type: "svg",
        errorCorrectionLevel: "H",
        margin: 2,
        color: { dark: "#14100d", light: "#faf7f0" },
      });
    } catch {
      return new NextResponse("QR generation failed", { status: 500 });
    }

    headers["Content-Type"] = "image/svg+xml";
    if (download) {
      headers["Content-Disposition"] = `attachment; filename="${code.toUpperCase()}.svg"`;
    }
    return new NextResponse(svgString, { headers });
  }

  // PNG — rendered to a Buffer via the canvas API built into the qrcode package
  let buffer: Buffer;
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      type: "image/png",
      errorCorrectionLevel: "H",
      margin: 2,
      width: size,
      color: { dark: "#14100d", light: "#faf7f0" },
    });
    // dataUrl is "data:image/png;base64,..."
    const base64 = dataUrl.split(",")[1];
    buffer = Buffer.from(base64, "base64");
  } catch {
    return new NextResponse("QR generation failed", { status: 500 });
  }

  headers["Content-Type"] = "image/png";
  // Cache for 5 minutes — codes don't change, but BASE_URL can be reconfigured
  headers["Cache-Control"] = "public, max-age=300, stale-while-revalidate=60";
  if (download) {
    headers["Content-Disposition"] = `attachment; filename="${code.toUpperCase()}.png"`;
  }

  // Buffer is not directly assignable to BodyInit in strict TS; Uint8Array is.
  // new Uint8Array(buffer) shares the underlying ArrayBuffer — no copy.
  return new NextResponse(new Uint8Array(buffer), { headers });
}
