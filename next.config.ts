import type { NextConfig } from "next";
import { MB, VIDEO_MAX_BYTES } from "./src/lib/upload-limits";

/**
 * Server actions carry the whole multipart body, so this has to clear the
 * largest upload we accept plus the rest of the form. It is a backstop, not the
 * limit that matters: `src/lib/uploads.ts` rejects anything oversized with a
 * message a host can act on, whereas exceeding this fails the request outright.
 */
const bodySizeLimit = `${Math.ceil(VIDEO_MAX_BYTES / MB) + 6}mb` as `${number}mb`;

const nextConfig: NextConfig = {
  // Nothing is gained by advertising the framework version to a scanner.
  poweredByHeader: false,

  experimental: {
    serverActions: { bodySizeLimit },
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Guest pages carry names, photos and seating. Keeping them out of
          // search results is the difference between "unlisted" and "public".
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        // Uploads are served from a path an admin controls the contents of.
        // Forcing a download context stops anything that slipped through
        // validation from executing as a document on our origin.
        source: "/media/:path*",
        headers: [{ key: "Content-Security-Policy", value: "sandbox" }],
      },
    ];
  },
};

export default nextConfig;
