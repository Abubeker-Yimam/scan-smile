"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  GUEST_MEDIA_ACCEPT,
  GUEST_MEDIA_MAX_BYTES,
  GUEST_MEDIA_MAX_VIDEO_DURATION_SECONDS,
  formatBytes,
} from "@/lib/upload-limits";
import { MediaPreview } from "./media-preview";
import { UploadProgressBar, UploadStage } from "./upload-progress-bar";

export interface EventMediaRecord {
  id: string;
  eventId: string;
  guestId?: string | null;
  mediaType: "photo" | "video";
  url: string;
  caption?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  duration?: number | null;
  createdAt: string;
  guest?: {
    name: string;
    honorific?: string | null;
    code: string;
    tableName?: string | null;
  } | null;
}

export interface MediaCaptureModalProps {
  eventId: string;
  guestId?: string; // Optional guest ID or participant identifier
  guestName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (media: EventMediaRecord) => void;
  themeStyle?: React.CSSProperties;
}

type CaptureTab = "camera-photo" | "camera-video" | "gallery";

/** Fast, resilient client-side downscaling to keep uploads well below Vercel's 4.5MB limit */
async function compressImageClient(file: File | Blob): Promise<Blob> {
  return new Promise((resolve) => {
    // 2.5s safety timeout so image processing never hangs
    const timeout = setTimeout(() => {
      console.warn("Client compression timed out, proceeding with original file");
      resolve(file);
    }, 2500);

    const maxEdge = 1600;
    const quality = 0.82;

    const processCanvas = (sourceWidth: number, sourceHeight: number, drawSource: CanvasImageSource) => {
      clearTimeout(timeout);
      try {
        const scale = Math.min(1, maxEdge / Math.max(sourceWidth, sourceHeight));
        const width = Math.round(sourceWidth * scale);
        const height = Math.round(sourceHeight * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);

        ctx.drawImage(drawSource, 0, 0, width, height);
        canvas.toBlob(
          (webpBlob) => {
            if (webpBlob && webpBlob.size > 0) {
              resolve(webpBlob);
            } else {
              // Fallback to JPEG if WebP blob is unsupported
              canvas.toBlob(
                (jpegBlob) => resolve(jpegBlob || file),
                "image/jpeg",
                quality
              );
            }
          },
          "image/webp",
          quality
        );
      } catch (err) {
        console.warn("Canvas compression failed, using original:", err);
        resolve(file);
      }
    };

    // Fast path: createImageBitmap (browser native background decode)
    if (typeof createImageBitmap === "function") {
      createImageBitmap(file)
        .then((bitmap) => {
          processCanvas(bitmap.width, bitmap.height, bitmap);
          bitmap.close();
        })
        .catch(() => {
          // Fallback to Image element
          loadViaImageElement();
        });
      return;
    }

    loadViaImageElement();

    function loadViaImageElement() {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        processCanvas(img.naturalWidth || img.width, img.naturalHeight || img.height, img);
      };
      img.onerror = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    }
  });
}

/** Checks video duration from a Blob using a temporary video element */
function checkVideoDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const url = URL.createObjectURL(blob);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration || 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    video.src = url;
  });
}

export function MediaCaptureModal({
  eventId,
  guestId,
  guestName,
  isOpen,
  onClose,
  onSuccess,
  themeStyle,
}: MediaCaptureModalProps) {
  // Capture view state
  const [activeTab, setActiveTab] = useState<CaptureTab>("camera-photo");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Video recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Selected media pending review
  const [stagedFile, setStagedFile] = useState<File | Blob | null>(null);
  const [stagedPreviewUrl, setStagedPreviewUrl] = useState<string | null>(null);
  const [stagedMediaType, setStagedMediaType] = useState<"photo" | "video">("photo");
  const [stagedDuration, setStagedDuration] = useState<number | null>(null);
  const [caption, setCaption] = useState("");

  // Upload Progress & State
  const [uploadStage, setUploadStage] = useState<UploadStage>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bytesUploaded, setBytesUploaded] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [completedMedia, setCompletedMedia] = useState<EventMediaRecord | null>(null);

  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const isUploading = uploadStage === "preparing" || uploadStage === "uploading" || uploadStage === "processing";

  // Stop active camera stream
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Stop recording timer
  const stopRecordingTimer = useCallback(() => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  }, []);

  // Start camera stream based on current tab & facing mode
  const startCamera = useCallback(async () => {
    setCameraError(null);
    stopStream();

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not supported by your browser. Please choose from your gallery.");
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: activeTab === "camera-video",
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoElementRef.current) {
        videoElementRef.current.srcObject = stream;
        await videoElementRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
    } catch (err: unknown) {
      console.warn("Camera init error:", err);
      const errorObj = err as { name?: string };
      if (errorObj?.name === "NotAllowedError" || errorObj?.name === "PermissionDeniedError") {
        setCameraError(
          "Camera permission was denied. Please allow camera access in your device settings or use the file picker."
        );
      } else if (errorObj?.name === "NotFoundError" || errorObj?.name === "DevicesNotFoundError") {
        setCameraError("No suitable camera was detected on this device. Please upload from your gallery.");
      } else {
        setCameraError("Unable to open camera stream. Please try using the file picker.");
      }
      setIsCameraActive(false);
    }
  }, [activeTab, facingMode, stopStream]);

  // Handle Tab Switch
  const switchTab = (tab: CaptureTab) => {
    if (isRecording) {
      stopRecording();
    }
    setActiveTab(tab);
    setCameraError(null);
  };

  // Toggle Front / Back Camera
  const toggleFacingMode = () => {
    if (isRecording) return;
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  // Lifecycle when modal opens/closes or tab changes
  useEffect(() => {
    if (isOpen && (activeTab === "camera-photo" || activeTab === "camera-video") && !stagedFile) {
      startCamera();
    } else {
      stopStream();
    }

    return () => {
      stopStream();
      stopRecordingTimer();
    };
  }, [isOpen, activeTab, facingMode, stagedFile, startCamera, stopStream, stopRecordingTimer]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (stagedPreviewUrl) {
        URL.revokeObjectURL(stagedPreviewUrl);
      }
    };
  }, [stagedPreviewUrl]);

  // Snap Photo from Camera Stream
  const takePhoto = () => {
    const video = videoElementRef.current;
    if (!video || !isCameraActive) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip horizontal if front camera
    if (facingMode === "user") {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        stopStream();

        const preview = URL.createObjectURL(blob);
        setStagedFile(blob);
        setStagedPreviewUrl(preview);
        setStagedMediaType("photo");
        setStagedDuration(null);
      },
      "image/jpeg",
      0.9
    );
  };

  // Start Video Recording
  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream || !isCameraActive) return;

    recordedChunksRef.current = [];
    setRecordingSeconds(0);

    let mimeType = "video/webm;codecs=vp8,opus";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      if (MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")) {
        mimeType = "video/mp4;codecs=avc1";
      } else if (MediaRecorder.isTypeSupported("video/webm")) {
        mimeType = "video/webm";
      } else {
        mimeType = "";
      }
    }

    try {
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType, videoBitsPerSecond: 2_500_000 } : undefined
      );

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stopRecordingTimer();
        stopStream();
        setIsRecording(false);

        const videoBlob = new Blob(recordedChunksRef.current, {
          type: mimeType || "video/webm",
        });

        const preview = URL.createObjectURL(videoBlob);
        const duration = await checkVideoDuration(videoBlob);

        setStagedFile(videoBlob);
        setStagedPreviewUrl(preview);
        setStagedMediaType("video");
        setStagedDuration(duration || recordingSeconds);
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      // Start elapsed timer (cap at GUEST_MEDIA_MAX_VIDEO_DURATION_SECONDS)
      const startTime = Date.now();
      recordTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingSeconds(elapsed);

        if (elapsed >= GUEST_MEDIA_MAX_VIDEO_DURATION_SECONDS) {
          stopRecording();
        }
      }, 250);
    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
      setCameraError("Unable to record video on this browser. Try uploading an existing clip.");
    }
  };

  // Stop Video Recording
  const stopRecording = () => {
    stopRecordingTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Handle Gallery/File Picker Selection
  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > GUEST_MEDIA_MAX_BYTES) {
      alert(`File is ${formatBytes(file.size)}. Max allowed size is ${formatBytes(GUEST_MEDIA_MAX_BYTES)}.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isImage && !isVideo) {
      alert("Please choose a photo (JPEG, PNG, WebP) or video (MP4, MOV, WebM).");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (isVideo) {
      const duration = await checkVideoDuration(file);
      if (duration > GUEST_MEDIA_MAX_VIDEO_DURATION_SECONDS + 2) {
        alert(
          `Video is ${Math.round(duration)} seconds long. Max allowed length is ${GUEST_MEDIA_MAX_VIDEO_DURATION_SECONDS} seconds.`
        );
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setStagedDuration(duration);
    } else {
      setStagedDuration(null);
    }

    const preview = URL.createObjectURL(file);
    setStagedFile(file);
    setStagedPreviewUrl(preview);
    setStagedMediaType(isVideo ? "video" : "photo");
    stopStream();
  };

  // Reset staged media (Retake / Discard)
  const handleResetStaged = () => {
    if (stagedPreviewUrl) URL.revokeObjectURL(stagedPreviewUrl);
    setStagedFile(null);
    setStagedPreviewUrl(null);
    setStagedDuration(null);
    setUploadStage("idle");
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Confirm and Upload with XMLHttpRequest progress tracking
  const handleConfirmUpload = async () => {
    if (!stagedFile || isUploading) return;

    setUploadStage("preparing");
    setUploadError(null);
    setUploadProgress(5);

    let fileToUpload: Blob = stagedFile;

    // Compress photo client-side if it's an image to avoid Vercel 4.5MB payload limit
    if (stagedMediaType === "photo") {
      try {
        fileToUpload = await compressImageClient(stagedFile);
      } catch (err) {
        console.warn("Client compression error, proceeding with original:", err);
      }
    }

    // Prepare FormData
    const formData = new FormData();
    const fileName =
      stagedMediaType === "photo"
        ? `moment-${Date.now()}.webp`
        : `clip-${Date.now()}.${fileToUpload.type.includes("mp4") ? "mp4" : "webm"}`;

    formData.append("file", fileToUpload, fileName);
    formData.append("mediaType", stagedMediaType);
    if (guestId) formData.append("guestId", guestId);
    if (caption) formData.append("caption", caption);
    if (stagedDuration) formData.append("duration", String(stagedDuration));

    setUploadStage("uploading");
    setTotalBytes(fileToUpload.size);
    setBytesUploaded(0);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
        setUploadProgress(percent);
        setBytesUploaded(event.loaded);
        setTotalBytes(event.total);
        if (percent >= 99) {
          setUploadStage("processing");
        }
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.ok && res.media) {
            setUploadStage("success");
            setUploadProgress(100);
            setCompletedMedia(res.media);
            onSuccess?.(res.media);
          } else {
            setUploadStage("error");
            setUploadError(res.error || "Upload failed. Please try again.");
          }
        } catch {
          setUploadStage("error");
          setUploadError("Unexpected server response. Please try again.");
        }
      } else {
        try {
          const res = JSON.parse(xhr.responseText);
          setUploadError(res.error || `Server error (${xhr.status}).`);
        } catch {
          setUploadError(`Upload failed with status ${xhr.status}.`);
        }
        setUploadStage("error");
      }
    };

    xhr.onerror = () => {
      setUploadStage("error");
      setUploadError("Network connection interrupted. Check your link and tap Retry.");
    };

    xhr.ontimeout = () => {
      setUploadStage("error");
      setUploadError("Upload timed out. Tap Retry to send again.");
    };

    xhr.open("POST", `/api/events/${encodeURIComponent(eventId)}/media`);
    xhr.send(formData);
  };

  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setUploadStage("idle");
    setUploadProgress(0);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-ink/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      style={themeStyle}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xs bg-cotton border border-cotton-3 shadow-2xl flex flex-col max-h-[94vh]"
        style={{ boxShadow: "0 25px 60px -15px rgba(0,0,0,0.8)" }}
      >
        {/* Top Tibeb woven banner */}
        <div className="tibeb h-2.5 w-full shrink-0" aria-hidden="true" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-cotton-3 bg-cotton shrink-0">
          {stagedFile && !completedMedia ? (
            /* Review Header with explicit Back and Share actions */
            <>
              <button
                type="button"
                onClick={handleResetStaged}
                disabled={isUploading}
                className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-ash hover:text-coffee py-1 px-1.5 transition-colors disabled:opacity-40 cursor-pointer"
                title="Discard and retake"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <span>Back</span>
              </button>

              <div className="text-center">
                <h2 className="font-display text-lg font-bold text-coffee leading-tight">
                  Review Your Moment
                </h2>
                <p className="font-mono text-[0.62rem] uppercase tracking-wider text-ash">
                  {guestName ? `For ${guestName}` : "Share with the celebration"}
                </p>
              </div>

              {/* Explicit top-right Share button */}
              <button
                type="button"
                onClick={handleConfirmUpload}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 rounded-xs border border-coffee bg-coffee px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-cotton hover:bg-ink transition-all font-semibold disabled:opacity-50 shadow-xs cursor-pointer active:scale-95"
                title="Upload moment"
              >
                {isUploading ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin text-gold" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Saving…</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Share</span>
                  </>
                )}
              </button>
            </>
          ) : (
            /* Standard Capture Header */
            <>
              <div>
                <h2 className="font-display text-xl font-bold text-coffee">
                  Capture Event Moment
                </h2>
                <p className="font-mono text-[0.62rem] uppercase tracking-wider text-ash">
                  {guestName ? `For ${guestName}` : "Share with the celebration"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleResetStaged();
                  onClose();
                }}
                className="rounded-xs p-1.5 text-ash hover:text-coffee hover:bg-cotton-2 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="6" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {completedMedia ? (
            /* Success View */
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-[#1E5A46]/10 flex items-center justify-center text-[#1E5A46]">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold text-coffee">
                  Moment Saved!
                </h3>
                <p className="mt-1 font-body text-sm text-ash">
                  Your {completedMedia.mediaType} has been added to the event memories.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setCompletedMedia(null);
                    handleResetStaged();
                  }}
                  className="rounded-xs border border-coffee bg-white px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-coffee hover:bg-cotton-2 transition-colors cursor-pointer"
                >
                  Capture Another
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xs border border-coffee bg-coffee px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-cotton hover:bg-ink transition-colors font-semibold cursor-pointer shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          ) : stagedFile && stagedPreviewUrl ? (
            /* Media Review View */
            <div className="space-y-3.5">
              {/* In-Flight Upload Progress Bar - Displayed right at top for immediate feedback */}
              {uploadStage !== "idle" && (
                <div className="rounded-xs border border-gold/40 bg-cotton-2/80 p-3 shadow-xs space-y-2">
                  <UploadProgressBar
                    progress={uploadProgress}
                    stage={uploadStage}
                    bytesUploaded={bytesUploaded}
                    totalBytes={totalBytes}
                    error={uploadError}
                    onRetry={handleConfirmUpload}
                    onCancel={handleCancelUpload}
                  />
                </div>
              )}

              {/* Review Component (Image/Video + Caption) */}
              <MediaPreview
                mediaUrl={stagedPreviewUrl}
                mediaType={stagedMediaType}
                fileSize={stagedFile.size}
                duration={stagedDuration}
                caption={caption}
                onCaptionChange={setCaption}
                onRetake={handleResetStaged}
                onDelete={handleResetStaged}
                onConfirm={handleConfirmUpload}
                isProcessing={isUploading}
                hideBottomActions={true}
              />
            </div>
          ) : (
            /* Live Camera & Picker View */
            <div className="space-y-4">
              {/* Capture Mode Tabs */}
              <div className="flex border-b border-cotton-3 font-mono text-[0.65rem] uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => switchTab("camera-photo")}
                  className={`flex-1 pb-2.5 text-center transition-colors border-b-2 cursor-pointer ${
                    activeTab === "camera-photo"
                      ? "border-gold text-coffee font-semibold"
                      : "border-transparent text-ash hover:text-coffee"
                  }`}
                >
                  📷 Take Photo
                </button>
                <button
                  type="button"
                  onClick={() => switchTab("camera-video")}
                  className={`flex-1 pb-2.5 text-center transition-colors border-b-2 cursor-pointer ${
                    activeTab === "camera-video"
                      ? "border-gold text-coffee font-semibold"
                      : "border-transparent text-ash hover:text-coffee"
                  }`}
                >
                  🎥 Record Video (Max 30s)
                </button>
                <button
                  type="button"
                  onClick={() => switchTab("gallery")}
                  className={`flex-1 pb-2.5 text-center transition-colors border-b-2 cursor-pointer ${
                    activeTab === "gallery"
                      ? "border-gold text-coffee font-semibold"
                      : "border-transparent text-ash hover:text-coffee"
                  }`}
                >
                  📁 Device Gallery
                </button>
              </div>

              {/* Camera Error / Permission Notice */}
              {cameraError && (
                <div className="rounded-xs border-l-2 border-[#8E1F2F] bg-[#8E1F2F]/10 p-3.5 space-y-2">
                  <p className="font-body text-xs text-[#8E1F2F]">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-xs border border-[#8E1F2F] bg-white px-3 py-1 font-mono text-[0.62rem] uppercase tracking-wider text-[#8E1F2F] hover:bg-[#8E1F2F] hover:text-white transition-colors cursor-pointer"
                  >
                    <span>Open Device Gallery Instead</span>
                  </button>
                </div>
              )}

              {/* Live Viewfinder (when camera tabs active) */}
              {(activeTab === "camera-photo" || activeTab === "camera-video") && !cameraError && (
                <div className="relative w-full aspect-[4/3] rounded-xs bg-ink-2 overflow-hidden shadow-inner flex items-center justify-center">
                  <video
                    ref={videoElementRef}
                    playsInline
                    muted
                    autoPlay
                    className={`w-full h-full object-cover ${
                      facingMode === "user" ? "-scale-x-100" : ""
                    }`}
                  />

                  {/* Camera overlay controls */}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleFacingMode}
                      disabled={isRecording}
                      className="p-2 rounded-full bg-ink/60 text-white backdrop-blur-md hover:bg-ink/80 transition-all disabled:opacity-40 cursor-pointer"
                      title="Flip camera"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 10c0-4.418-3.582-8-8-8s-8 3.582-8 8" />
                        <path d="M4 14c0 4.418 3.582 8 8 8s8-3.582 8-8" />
                        <polyline points="1 10 4 7 7 10" />
                        <polyline points="23 14 20 17 17 14" />
                      </svg>
                    </button>
                  </div>

                  {/* Recording Timer Badge */}
                  {isRecording && (
                    <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-[#8E1F2F] px-3 py-1 text-white font-mono text-xs font-semibold animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white" />
                      <span>
                        00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 00:
                        {GUEST_MEDIA_MAX_VIDEO_DURATION_SECONDS}
                      </span>
                    </div>
                  )}

                  {/* Bottom Viewfinder Control Panel */}
                  <div className="absolute bottom-4 inset-x-0 flex items-center justify-center">
                    {activeTab === "camera-photo" ? (
                      <button
                        type="button"
                        onClick={takePhoto}
                        className="w-16 h-16 rounded-full border-4 border-white bg-gold/90 hover:bg-gold shadow-lg flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                        title="Snap photo"
                      >
                        <span className="w-12 h-12 rounded-full bg-white/30" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-16 h-16 rounded-full border-4 border-white shadow-lg flex items-center justify-center transition-all cursor-pointer ${
                          isRecording ? "bg-[#8E1F2F] scale-105" : "bg-red-600 hover:bg-red-700"
                        }`}
                        title={isRecording ? "Stop recording" : "Start recording"}
                      >
                        {isRecording ? (
                          <span className="w-6 h-6 rounded-xs bg-white" />
                        ) : (
                          <span className="w-8 h-8 rounded-full bg-white" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Gallery Pick Section */}
              {activeTab === "gallery" && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-[4/3] rounded-xs border-2 border-dashed border-cotton-3 hover:border-gold bg-cotton-2/40 hover:bg-cotton-2/70 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-3"
                >
                  <div className="w-12 h-12 rounded-full bg-gold/15 flex items-center justify-center text-coffee">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-display text-base font-semibold text-coffee">
                      Choose from your Photo Library
                    </p>
                    <p className="mt-1 font-mono text-[0.65rem] text-ash tracking-wider uppercase">
                      Photos or Videos under 25MB (max 30s)
                    </p>
                  </div>
                </div>
              )}

              {/* Hidden file input for gallery picker */}
              <input
                ref={fileInputRef}
                type="file"
                accept={GUEST_MEDIA_ACCEPT}
                onChange={handleFilePicked}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Sticky Modal Footer (When Reviewing a Captured Media Item) */}
        {stagedFile && !completedMedia && (
          <div className="px-4 py-3 border-t border-cotton-3 bg-cotton flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleResetStaged}
              disabled={isUploading}
              className="w-1/3 rounded-xs border border-cotton-3 bg-white px-3 py-2.5 font-mono text-xs uppercase tracking-wider text-ash hover:text-coffee hover:border-gold transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              <span>Retake</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmUpload}
              disabled={isUploading}
              className="w-2/3 rounded-xs border border-coffee bg-coffee px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-cotton hover:bg-ink transition-all font-semibold disabled:opacity-50 shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {isUploading ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-gold" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>{uploadStage === "preparing" ? "Optimizing…" : `Uploading ${uploadProgress}%`}</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Confirm &amp; Share Moment</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
