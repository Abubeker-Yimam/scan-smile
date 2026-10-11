"use client";

import React, { useState } from "react";
import { MediaCaptureModal, type EventMediaRecord } from "@/components/media/media-capture-modal";
import { EventMediaFeed } from "@/components/media/event-media-feed";

export interface GuestMediaSectionProps {
  eventId: string;
  guestId: string;
  guestName: string;
  hostNames: string;
  initialMedia?: EventMediaRecord[];
  themeStyle?: React.CSSProperties;
}

export function GuestMediaSection({
  eventId,
  guestId,
  guestName,
  hostNames,
  initialMedia = [],
  themeStyle,
}: GuestMediaSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mediaList, setMediaList] = useState<EventMediaRecord[]>(initialMedia);

  const handleMediaUploaded = (newMedia: EventMediaRecord) => {
    setMediaList((prev) => [newMedia, ...prev]);
  };

  return (
    <section className="mt-12 border-t border-cotton-3 pt-9 u-rise" style={{ animationDelay: "0.75s" }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="font-mono text-[0.65rem] tracking-[0.2em] text-ash uppercase">
            Celebration Moments
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold text-coffee">
            Share Your Smile
          </h2>
          <p className="mt-1 font-body text-sm text-ash">
            Capture a live photo or record a short video clip for {hostNames}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xs border border-coffee bg-coffee px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-cotton hover:bg-ink transition-all shadow-sm font-semibold shrink-0 cursor-pointer active:scale-95"
        >
          <svg className="w-4 h-4 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span>Capture Moment</span>
        </button>
      </div>

      {/* Captured Moments Gallery Feed */}
      <div className="mt-4">
        <EventMediaFeed
          initialMedia={mediaList}
          eventId={eventId}
          emptyMessage={`No guest photos yet. Tap "Capture Moment" above to share the very first one with ${hostNames}!`}
        />
      </div>

      {/* Media Capture & Upload Modal */}
      <MediaCaptureModal
        eventId={eventId}
        guestId={guestId}
        guestName={guestName}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleMediaUploaded}
        themeStyle={themeStyle}
      />
    </section>
  );
}
