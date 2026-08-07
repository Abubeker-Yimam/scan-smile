import { randomInt } from "crypto";

/**
 * No 0/O, 1/I/L, 5/S, U/V — the code is printed under the QR so a host can
 * read it off a card and find the guest, and it gets read out loud at tables.
 */
const ALPHABET = "ABCDEFGHJKMNPQRTWXY2346789";

export function generateCode(length = 7): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

/** Absolute URL a guest's QR code points at. */
export function guestUrl(code: string): string {
  const base = (process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/g/${code}`;
}
