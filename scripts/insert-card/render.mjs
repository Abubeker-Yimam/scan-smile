import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";

const run = promisify(execFile);

const MM_PER_INCH = 25.4;
const CSS_PX_PER_MM = 96 / MM_PER_INCH;

/**
 * Turning the SVG into files a printer will accept.
 *
 * A headless Chromium does the rendering rather than sharp, for one reason:
 * fonts. librsvg resolves family names through fontconfig and silently falls
 * back when it misses, which on Windows means an elegant script name quietly
 * prints as Georgia. Chromium resolves the same names the browser does, embeds
 * a subset of each face into the PDF, and rasterises with the glyphs actually
 * asked for.
 */

const CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/microsoft-edge",
];

let cached;

export function findBrowser() {
  if (cached !== undefined) return cached;
  cached = CANDIDATES.find((candidate) => candidate && existsSync(candidate)) ?? null;
  return cached;
}

export const mmToPx = (mm, dpi) => Math.round((mm / MM_PER_INCH) * dpi);

/** The SVG, wrapped so that the page Chromium prints is exactly the media box. */
function page(svg, media) {
  return `<!doctype html><meta charset="utf-8"><style>
@page { size: ${media.w}mm ${media.h}mm; margin: 0 }
html, body { margin: 0; padding: 0; background: transparent }
svg { display: block }
</style>${svg}`;
}

/**
 * Writes the requested formats for one card. Returns the paths written.
 *
 * Each call gets its own browser profile directory, so several cards can render
 * at once and none of them collide with a Chrome the user already has open.
 */
export async function renderCard({ svg, media, outPath, formats, dpi }) {
  const written = [];

  if (formats.includes("svg")) {
    await writeFile(`${outPath}.svg`, svg, "utf8");
    written.push(`${outPath}.svg`);
  }

  const wantsPdf = formats.includes("pdf");
  const wantsPng = formats.includes("png");
  if (!wantsPdf && !wantsPng) return written;

  const browser = findBrowser();
  if (!browser) {
    throw new Error(
      "No Chromium-based browser found for PDF/PNG output. Set CHROME_PATH to a Chrome " +
        "or Edge binary, or pass --format svg to write vector artwork only."
    );
  }

  const work = await mkdtemp(path.join(tmpdir(), "insert-card-"));
  try {
    const html = path.join(work, "card.html");
    await writeFile(html, page(svg, media), "utf8");

    const common = [
      "--headless",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--hide-scrollbars",
      `--user-data-dir=${path.join(work, "profile")}`,
    ];

    if (wantsPdf) {
      await run(browser, [
        ...common,
        "--no-pdf-header-footer",
        "--print-to-pdf-no-header",
        `--print-to-pdf=${outPath}.pdf`,
        `file://${html.replace(/\\/g, "/")}`,
      ]);
      written.push(`${outPath}.pdf`);
    }

    if (wantsPng) {
      // Chromium works in CSS pixels, which are integers, so the shot lands a
      // fraction off the exact pixel count for the media size. sharp then
      // resizes to the exact figure and — the part print software actually
      // reads — stamps the DPI into the PNG header.
      const shot = path.join(work, "shot.png");
      const cssWidth = Math.round(media.w * CSS_PX_PER_MM);
      const cssHeight = Math.round(media.h * CSS_PX_PER_MM);
      await run(browser, [
        ...common,
        `--screenshot=${shot}`,
        `--window-size=${cssWidth},${cssHeight}`,
        `--force-device-scale-factor=${dpi / 96}`,
        "--default-background-color=00000000",
        `file://${html.replace(/\\/g, "/")}`,
      ]);

      await sharp(await readFile(shot))
        .resize(mmToPx(media.w, dpi), mmToPx(media.h, dpi), { fit: "fill" })
        .withMetadata({ density: dpi })
        .png()
        .toFile(`${outPath}.png`);
      written.push(`${outPath}.png`);
    }
  } finally {
    await rm(work, { recursive: true, force: true });
  }

  return written;
}
