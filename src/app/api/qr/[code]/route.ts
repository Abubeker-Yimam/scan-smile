import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { guestUrl } from "@/lib/codes";

export const runtime = "nodejs";

/**
 * The printable code for one guest.
 *   /api/qr/ABC1234              → 1024px PNG for the screen
 *   /api/qr/ABC1234?size=2400    → press-ready PNG
 *   /api/qr/ABC1234?format=svg   → vector, for anything going to a printer
 *   /api/qr/ABC1234?download=1   → same image, as a file
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const normalized = code.toUpperCase();

  let guest = await db.guest
    .findUnique({
      where: { code: normalized },
      select: { name: true },
    })
    .catch(() => null);

  // Fallback for demo code so landing page never displays a broken image
  if (!guest && normalized === "DEMO247") {
    guest = { name: "Sara Megersa" };
  }

  if (!guest) {
    return NextResponse.json({ error: "No guest has this code." }, { status: 404 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "svg" ? "svg" : "png";
  const size = Math.min(Math.max(Number(url.searchParams.get("size")) || 1024, 128), 4000);
  const download = url.searchParams.get("download") === "1";

  const options = {
    errorCorrectionLevel: "Q" as const,
    margin: 2,
    width: size,
    color: { dark: "#14100DFF", light: "#FFFFFFFF" },
  };

  const filename = `${normalized}-${guest.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.${format}`;
  const disposition = `${download ? "attachment" : "inline"}; filename="${filename}"`;

  if (format === "svg") {
    const svg = await QRCode.toString(guestUrl(normalized), { ...options, type: "svg" });
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": disposition,
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  const png = await QRCode.toBuffer(guestUrl(normalized), { ...options, type: "png" });
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": disposition,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
