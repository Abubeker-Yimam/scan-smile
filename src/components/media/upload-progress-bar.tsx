"use client";

import React from "react";

export type UploadStage = "idle" | "preparing" | "uploading" | "processing" | "success" | "error";

export interface UploadProgressBarProps {
  progress: number; // 0 to 100
  stage: UploadStage;
  statusText?: string;
  bytesUploaded?: number;
  totalBytes?: number;
  error?: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadProgressBar({
  progress,
  stage,
  statusText,
  bytesUploaded,
  totalBytes,
  error,
  onRetry,
  onCancel,
}: UploadProgressBarProps) {
  if (stage === "idle") return null;

  const isSuccess = stage === "success";
  const isError = stage === "error";

  const defaultStatus =
    stage === "preparing"
      ? "Preparing and optimizing media…"
      : stage === "uploading"
      ? `Uploading to event album… ${Math.round(progress)}%`
      : stage === "processing"
      ? "Finishing and saving moment…"
      : stage === "success"
      ? "Moment captured successfully!"
      : "Upload interrupted.";

  return (
    <div
      className="w-full rounded-xs border border-cotton-3 bg-white p-4 shadow-sm transition-all"
      role="region"
      aria-live="polite"
    >
      {/* Header with Stage and Percentage */}
      <div className="flex items-center justify-between text-xs font-mono">
        <span
          className={`font-semibold uppercase tracking-wider ${
            isError ? "text-[#8E1F2F]" : isSuccess ? "text-[#1E5A46]" : "text-coffee"
          }`}
        >
          {statusText || defaultStatus}
        </span>
        <span
          className={`font-bold ${
            isError ? "text-[#8E1F2F]" : isSuccess ? "text-[#1E5A46]" : "text-gold"
          }`}
        >
          {isError ? "Error" : isSuccess ? "100%" : `${Math.round(progress)}%`}
        </span>
      </div>

      {/* Progress Track */}
      <div className="mt-2.5 relative h-2.5 w-full overflow-hidden rounded-full bg-cotton-3/60">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${
            isError
              ? "bg-[#8E1F2F]"
              : isSuccess
              ? "bg-[#1E5A46]"
              : "bg-gradient-to-r from-gold via-[#D4A24C] to-[#8E1F2F]"
          }`}
          style={{ width: `${Math.min(100, Math.max(0, isError ? 100 : progress))}%` }}
        />
        {/* Subtle shimmer animation during active uploading */}
        {stage === "uploading" && (
          <div
            className="absolute inset-0 bg-white/20 animate-pulse"
            style={{ width: `${progress}%` }}
          />
        )}
      </div>

      {/* Footer Metrics and Actions */}
      <div className="mt-2.5 flex items-center justify-between text-[0.68rem] font-mono text-ash">
        <div>
          {totalBytes && totalBytes > 0 ? (
            <span>
              {formatBytes(bytesUploaded)} / {formatBytes(totalBytes)}
            </span>
          ) : (
            <span>{isSuccess ? "Saved" : stage === "preparing" ? "Compressing" : "In progress"}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isError && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-coffee font-semibold underline underline-offset-2 hover:text-gold transition-colors"
            >
              Retry
            </button>
          )}
          {!isSuccess && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-ash hover:text-[#8E1F2F] transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Error Message Details */}
      {isError && error && (
        <div className="mt-2.5 rounded-xs border-l-2 border-[#8E1F2F] bg-[#8E1F2F]/10 px-3 py-2 text-xs font-body text-[#8E1F2F]">
          {error}
        </div>
      )}
    </div>
  );
}
