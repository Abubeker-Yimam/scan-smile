import { db } from "@/lib/db";
import { AdminNav } from "./admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const unreadCount = await db.inquiry.count({ where: { handled: false } }).catch(() => 0);

  return (
    <div className="min-h-dvh bg-cotton text-coffee antialiased">
      <AdminNav unreadCount={unreadCount} />
      <div className="admin-shell mx-auto max-w-[68rem] px-6 py-8 sm:py-10">{children}</div>
    </div>
  );
}
