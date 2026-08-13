import QRCode from "qrcode";

/**
 * The insert artwork: one arch-shaped, gold-on-black card, as an SVG string.
 *
 * Pure — no I/O, no measuring, no browser. Everything is drawn in millimetres
 * (the viewBox is 1 unit = 1mm) so the same code produces a 100mm table insert
 * and a 210mm welcome sign without a second set of numbers.
 *
 * The card is drawn twice over: the black arch is the *bleed* arch, offset
 * outward by the bleed on every side, while the content is laid out on the trim
 * arch inside it. Offsetting an arch outward is the same construction at a
 * larger size — the dome is a semicircle of radius w/2, so growing the width by
 * 2·bleed grows the dome radius by exactly the bleed. That means one path
 * function covers both.
 */

/** Material's favourite icon, the cleanest heart in 24 units. Spans x 2→22, y 3→21.35. */
const HEART_D =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

/**
 * Where each element sits, as a fraction of the trim height, and how big it is,
 * as a fraction of the trim width. Tuned against the reference at 100×140mm;
 * every other size is this layout scaled, which holds up for anything near a
 * 1:1.4 arch.
 */
const LAYOUT = {
  qrTop: 0.121,
  qrSize: 0.34,
  bracketGap: 0.035,
  bracketArm: 0.08,
  bracketWeight: 0.007,
  headline: 0.486,
  headlineSize: 0.095,
  headlineTrack: 0.16,
  divider: 0.536,
  dividerRule: 0.18,
  dividerHeart: 0.032,
  tagline: 0.579,
  taglineSize: 0.027,
  taglineTrack: 0.3,
  dearSize: 0.046,
  // The name is placed by its ink box rather than by a baseline. A script face
  // draws far outside its point size — loops climb over the word above, tails
  // drop onto whatever sits below — and a baseline says nothing about either.
  // These two fractions are the band the drawn name is allowed to fill.
  nameTop: 0.638,
  nameBottom: 0.818,
  nameMaxWidth: 0.82,
  // Ink above and below the baseline, as a fraction of font size. Measured off
  // Great Vibes across A-Z and a-z — 0.861 and 0.400 — and rounded outward for
  // accents. Not the font's own yMax: that belongs to an ornamental glyph no
  // name contains, and reserving room for it costs the name a third of its
  // size. Measured across the alphabet rather than per name on purpose, so
  // fifty cards carry the name at one size in one place instead of each guest's
  // own letters deciding where the heart goes.
  nameInkAbove: 0.92,
  nameInkBelow: 0.42,
  // Clear space between that band and the "Dear" above it, and the heart below.
  nameGap: 0.02,
  heartSize: 0.036,
  thanks: [0.886, 0.929],
  thanksSize: 0.036,
  thanksLead: 0.043,
  footer: [0.879, 0.929],
  footerSize: 0.032,
  footerIcon: 0.045,
  footerGap: 0.022,
};

const escapeXml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]
  );

/** Trims trailing zeros so the SVG reads like something a person wrote. */
const n = (value) => {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? "0" : String(rounded);
};

function shiftHex(hex, amount) {
  const [, r, g, b] = /^#?(\w\w)(\w\w)(\w\w)$/.exec(hex.trim()) ?? [];
  if (!r) return hex;
  const move = (channel) => {
    const value = parseInt(channel, 16);
    const next = amount >= 0 ? value + (255 - value) * amount : value * (1 + amount);
    return Math.round(Math.min(255, Math.max(0, next)))
      .toString(16)
      .padStart(2, "0");
  };
  return `#${move(r)}${move(g)}${move(b)}`;
}

/**
 * The arch: straight sides, a semicircular dome, square bottom corners.
 */
function archPath(x, y, w, h) {
  const r = w / 2;
  return [
    `M${n(x)} ${n(y + h)}`,
    `L${n(x)} ${n(y + r)}`,
    `A${n(r)} ${n(r)} 0 0 1 ${n(x + w)} ${n(y + r)}`,
    `L${n(x + w)} ${n(y + h)}`,
    "Z",
  ].join(" ");
}

function heart(cx, cy, width, fill) {
  const k = width / 20;
  return `<path d="${HEART_D}" fill="${fill}" transform="translate(${n(cx - 12 * k)} ${n(
    cy - 12.175 * k
  )}) scale(${n(k)})"/>`;
}

/**
 * Centred text carrying letter-spacing.
 *
 * Tracking is added *after* the last glyph as well, which drags anchored-middle
 * text half a space to the left of where the eye expects it. Nudging x back by
 * half the tracking is the difference between "centred" and "centred enough to
 * notice".
 */
function centeredText(cx, baseline, text, { size, family, fill, track = 0, weight, style }) {
  const attrs = [
    `x="${n(cx + track / 2)}"`,
    `y="${n(baseline)}"`,
    `font-family="${escapeXml(family)}"`,
    `font-size="${n(size)}"`,
    `fill="${fill}"`,
    'text-anchor="middle"',
  ];
  if (track) attrs.push(`letter-spacing="${n(track)}"`);
  if (weight) attrs.push(`font-weight="${weight}"`);
  if (style) attrs.push(`font-style="${style}"`);
  return `<text ${attrs.join(" ")}>${escapeXml(text)}</text>`;
}

/** One L, rounded at the elbow. dx/dy point the arms away from the corner. */
function bracket(x, y, arm, dx, dy, weight, stroke) {
  const r = arm * 0.28;
  const d = [
    `M${n(x)} ${n(y + dy * arm)}`,
    `L${n(x)} ${n(y + dy * r)}`,
    `A${n(r)} ${n(r)} 0 0 ${dx * dy > 0 ? 1 : 0} ${n(x + dx * r)} ${n(y)}`,
    `L${n(x + dx * arm)} ${n(y)}`,
  ].join(" ");
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${n(
    weight
  )}" stroke-linecap="round"/>`;
}

/**
 * The QR, drawn module by module rather than handed over as a finished image.
 *
 * Doing it by hand is what buys the three things the reference design needs: a
 * gold-on-black code, rounded rings for the three finder patterns, and a hole
 * in the middle for the heart. Runs of adjacent dark modules in a row collapse
 * into one rect, which keeps the file small enough to open in Illustrator.
 */
function qrBlock({ url, x, y, size, dark, light, invert, heartFill, quiet = 2 }) {
  const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
  const count = qr.modules.size;
  const data = qr.modules.data;
  const module = size / (count + quiet * 2);
  const originX = x + quiet * module;
  const originY = y + quiet * module;

  const isFinder = (row, col) =>
    (row < 7 && col < 7) || (row < 7 && col >= count - 7) || (row >= count - 7 && col < 7);

  // Modules the heart sits on. Error correction level H recovers 30% of the
  // code, and this clears well under a tenth of it.
  const holeHalf = Math.ceil((count * 0.22) / 2);
  const middle = (count - 1) / 2;
  const inHole = (row, col) =>
    Math.abs(row - middle) < holeHalf && Math.abs(col - middle) < holeHalf;

  const parts = [];
  if (invert) {
    parts.push(
      `<rect x="${n(x)}" y="${n(y)}" width="${n(size)}" height="${n(size)}" rx="${n(
        module
      )}" fill="${light}"/>`
    );
  }

  const runs = [];
  for (let row = 0; row < count; row++) {
    let start = null;
    for (let col = 0; col <= count; col++) {
      const on =
        col < count && data[row * count + col] && !isFinder(row, col) && !inHole(row, col);
      if (on && start === null) start = col;
      if (!on && start !== null) {
        // Runs merge along a row but not down a column, so two stacked dark
        // modules meet on a boundary that lands mid-pixel when rasterised and
        // antialiases into a faint seam. A few per cent of overlap gives the
        // renderer nothing to blend. Far too small to reach a neighbouring
        // light module: at any sane card size it is a fraction of the ink dot.
        runs.push(
          `<rect x="${n(originX + start * module)}" y="${n(originY + row * module)}" width="${n(
            (col - start) * module
          )}" height="${n(module * 1.04)}"/>`
        );
        start = null;
      }
    }
  }
  parts.push(`<g fill="${dark}">${runs.join("")}</g>`);

  // The three finder patterns: a rounded ring and a rounded core, in place of
  // the seven-by-seven blocks. Every scanner reads these; styled codes in the
  // wild have used them for years.
  const finders = [
    [0, 0],
    [count - 7, 0],
    [0, count - 7],
  ];
  for (const [col, row] of finders) {
    const fx = originX + col * module;
    const fy = originY + row * module;
    parts.push(
      `<rect x="${n(fx + module / 2)}" y="${n(fy + module / 2)}" width="${n(
        module * 6
      )}" height="${n(module * 6)}" rx="${n(module * 1.75)}" fill="none" stroke="${dark}" stroke-width="${n(
        module
      )}"/>`,
      `<rect x="${n(fx + module * 2)}" y="${n(fy + module * 2)}" width="${n(
        module * 3
      )}" height="${n(module * 3)}" rx="${n(module * 0.9)}" fill="${dark}"/>`
    );
  }

  parts.push(heart(x + size / 2, y + size / 2, holeHalf * 1.5 * module, heartFill));

  return { svg: parts.join(""), modules: count, moduleSize: module };
}

const ICONS = {
  instagram: (stroke) =>
    `<rect x="2.6" y="2.6" width="18.8" height="18.8" rx="5.4" fill="none" stroke="${stroke}" stroke-width="1.9"/>` +
    `<circle cx="12" cy="12" r="4.9" fill="none" stroke="${stroke}" stroke-width="1.9"/>` +
    `<circle cx="17.6" cy="6.4" r="1.5" fill="${stroke}"/>`,
  phone: (stroke) =>
    `<path d="M6.9 11.1c1.2 2.4 3.6 4.8 6 6l2.1-2.1c.3-.3.8-.4 1.2-.3 1.2.4 2.5.6 3.8.6.6 0 1 .5 1 1V20c0 .6-.4 1-1 1C10 21 3 14 3 5.2c0-.6.4-1 1-1h3.3c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .9-.3 1.2l-1.7 1.9z" fill="${stroke}"/>`,
  whatsapp: (stroke) =>
    `<circle cx="12" cy="12" r="10.2" fill="none" stroke="${stroke}" stroke-width="1.8"/>` +
    `<path d="M9.4 11.6c.7 1.3 2 2.6 3.3 3.3l1.1-1.1c.2-.2.4-.2.6-.1.7.2 1.4.3 2.1.3.3 0 .5.3.5.6v1.5c0 .3-.2.6-.6.6-4.6 0-8.4-3.8-8.4-8.4 0-.3.2-.6.6-.6h1.6c.3 0 .5.2.5.6 0 .7.1 1.4.3 2.1.1.2 0 .5-.1.6l-1 1z" fill="${stroke}"/>`,
  web: (stroke) =>
    `<circle cx="12" cy="12" r="9.4" fill="none" stroke="${stroke}" stroke-width="1.8"/>` +
    `<path d="M2.6 12h18.8M12 2.6c2.6 2.6 3.9 6 3.9 9.4s-1.3 6.8-3.9 9.4c-2.6-2.6-3.9-6-3.9-9.4S9.4 5.2 12 2.6z" fill="none" stroke="${stroke}" stroke-width="1.8"/>`,
};

function icon(name, cx, cy, size, stroke) {
  const draw = ICONS[name] ?? ICONS.web;
  const k = size / 24;
  return `<g transform="translate(${n(cx - 12 * k)} ${n(cy - 12 * k)}) scale(${n(
    k
  )})" stroke-linecap="round" stroke-linejoin="round">${draw(stroke)}</g>`;
}

/**
 * Rough width of a rendered string, in the text's own units.
 *
 * Only ever used to decide whether a long name has to be set smaller, and only
 * ever downward, so being approximate costs nothing: a name that fits is left
 * at full size and a name that doesn't is shrunk until the estimate clears.
 */
function estimateWidth(text, size, perGlyph) {
  return text.length * size * perGlyph;
}

export function buildCard(config) {
  const {
    name = "",
    url,
    width = 100,
    height = 140,
    bleed = 3,
    gold = "#C9A227",
    background = "#000000",
    flatGold = false,
    headline = "Scan & Smile",
    tagline = "Scan. Smile. Create memories.",
    dearLabel = "Dear",
    thankYou = ["Thank you for being", "a special part of our day."],
    footer = [],
    fonts = {},
    fontFaces = "",
    qrInvert = false,
    nameSize,
    guides = false,
  } = config;

  const serif = fonts.serif ?? "'Cormorant Garamond', 'Cinzel', Georgia, 'Times New Roman', serif";
  const script =
    fonts.script ??
    "'Great Vibes', 'Parisienne', 'French Script MT', Gabriola, 'Apple Chancery', cursive";

  const media = { w: width + bleed * 2, h: height + bleed * 2 };
  const cx = media.w / 2;
  // Trim-space helpers: content is placed on the trim card, which sits one
  // bleed in from the media edge.
  const tx = (fraction) => bleed + fraction * width;
  const ty = (fraction) => bleed + fraction * height;
  const sw = (fraction) => fraction * width;

  const goldFill = flatGold ? gold : "url(#gold)";
  const defs = [
    `<clipPath id="bleedArch"><path d="${archPath(0, 0, media.w, media.h)}"/></clipPath>`,
  ];
  if (!flatGold) {
    defs.push(
      `<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0" stop-color="${shiftHex(gold, 0.45)}"/>` +
        `<stop offset="0.42" stop-color="${gold}"/>` +
        `<stop offset="0.6" stop-color="${shiftHex(gold, 0.34)}"/>` +
        `<stop offset="1" stop-color="${shiftHex(gold, -0.22)}"/>` +
        `</linearGradient>`
    );
  }

  const body = [];

  // Ground: the arch, grown by the bleed on every side, so trimming on the
  // arch line can never expose paper.
  body.push(`<path d="${archPath(0, 0, media.w, media.h)}" fill="${background}"/>`);

  // 1 & 2 — the code, and the four brackets framing it.
  const qrSize = sw(LAYOUT.qrSize);
  const qrX = cx - qrSize / 2;
  const qrY = ty(LAYOUT.qrTop);
  const code = qrBlock({
    url,
    x: qrX,
    y: qrY,
    size: qrSize,
    dark: qrInvert ? background : gold,
    light: "#ffffff",
    invert: qrInvert,
    heartFill: qrInvert ? background : gold,
  });
  body.push(code.svg);

  const gap = sw(LAYOUT.bracketGap);
  const arm = sw(LAYOUT.bracketArm);
  const weight = sw(LAYOUT.bracketWeight);
  const left = qrX - gap;
  const right = qrX + qrSize + gap;
  const top = qrY - gap;
  const bottom = qrY + qrSize + gap;
  body.push(
    bracket(left, top, arm, 1, 1, weight, goldFill),
    bracket(right, top, arm, -1, 1, weight, goldFill),
    bracket(left, bottom, arm, 1, -1, weight, goldFill),
    bracket(right, bottom, arm, -1, -1, weight, goldFill)
  );

  // 3 — the headline.
  const headlineSize = sw(LAYOUT.headlineSize);
  body.push(
    centeredText(cx, ty(LAYOUT.headline), headline.toUpperCase(), {
      size: headlineSize,
      family: serif,
      fill: goldFill,
      track: headlineSize * LAYOUT.headlineTrack,
      weight: 500,
    })
  );

  // 4 — the rule, broken by a heart.
  const ruleY = ty(LAYOUT.divider);
  const ruleSpan = sw(LAYOUT.dividerRule);
  const heartWidth = sw(LAYOUT.dividerHeart);
  const ruleGap = heartWidth * 1.6;
  // Flat gold, not the gradient: a horizontal line has no height, and a
  // gradient in bounding-box units over a box with no height paints nothing.
  body.push(
    `<g stroke="${gold}" stroke-width="${n(sw(0.0035))}" stroke-linecap="round">` +
      `<line x1="${n(cx - ruleGap - ruleSpan)}" y1="${n(ruleY)}" x2="${n(cx - ruleGap)}" y2="${n(
        ruleY
      )}"/>` +
      `<line x1="${n(cx + ruleGap)}" y1="${n(ruleY)}" x2="${n(cx + ruleGap + ruleSpan)}" y2="${n(
        ruleY
      )}"/>` +
      `</g>`,
    heart(cx, ruleY, heartWidth, goldFill)
  );

  // 5 — the tagline.
  const taglineSize = sw(LAYOUT.taglineSize);
  body.push(
    centeredText(cx, ty(LAYOUT.tagline), tagline.toUpperCase(), {
      size: taglineSize,
      family: serif,
      fill: goldFill,
      track: taglineSize * LAYOUT.taglineTrack,
    })
  );

  // 6 & 7 — "Dear", and the name it introduces.
  //
  // Both this label and the heart below sit against the edges of the name's
  // band, not against the name itself, so they land in the same place on every
  // card even when a long name has to be set smaller to fit the width.
  const nameGap = sw(LAYOUT.nameGap);
  const inkTop = ty(LAYOUT.nameTop);
  const inkBottom = name ? ty(LAYOUT.nameBottom) : inkTop;

  if (dearLabel) {
    body.push(
      centeredText(cx, inkTop - nameGap, dearLabel, {
        size: sw(LAYOUT.dearSize),
        family: serif,
        fill: goldFill,
      })
    );
  }

  if (name) {
    const inkSpan = LAYOUT.nameInkAbove + LAYOUT.nameInkBelow;
    // As large as the band allows, then smaller still if the name is long.
    const fitted = Math.min(nameSize ?? Infinity, (inkBottom - inkTop) / inkSpan);
    const maxWidth = sw(LAYOUT.nameMaxWidth);
    const estimated = estimateWidth(name, fitted, 0.42);
    const size = estimated > maxWidth ? (fitted * maxWidth) / estimated : fitted;
    // A shrunk name keeps the middle of the band rather than hugging its top.
    const baseline =
      inkTop + (inkBottom - inkTop - size * inkSpan) / 2 + size * LAYOUT.nameInkAbove;
    body.push(centeredText(cx, baseline, name, { size, family: script, fill: goldFill }));
  }

  // 8 — the small heart, clear of the tail of the name.
  const heartWidthBelow = sw(LAYOUT.heartSize);
  body.push(
    heart(cx, inkBottom + nameGap + heartWidthBelow * 0.459, heartWidthBelow, goldFill)
  );

  // 9 — the closing lines, or the contact rows standing in for them.
  if (footer.length > 0) {
    const size = sw(LAYOUT.footerSize);
    const iconSize = sw(LAYOUT.footerIcon);
    const iconGap = sw(LAYOUT.footerGap);
    footer.slice(0, LAYOUT.footer.length).forEach((row, index) => {
      const y = ty(LAYOUT.footer[index]);
      // Centre the icon and its label together, rather than the label alone.
      const textWidth = estimateWidth(row.text, size, 0.5);
      const start = cx - (iconSize + iconGap + textWidth) / 2;
      body.push(
        icon(row.icon, start + iconSize / 2, y - size * 0.34, iconSize, goldFill),
        `<text x="${n(start + iconSize + iconGap)}" y="${n(y)}" font-family="${escapeXml(
          serif
        )}" font-size="${n(size)}" fill="${goldFill}">${escapeXml(row.text)}</text>`
      );
    });
  } else {
    thankYou.slice(0, LAYOUT.thanks.length).forEach((line, index) => {
      body.push(
        centeredText(cx, ty(LAYOUT.thanks[index]), line, {
          size: sw(LAYOUT.thanksSize),
          family: serif,
          fill: goldFill,
        })
      );
    });
  }

  if (guides) {
    body.push(
      `<path d="${archPath(bleed, bleed, width, height)}" fill="none" stroke="#ff2d55" ` +
        `stroke-width="0.2" stroke-dasharray="1.5 1.5"/>`
    );
  }

  const style = fontFaces ? `<style>${fontFaces}</style>` : "";

  return {
    svg:
      `<svg xmlns="http://www.w3.org/2000/svg" width="${n(media.w)}mm" height="${n(
        media.h
      )}mm" viewBox="0 0 ${n(media.w)} ${n(media.h)}">` +
      `<title>${escapeXml(name ? `${headline} — ${name}` : headline)}</title>` +
      style +
      `<defs>${defs.join("")}</defs>` +
      `<g clip-path="url(#bleedArch)">${body.join("")}</g>` +
      `</svg>`,
    media,
    qr: { modules: code.modules, moduleSize: code.moduleSize },
  };
}
