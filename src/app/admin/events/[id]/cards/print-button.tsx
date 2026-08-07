"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="border border-coffee bg-coffee px-5 py-2.5 font-mono text-[0.68rem] tracking-[0.16em] text-cotton uppercase hover:bg-ink"
    >
      Print sheet
    </button>
  );
}
