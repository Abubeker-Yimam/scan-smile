"use client";

import React, { useState } from "react";
import type { EventMediaRecord } from "./media-capture-modal";

export interface EventMediaFeedProps {
  initialMedia?: EventMediaRecord[];
  eventId: string;
  isAdmin?: boolean;
  onDeleteMedia?: (mediaId: string) => Promise<void>;
  emptyMessage?: string;
}

export function EventMediaFeed({
  initialMedia = [],
  eventId,
  isAdmin = false,
  onDeleteMedia,
  emptyMessage = "No moments captured yet. Be the first to share a smile!",
}: EventMediaFeedProps) {
  const [mediaList, setMediaList] = useState<EventMediaRecord[]>(initialMedia);
  const [selectedItem, setSelectedItem] = useState<EventMediaRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (mediaId: string) => {
    if (!confirm("Are you sure you want to remove this media from the event?")) return;

    setDeletingId(mediaId);
    try {
      if (onDeleteMedia) {
        await onDeleteMedia(mediaId);
      } else {
        const res = await fetch(`/api/events/${eventId}/media/${mediaId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Delete failed");
      }
      setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
      if (selectedItem?.id === mediaId) setSelectedItem(null);
    } catch (err) {
      alert("Failed to delete media item.");
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  if (mediaList.length === 0) {
    return (
      <div className="rounded-xs border border-cotton-3 bg-white/60 p-8 text-center">
        <p className="font-display text-base text-coffee italic">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {mediaList.map((item) => (
          <div
            key={item.id}
            className="group relative overflow-hidden rounded-xs border border-cotton-3 bg-white shadow-xs transition-all hover:shadow-md cursor-pointer"
            onClick={() => setSelectedItem(item)}
          >
            {/* Media thumbnail */}
            <div className="relative aspect-square w-full bg-ink-2 overflow-hidden">
              {item.mediaType === "photo" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.url}
                  alt={item.caption || "Event moment"}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="relative w-full h-full">
                  <video
                    src={item.url}
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                    <span className="w-9 h-9 rounded-full bg-gold/90 text-coffee flex items-center justify-center shadow-md">
                      <svg className="w-4 h-4 ml-0.5 fill-current" viewBox="0 0 24 24">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </span>
                  </div>
                  {item.duration && isFinite(item.duration) && item.duration > 0 && (
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-xs bg-ink/75 text-[0.6rem] font-mono text-cotton font-semibold">
                      {Math.round(item.duration)}s
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Caption & Guest Info bar */}
            <div className="p-2 sm:p-2.5 space-y-1">
              <p className="font-mono text-[0.62rem] font-medium uppercase tracking-wider text-coffee truncate">
                {item.guest
                  ? `${item.guest.honorific ? `${item.guest.honorific} ` : ""}${item.guest.name}`
                  : "Event Guest"}
              </p>
              {item.caption && (
                <p className="font-body text-xs text-ash line-clamp-1 italic">
                  &ldquo;{item.caption}&rdquo;
                </p>
              )}
            </div>

            {/* Admin Delete Action */}
            {isAdmin && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id);
                }}
                disabled={deletingId === item.id}
                className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1.5 rounded-xs bg-[#8E1F2F] text-white hover:bg-red-800 transition-opacity disabled:opacity-50"
                title="Remove media"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink/90 backdrop-blur-md"
          role="dialog"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative max-w-2xl w-full rounded-xs bg-cotton overflow-hidden shadow-2xl border border-cotton-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tibeb h-2 w-full" aria-hidden="true" />
            <div className="flex items-center justify-between p-4 border-b border-cotton-3">
              <div>
                <p className="font-mono text-[0.68rem] tracking-wider uppercase text-coffee font-semibold">
                  {selectedItem.guest?.name || "Guest Moment"}
                  {selectedItem.guest?.tableName && ` · ${selectedItem.guest.tableName}`}
                </p>
                <p className="text-[0.62rem] font-mono text-ash">
                  {new Date(selectedItem.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-ash hover:text-coffee p-1 rounded-xs"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="6" />
                </svg>
              </button>
            </div>

            <div className="bg-ink-2 max-h-[65vh] flex items-center justify-center overflow-hidden">
              {selectedItem.mediaType === "photo" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedItem.url}
                  alt={selectedItem.caption || "Event moment"}
                  className="max-h-[65vh] w-auto object-contain"
                />
              ) : (
                <video
                  src={selectedItem.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[65vh] w-full"
                />
              )}
            </div>

            {selectedItem.caption && (
              <div className="p-4 bg-cotton-2/40 border-t border-cotton-3">
                <p className="font-display italic text-coffee text-sm sm:text-base">
                  &ldquo;{selectedItem.caption}&rdquo;
                </p>
              </div>
            )}

            <div className="p-3.5 bg-cotton flex items-center justify-between border-t border-cotton-3 font-mono text-xs">
              <a
                href={selectedItem.url}
                target="_blank"
                rel="noreferrer"
                download
                className="text-ash hover:text-coffee underline underline-offset-2"
              >
                Download original
              </a>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedItem.id)}
                  className="text-[#8E1F2F] hover:underline"
                >
                  Delete this entry
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
