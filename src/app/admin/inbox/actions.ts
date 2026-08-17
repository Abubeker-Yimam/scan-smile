"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

/**
 * Enquiries are answered outside this app — by email, by phone, in person. All
 * the dashboard can usefully do is remember which ones have been dealt with.
 */
export async function setInquiryHandled(form: FormData) {
  const id = (form.get("id") as string | null)?.trim();
  const handled = form.get("handled") === "true";
  if (!id) return;

  await db.inquiry.update({ where: { id }, data: { handled } });
  revalidatePath("/admin/inbox");
  revalidatePath("/admin");
}

export async function deleteInquiry(form: FormData) {
  const id = (form.get("id") as string | null)?.trim();
  if (!id) return;

  await db.inquiry.delete({ where: { id } });
  revalidatePath("/admin/inbox");
  revalidatePath("/admin");
}
