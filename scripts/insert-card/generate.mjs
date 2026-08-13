import { mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCard } from "../../src/lib/insert-card/artwork.mjs";
import { findBrowser, mmToPx, renderCard } from "./render.mjs";

/**
 * Next loads .env for us; plain node does not. Without this the QR destination
 * falls back to localhost — which on a phone is the phone — and --from-event has
 * no DATABASE_URL to read guests with. Anything already exported wins, so
 * `APP_BASE_URL=… npm run inserts` still overrides the file.
 */
const ENV_FILE = path.join(process.cwd(), ".env");
if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

/**
 * The script face ships with the app (OFL, licence alongside it).
 *
 * Naming a family the machine does not have is the one failure here that looks
 * like success: Chromium silently falls back, and a run of fifty cards comes
 * out set in Gabriola, which nobody notices until they are printed. Embedding
 * a known file by default means the flag is for changing the face, not for
 * getting the right one.
 *
 * It lives in public/ because the admin print page serves it to a browser over
 * @font-face. One file, so the sheet a host prints and the PDF a shop prints
 * cannot drift apart.
 */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const BUNDLED_SCRIPT = path.join(HERE, "..", "..", "public", "fonts", "GreatVibes-Regular.ttf");

function bundledScript() {
  if (existsSync(BUNDLED_SCRIPT)) return BUNDLED_SCRIPT;
  process.stdout.write(
    `The bundled script face is missing from ${path.relative(process.cwd(), BUNDLED_SCRIPT)}, ` +
      `so names will be set in whatever cursive this machine happens to have. Pass ` +
      `--script-file to name one.\n\n`
  );
  return null;
}

/**
 * One print-ready insert per guest.
 *
 *   node scripts/insert-card/generate.mjs --names guests.txt
 *   node scripts/insert-card/generate.mjs --from-event <eventId>
 *   node scripts/insert-card/generate.mjs --name Lina --url https://example.com/g/ABC1234
 *
 * Run with --help for the full set of options.
 */

const USAGE = `
Guests — pick one
  --names <file>        One guest per line: "Name", "Name,CODE" or "Name,https://..."
                        Blank lines and lines starting with # are skipped.
  --from-event <id>     Read this event's guests, and their codes, from the database.
  --name <name>         A single card.

QR destination
  --url <template>      Default: $APP_BASE_URL/g/{code}
                        {code} takes each guest's code, {name} their name, URL-encoded.
                        A full URL in the second field of a --names line overrides it.
  --qr-invert           Dark code on a white panel instead of gold on black.

Size
  --width <mm>          Trim width. Default 100.
  --height <mm>         Trim height. Default 140.
  --bleed <mm>          Artwork past the trim, on every side. Default 3.
  --dpi <n>             For the PNG. Default 300.

Copy
  --headline <text>     Default "Scan & Smile".
  --tagline <text>      Default "Scan. Smile. Create memories."
  --dear <text>         Word above the name. Default "Dear". Empty to drop it.
  --thanks <a|b>        Two closing lines, separated by "|".
  --footer <icon:text>  Contact row shown instead of the closing lines. Repeatable,
                        up to two. Icons: instagram, phone, whatsapp, web.

Look
  --gold <hex>          Default #C9A227.
  --background <hex>    Default #000000.
  --flat-gold           Drop the metallic gradient in favour of one flat gold.
  --serif <stack>       Font stack for everything but the name.
  --script <stack>      Font stack for the name.
  --serif-file <path>   Embed a .ttf/.otf/.woff2 and use it for the serif.
  --script-file <path>  Embed a .ttf/.otf/.woff2 and use it for the name.
                        Defaults to the Great Vibes bundled beside this script.
  --name-size <mm>      Cap height of the name. It is shrunk to fit regardless.

Output
  --out <dir>           Default out/inserts.
  --format <list>       Comma-separated: pdf, png, svg. Default pdf,png.
  --guides              Draw the trim line, for proofing. Never for print.
  --concurrency <n>     Cards rendered at once. Default 4.
  --config <file.json>  Defaults for any of the above; command line wins.
`;

const FLAGS = new Set(["--qr-invert", "--flat-gold", "--guides", "--help", "-h"]);
const REPEATABLE = new Set(["--footer"]);
/** Anything not on this list is a typo, and a silently ignored typo prints a wrong card. */
const KNOWN = new Set([
  ...FLAGS,
  ...REPEATABLE,
  "--names", "--from-event", "--name", "--url",
  "--width", "--height", "--bleed", "--dpi",
  "--headline", "--tagline", "--dear", "--thanks",
  "--gold", "--background", "--serif", "--script",
  "--serif-file", "--script-file", "--name-size",
  "--out", "--format", "--concurrency", "--config",
]);

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--") && arg !== "-h") throw new Error(`Unexpected argument: ${arg}`);
    const key = arg === "-h" ? "--help" : arg;
    if (!KNOWN.has(key)) throw new Error(`Unknown option ${key}. Run with --help for the list.`);
    if (FLAGS.has(key)) {
      out[key] = true;
      continue;
    }
    const value = argv[++i];
    if (value === undefined) throw new Error(`${key} needs a value`);
    if (REPEATABLE.has(key)) (out[key] ??= []).push(value);
    else out[key] = value;
  }
  return out;
}

const number = (value, fallback) => {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Expected a number, got "${value}"`);
  return parsed;
};

const FONT_FORMATS = { ".ttf": "truetype", ".otf": "opentype", ".woff2": "woff2", ".woff": "woff" };

/**
 * Embeds a font file into the artwork.
 *
 * Naming the family is not enough for a file that has to survive being emailed
 * to a print shop: the SVG opens there too, on a machine that has never heard
 * of the typeface. Base64 in an @font-face travels with it.
 */
async function embedFont(file, family) {
  const extension = path.extname(file).toLowerCase();
  const format = FONT_FORMATS[extension];
  if (!format) {
    throw new Error(`Unsupported font file "${file}" — use .ttf, .otf, .woff or .woff2`);
  }
  const base64 = (await readFile(file)).toString("base64");
  const mime = format === "truetype" ? "font/ttf" : format === "opentype" ? "font/otf" : `font/${format}`;
  return `@font-face{font-family:'${family}';src:url(data:${mime};base64,${base64}) format('${format}');font-weight:100 900;font-display:block}`;
}

function parseNames(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const [name, second] = line.split(",").map((part) => part?.trim());
      if (!name) throw new Error(`Could not read a name from "${line}"`);
      if (!second) return { name };
      return /^https?:\/\//i.test(second) ? { name, url: second } : { name, code: second };
    });
}

/**
 * Talks to Prisma directly rather than through src/lib/db.ts — that module is
 * TypeScript, and this script has to keep running under plain node.
 */
async function guestsFromEvent(eventId) {
  const { PrismaClient } = await import("@prisma/client");
  // The unpooled connection, for the same reason migrations use it: this is a
  // one-shot batch job run from a laptop, not a request being served. A
  // transaction pooler sized for the web app will happily refuse the one
  // connection this needs, and refusing it here costs a whole print run.
  const db = new PrismaClient({
    datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
  });
  try {
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: { guests: { orderBy: [{ tableName: "asc" }, { name: "asc" }] } },
    });
    if (!event) throw new Error(`No event with id ${eventId}`);
    if (event.guests.length === 0) throw new Error(`Event "${event.title}" has no guests yet`);
    return event.guests.map((guest) => ({ name: guest.name, code: guest.code }));
  } finally {
    await db.$disconnect();
  }
}

function resolveUrl(guest, template) {
  if (guest.url) return guest.url;
  if (template.includes("{code}") && !guest.code) {
    throw new Error(
      `${guest.name} has no code, and --url contains {code}. Give the line a code ` +
        `("${guest.name},ABC1234"), or pass a --url without {code}.`
    );
  }
  return template
    .replace(/\{code\}/g, encodeURIComponent(guest.code ?? ""))
    .replace(/\{name\}/g, encodeURIComponent(guest.name));
}

const slug = (value) =>
  value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase() || "guest";

/** Distinct file stems, in list order, so two Linas do not overwrite each other. */
function stems(guests) {
  const pad = String(guests.length).length;
  const seen = new Map();
  return guests.map((guest, index) => {
    const base = slug(guest.name);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    const suffix = count > 1 ? `-${count}` : "";
    return `${String(index + 1).padStart(pad, "0")}-${base}${suffix}`;
  });
}

function parseFooter(entries) {
  return entries.map((entry) => {
    const at = entry.indexOf(":");
    if (at < 1) throw new Error(`--footer wants "icon:text", got "${entry}"`);
    return { icon: entry.slice(0, at).trim().toLowerCase(), text: entry.slice(at + 1).trim() };
  });
}

/** Runs tasks with a ceiling on how many are in flight, keeping results in order. */
async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

async function main() {
  const cli = parseArgs(process.argv.slice(2));
  if (cli["--help"]) {
    process.stdout.write(`${USAGE}\n`);
    return;
  }

  const fileConfig = cli["--config"]
    ? JSON.parse(await readFile(cli["--config"], "utf8"))
    : {};
  const opt = (key, fallback) => cli[`--${key}`] ?? fileConfig[key] ?? fallback;

  // Guests.
  let guests;
  if (opt("names")) guests = parseNames(await readFile(opt("names"), "utf8"));
  else if (opt("from-event")) guests = await guestsFromEvent(opt("from-event"));
  else if (opt("name")) guests = [{ name: opt("name"), url: cli["--url"] ?? fileConfig.url }];
  else throw new Error(`Nothing to make cards for. Pass --names, --from-event or --name.\n${USAGE}`);

  if (guests.length === 0) throw new Error("No guests found — the list is empty.");

  const base = (process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const template = opt("url", `${base}/g/{code}`);

  // Fonts.
  const faces = [];
  const fonts = {};
  const serifFile = opt("serif-file");
  // --script names a family instead of a file, so it opts out of the bundle.
  const scriptFile = opt("script-file") ?? (opt("script") ? null : bundledScript());
  if (serifFile) {
    faces.push(await embedFont(serifFile, "Insert Serif"));
    fonts.serif = `'Insert Serif', Georgia, serif`;
  }
  if (scriptFile) {
    faces.push(await embedFont(scriptFile, "Insert Script"));
    fonts.script = `'Insert Script', Gabriola, cursive`;
  }
  if (opt("serif")) fonts.serif = opt("serif");
  if (opt("script")) fonts.script = opt("script");

  const thanks = opt("thanks");
  const footer = parseFooter(cli["--footer"] ?? fileConfig.footer ?? []);
  const design = {
    width: number(opt("width"), 100),
    height: number(opt("height"), 140),
    bleed: number(opt("bleed"), 3),
    gold: opt("gold", "#C9A227"),
    background: opt("background", "#000000"),
    flatGold: Boolean(opt("flat-gold", false)),
    qrInvert: Boolean(opt("qr-invert", false)),
    guides: Boolean(opt("guides", false)),
    fonts,
    fontFaces: faces.join(""),
    footer,
    ...(opt("headline") ? { headline: opt("headline") } : {}),
    ...(opt("tagline") ? { tagline: opt("tagline") } : {}),
    ...(opt("dear") !== undefined ? { dearLabel: opt("dear") } : {}),
    ...(thanks ? { thankYou: String(thanks).split("|").map((line) => line.trim()) } : {}),
    ...(opt("name-size") ? { nameSize: number(opt("name-size")) } : {}),
  };

  const dpi = number(opt("dpi"), 300);
  const formats = String(opt("format", "pdf,png"))
    .split(",")
    .map((format) => format.trim().toLowerCase())
    .filter(Boolean);
  const unknown = formats.filter((format) => !["pdf", "png", "svg"].includes(format));
  if (unknown.length) throw new Error(`Unknown format: ${unknown.join(", ")}`);

  const outDir = path.resolve(opt("out", path.join("out", "inserts")));
  await mkdir(outDir, { recursive: true });

  if ((formats.includes("pdf") || formats.includes("png")) && !findBrowser()) {
    throw new Error(
      "PDF and PNG output need a Chromium-based browser and none was found.\n" +
        "Set CHROME_PATH to a Chrome or Edge binary, or pass --format svg."
    );
  }

  const names = stems(guests);
  const cards = guests.map((guest, index) => {
    const card = buildCard({ ...design, name: guest.name, url: resolveUrl(guest, template) });
    return { ...card, stem: names[index], guest };
  });

  const tight = cards.find((card) => card.qr.moduleSize < 0.5);
  const concurrency = Math.max(1, number(opt("concurrency"), 4));

  const media = cards[0].media;
  const firstUrl = resolveUrl(guests[0], template);
  process.stdout.write(
    `${cards.length} ${cards.length === 1 ? "card" : "cards"} · ` +
      `${design.width}×${design.height}mm trim, ${design.bleed}mm bleed → ` +
      `${media.w}×${media.h}mm (${mmToPx(media.w, dpi)}×${mmToPx(media.h, dpi)}px at ${dpi} DPI)\n` +
      `${formats.join(", ")} → ${outDir}\n` +
      // The one thing worth reading before a run of two hundred: a card with the
      // wrong URL on it is scrap, and it looks perfect until someone scans it.
      `QR → ${firstUrl}${cards.length > 1 ? ` (${guests[0].name}'s)` : ""}\n\n`
  );

  if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(firstUrl)) {
    process.stdout.write(
      `Careful: that URL is localhost, which on a phone means the phone itself — these codes ` +
        `will not open for anyone. Set APP_BASE_URL to your public URL, or pass --url. Fine if ` +
        `you are only checking the artwork.\n\n`
    );
  }

  let done = 0;
  await pool(cards, concurrency, async (card) => {
    await renderCard({
      svg: card.svg,
      media: card.media,
      outPath: path.join(outDir, card.stem),
      formats,
      dpi,
    });
    done++;
    process.stdout.write(`  ${String(done).padStart(String(cards.length).length)}/${cards.length}  ${card.stem}\n`);
  });

  process.stdout.write(`\nDone. ${done * formats.length} files in ${outDir}\n`);

  if (tight) {
    process.stdout.write(
      `\nHeads up: the code is ${tight.qr.modules} modules wide, which puts each one at ` +
        `${tight.qr.moduleSize.toFixed(2)}mm. Under 0.5mm a phone starts to struggle with a ` +
        `printed code — shorten the URL, or grow the card.\n`
    );
  }
  if (!design.qrInvert) {
    process.stdout.write(
      `\nThe code prints gold on black, matching the reference. That is an inverted code: ` +
        `current iPhone and Android cameras read it, older scanners may not. Print one and ` +
        `scan it before committing to the run — or pass --qr-invert for a conventional code.\n`
    );
  }
}

main().catch((error) => {
  process.stderr.write(`\n${error.message}\n`);
  process.exit(1);
});
