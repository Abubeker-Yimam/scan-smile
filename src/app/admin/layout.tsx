import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-cotton text-coffee">
      <header className="no-print border-b border-cotton-3">
        <div className="mx-auto flex max-w-[68rem] flex-wrap items-baseline gap-x-6 gap-y-2 px-6 py-5">
          <Link href="/admin" className="font-display text-xl font-bold tracking-tight">
            Scan &amp; Smile
          </Link>
          <p className="font-mono text-[0.62rem] tracking-[0.2em] text-ash uppercase">
            One scan, a lifetime of memories
          </p>
          <Link
            href="/admin/inbox"
            className="font-mono text-[0.62rem] tracking-[0.16em] text-ash uppercase underline underline-offset-4 hover:text-coffee"
          >
            Inbox
          </Link>
          <Link
            href="/"
            className="ml-auto font-mono text-[0.62rem] tracking-[0.16em] text-ash uppercase underline underline-offset-4 hover:text-coffee"
          >
            Public site
          </Link>
        </div>
      </header>
      <div className="admin-shell mx-auto max-w-[68rem] px-6 py-10">{children}</div>
    </div>
  );
}
