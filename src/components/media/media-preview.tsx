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
  hideBottomActions?: boolean;
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
  hideBottomActions = false,
}: MediaPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="flex flex-col space-y-3.5">
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
          className="inline-flex items-center gap-1 text-ash hover:text-[#8E1F2F] text-[0.68rem] font-mono uppercase tracking-wider transition-colors disabled:opacity-40 cursor-pointer"
          title="Discard this media"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          <span>Discard</span>
        </button>
      </div>

      {/* Media Viewer Frame - Compact responsive height so everything fits on phone */}
      <div className="relative w-full overflow-hidden rounded-xs bg-ink-2 flex items-center justify-center max-h-[210px] sm:max-h-[270px] shadow-inner">
        {mediaType === "photo" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl}
            alt="Captured moment"
            className="w-full h-auto max-h-[210px] sm:max-h-[270px] object-contain select-none"
          />
        ) : (
          <video
            src={mediaUrl}
            controls
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="w-full h-auto max-h-[210px] sm:max-h-[270px] object-contain"
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
          className="w-full rounded-xs border border-cotton-3 bg-white px-3 py-2 text-sm font-body text-coffee placeholder:text-ash/50 outline-none focus:border-gold transition-colors disabled:opacity-50 resize-none shadow-xs"
        />
      </div>

      {/* Optional In-line Action Buttons (if modal does not render sticky footer) */}
      {!hideBottomActions && (
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
            {isProcessing ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin text-gold" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Uploading…</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Confirm &amp; Share Moment</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
