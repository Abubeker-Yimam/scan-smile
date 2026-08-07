import QRCode from "qrcode";

/**
 * Confirms the QR a guest will scan encodes the URL we think it does.
 *
 * Regenerates the code locally for each candidate URL and compares against what
 * the running server serves, so a wrong APP_BASE_URL is caught before anything
 * is printed.
 *
 *   node scripts/check-qr.mjs <server-origin> <code> <expected-url> [more-urls...]
 */
const [, , origin, code, ...candidates] = process.argv;

const served = await (await fetch(`${origin}/api/qr/${code}?format=svg`)).text();

const options = {
  errorCorrectionLevel: "Q",
  margin: 2,
  width: 1024,
  color: { dark: "#14100DFF", light: "#FFFFFFFF" },
  type: "svg",
};

let matched = null;
for (const url of candidates) {
  const local = await QRCode.toString(`${url}/g/${code}`, options);
  if (local === served) matched = url;
  console.log(`  ${local === served ? "MATCH  " : "no     "} ${url}/g/${code}`);
}

console.log(matched ? `\nQR encodes: ${matched}/g/${code}` : "\nQR matched none of the candidates");
process.exit(matched === candidates[0] ? 0 : 1);
