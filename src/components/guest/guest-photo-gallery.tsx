"use client";

import { useEffect, useState } from "react";

export function GuestPhotoGallery({
  photos,
  guestName,
  hostNames,
}: {
  photos: string[];
  guestName: string;
  hostNames: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const total = photos.length;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (total <= 1) return;
      if (e.key === "ArrowLeft") {
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
      } else if (e.key === "ArrowRight") {
        setActiveIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [total]);

  if (total === 0) return null;

  // Single photo: render classic elegant figure
  if (total === 1) {
    return (
      <figure className="u-rise mt-10" style={{ animationDelay: "0.5s" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[0]}
          alt={`${guestName} with ${hostNames}`}
          className="h-auto w-full"
          style={{ boxShadow: "0 2px 0 var(--color-cotton-3)" }}
        />
      </figure>
    );
  }

  const prev = () => setActiveIndex((i) => (i > 0 ? i - 1 : total - 1));
  const next = () => setActiveIndex((i) => (i < total - 1 ? i + 1 : 0));

  return (
    <figure className="u-rise mt-10 space-y-3" style={{ animationDelay: "0.5s" }}>
      {/* Main active photo stage */}
      <div
        className="group relative overflow-hidden bg-ink-2"
        style={{ aspectRatio: "4 / 3", boxShadow: "0 2px 0 var(--color-cotton-3)" }}
        onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStart === null) return;
          const diff = touchStart - e.changedTouches[0].clientX;
          if (diff > 45) next();
          else if (diff < -45) prev();
          setTouchStart(null);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photos[activeIndex]}
          src={photos[activeIndex]}
          alt={`${guestName} with ${hostNames} (Photo ${activeIndex + 1} of ${total})`}
          className="h-full w-full object-contain transition-opacity duration-300"
        />

        {/* Counter Badge */}
        <div className="absolute top-3 right-3 bg-ink/75 px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-cotton backdrop-blur-xs">
          {activeIndex + 1} / {total}
        </div>

        {/* Previous button */}
        <button
          type="button"
          onClick={prev}
          aria-label="Previous photo"
          className="absolute top-1/2 left-3 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-ink/60 text-cotton opacity-80 backdrop-blur-xs transition-all hover:bg-ink hover:opacity-100 hover:scale-105 cursor-pointer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Next button */}
        <button
          type="button"
          onClick={next}
          aria-label="Next photo"
          className="absolute top-1/2 right-3 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-ink/60 text-cotton opacity-80 backdrop-blur-xs transition-all hover:bg-ink hover:opacity-100 hover:scale-105 cursor-pointer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Thumbnails strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-1 scrollbar-thin">
        {photos.map((src, idx) => (
          <button
            key={src + idx}
            type="button"
            onClick={() => setActiveIndex(idx)}
            aria-label={`Jump to photo ${idx + 1}`}
            className={`relative shrink-0 overflow-hidden transition-all cursor-pointer ${
              idx === activeIndex
                ? "border-2 border-gold ring-1 ring-gold/40 scale-102 opacity-100"
                : "border border-cotton-3 opacity-60 hover:opacity-100"
            }`}
            style={{ width: "4.5rem", aspectRatio: "4 / 3" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </figure>
  );
}
