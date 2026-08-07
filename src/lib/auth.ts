export const ADMIN_COOKIE = "smile_admin";

/**
 * The one password guarding the dashboard, or null when ADMIN_PASSWORD is
 * unset. There is deliberately no fallback value: a deployment that forgets
 * the variable locks everyone out rather than opening to a default everyone
 * can read in this file.
 */
export function adminPassword(): string | null {
  const secret = process.env.ADMIN_PASSWORD;
  return secret && secret.length > 0 ? secret : null;
}

/**
 * The cookie carries a digest of the password rather than the password itself,
 * so middleware can check a session without a database round trip.
 *
 * Returns null when no password is configured, which no cookie can ever match.
 */
export async function adminToken(): Promise<string | null> {
  const secret = adminPassword();
  if (!secret) return null;

  const data = new TextEncoder().encode(`scan-and-smile::${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
