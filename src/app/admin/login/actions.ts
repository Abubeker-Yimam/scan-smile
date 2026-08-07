"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminPassword, adminToken } from "@/lib/auth";

export async function signIn(
  _prev: { error?: string },
  form: FormData
): Promise<{ error?: string }> {
  const password = (form.get("password") as string | null) ?? "";
  const next = ((form.get("next") as string | null) ?? "/admin").startsWith("/admin")
    ? ((form.get("next") as string | null) ?? "/admin")
    : "/admin";

  const expected = adminPassword();
  if (!expected) {
    return {
      error: "No dashboard password is set. Add ADMIN_PASSWORD to .env and restart the server.",
    };
  }
  if (password !== expected) {
    return { error: "That password doesn't match. Check ADMIN_PASSWORD in .env" };
  }

  const token = await adminToken();
  if (!token) return { error: "No dashboard password is set." };

  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });

  redirect(next);
}

export async function signOut() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
