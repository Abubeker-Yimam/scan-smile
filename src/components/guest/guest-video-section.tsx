"use client";

import { useState } from "react";
import type { ResolvedVideo } from "@/lib/media";

export function GuestVideoSection({
  videos,
  guestName,
}: {
  videos: ResolvedVideo[];
  guestName: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (videos.length === 0) return null;

  const current = videos[activeIdx] ?? videos[0];

  return (
    <div className="u-rise mt-10 space-y-4" style={{ animationDelay: "0.7s" }}>
      {videos.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          {videos.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.16em] transition-colors cursor-pointer ${
                idx === activeIdx
                  ? "bg-coffee text-cotton border border-coffee"
                  : "bg-white text-ash border border-cotton-3 hover:border-gold hover:text-coffee"
              }`}
            >
              Video {idx + 1}
            </button>
          ))}
        </div>
      )}

      <div>
        {current.type === "embed" ? (
          <iframe
            key={current.src}
            src={current.src}
            title={`A message for ${guestName} (${activeIdx + 1})`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full border-0 bg-ink-2"
            style={{ aspectRatio: "16 / 9" }}
          />
        ) : (
          <video
            key={current.src}
            src={current.src}
            controls
            playsInline
            preload="metadata"
            className="w-full bg-ink-2"
            style={{ aspectRatio: "16 / 9" }}
          />
        )}

        <div className="mt-3 flex items-center justify-between">
          <p className="font-mono text-[0.65rem] tracking-[0.2em] text-ash uppercase">
            {videos.length > 1
              ? `Video ${activeIdx + 1} of ${videos.length} · A message for you`
              : "A message for you"}
          </p>
        </div>
      </div>
    </div>
  );
}
