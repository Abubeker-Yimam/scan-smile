"use client";

import React, { useState } from "react";
import { formatBytes } from "@/lib/upload-limits";

export interface MediaPreviewProps {
  mediaUrl: string;
  mediaType: "photo" | "video";
  fileSize?: number;
  duration?: number | null; // in seconds
  caption: string;
  onCaptionChange: (caption: string) => void;
  onRetake: () => void;
  onDelete: () => void;
  onConfirm: () => void;
  isProcessing?: boolean;
}

export function MediaPreview({
  mediaUrl,
  mediaType,
  fileSize,
  duration,
  caption,
  onCaptionChange,
  onRetake,
  onDelete,
  onConfirm,
  isProcessing = false,
}: MediaPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="flex flex-col h-full max-h-[85vh] overflow-y-auto space-y-4">
      {/* Header Info Banner */}
      <div className="flex items-center justify-between pb-2 border-b border-cotton-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[0.62rem] font-mono uppercase tracking-wider bg-gold/15 text-coffee font-semibold">
            {mediaType === "photo" ? "Photo Preview" : "Video Clip"}
          </span>
          {duration !== undefined && duration !== null && duration > 0 && (
            <span className="text-[0.68rem] font-mono text-ash">
              {duration.toFixed(1)}s
            </span>
          )}
          {fileSize !== undefined && fileSize > 0 && (
            <span className="text-[0.68rem] font-mono text-ash">
              · {formatBytes(fileSize)}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onDelete}
          disabled={isProcessing}
          className="text-ash hover:text-[#8E1F2F] text-xs font-mono uppercase tracking-wider transition-colors disabled:opacity-40"
          title="Discard this media"
        >
          Discard
        </button>
      </div>

      {/* Media Viewer Frame */}
      <div className="relative w-full overflow-hidden rounded-xs bg-ink-2 flex items-center justify-center min-h-[240px] max-h-[380px] shadow-inner">
        {mediaType === "photo" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl}
            alt="Captured moment"
            className="w-full h-full object-contain max-h-[380px] select-none"
          />
        ) : (
          <video
            src={mediaUrl}
            controls
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="w-full h-full object-contain max-h-[380px]"
          />
        )}
      </div>

      {/* Caption Input Section */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="media-caption-input"
            className="block font-mono text-[0.65rem] tracking-[0.16em] uppercase text-ash font-medium"
          >
            Add a note or wish for the hosts
          </label>
          <span className="text-[0.62rem] font-mono text-ash/80">
            {caption.length}/500
          </span>
        </div>
        <textarea
          id="media-caption-input"
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value.slice(0, 500))}
          placeholder="Congratulations! Celebrating this beautiful day with you..."
          rows={2}
          disabled={isProcessing}
          className="w-full rounded-xs border border-cotton-3 bg-white px-3 py-2 text-sm font-body text-coffee placeholder:text-ash/50 outline-none focus:border-gold transition-colors disabled:opacity-50 resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={onRetake}
          disabled={isProcessing}
          className="w-full sm:w-1/2 rounded-xs border border-cotton-3 bg-white px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-ash hover:text-coffee hover:border-gold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 4v6h6" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          <span>Retake / Choose Another</span>
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={isProcessing}
          className="w-full sm:w-1/2 rounded-xs border border-coffee bg-coffee px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-cotton hover:bg-ink transition-all disabled:opacity-40 flex items-center justify-center gap-2 font-semibold shadow-xs"
        >
          <svg className="w-3.5 h-3.5 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{isProcessing ? "Processing…" : "Confirm & Share Moment"}</span>
        </button>
      </div>
    </div>
  );
}
