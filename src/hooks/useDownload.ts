"use client";

import { useState, useCallback, useRef } from "react";

interface ServerProgress {
  percent: number;
  phase: string;
  downloaded?: string;
  total?: string;
  speed?: string;
  eta?: string;
  mergedSeconds?: number;
  status?: string;
}

interface DownloadHookReturn {
  downloading: boolean;
  progress: number;
  serverProgress: ServerProgress;
  error: string;
  startDownload: (
    url: string,
    quality: string,
    format?: string,
    title?: string
  ) => Promise<void>;
  cancelDownload: () => Promise<void>;
  getMergeStats: (duration: number) => {
    percent: number;
    eta: string;
    currentSeconds: number;
  };
}

/**
 * Custom hook for managing video/audio downloads
 * Handles progress tracking, cancellation, and merge stats
 */
export const useDownload = (): DownloadHookReturn => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [serverProgress, setServerProgress] = useState<ServerProgress>({
    percent: 0,
    phase: "idle",
  });
  const [error, setError] = useState("");
  const downloadIdRef = useRef<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Smoothing refs for merge stats
  const mergeSpeedRef = useRef<number>(1);
  const mergeEtaRef = useRef<number>(0);

  /**
   * Extract and smooth merge progress stats
   */
  const getMergeStats = (duration: number) => {
    let currentSeconds = 0;
    if (serverProgress?.mergedSeconds !== undefined) {
      currentSeconds = serverProgress.mergedSeconds;
    } else if (
      typeof serverProgress?.total === "string" &&
      serverProgress.total.includes("@")
    ) {
      try {
        const timeStr = serverProgress.total.split("@")[0].trim();
        const parts = timeStr.split(":").map((p: string) => parseFloat(p));
        if (parts.length === 3)
          currentSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        else if (parts.length === 2) currentSeconds = parts[0] * 60 + parts[1];
      } catch (e) {}
    }

    const percent =
      duration > 0
        ? Math.min(100, Math.max(0, (currentSeconds / duration) * 100))
        : 0;

    let eta = "...";
    if (duration > 0 && currentSeconds > 0) {
      const remaining = duration - currentSeconds;

      // Extract current speed multiplier
      let currentSpeedVal = 1;
      if (serverProgress?.total) {
        const match = (serverProgress.total as string).match(/@\s*([\d.]+)x/);
        if (match) currentSpeedVal = parseFloat(match[1]);
      }

      // Smooth the speed multiplier (20% current, 80% previous)
      if (mergeSpeedRef.current === 1) {
        mergeSpeedRef.current = currentSpeedVal;
      } else {
        mergeSpeedRef.current =
          0.2 * currentSpeedVal + 0.8 * mergeSpeedRef.current;
      }

      const speedVal = mergeSpeedRef.current;

      if (speedVal > 0) {
        const currentEtaSeconds = remaining / speedVal;

        // Smooth the ETA (20% current, 80% previous)
        if (mergeEtaRef.current === 0) {
          mergeEtaRef.current = currentEtaSeconds;
        } else {
          mergeEtaRef.current =
            0.2 * currentEtaSeconds + 0.8 * mergeEtaRef.current;
        }

        const m = Math.floor(mergeEtaRef.current / 60);
        const s = Math.floor(mergeEtaRef.current % 60);
        eta = `${m}:${s.toString().padStart(2, "0")}`;
      }
    }
    return { percent, eta, currentSeconds };
  };

  /**
   * Start a download
   */
  const startDownload = useCallback(
    async (
      url: string,
      quality: string,
      format: string = "video",
      title?: string
    ) => {
      setDownloading(true);
      setError("");
      setProgress(0);
      setServerProgress({ phase: "starting", percent: 0 });

      // Reset smoothing refs for new download
      mergeSpeedRef.current = 1;
      mergeEtaRef.current = 0;

      const downloadId = `dl_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 5)}`;
      downloadIdRef.current = downloadId;

      let eventSource: EventSource | null = null;
      let isCompleted = false;

      try {
        eventSource = new EventSource(`/api/download?id=${downloadId}`);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (e) => {
          if (isCompleted) return;
          try {
            const d = JSON.parse(e.data);
            setServerProgress({ ...d, phase: d.status || "downloading" });
            if (d.status === "streaming" && d.downloaded !== "Merging") {
              isCompleted = true;
              setProgress(100);
              setDownloading(false);
              eventSource?.close();
            }
          } catch (err) {}
        };

        eventSource.onerror = () => {
          if (!isCompleted) {
            isCompleted = true;
            setDownloading(false);
            eventSource?.close();
          }
        };

        const params = new URLSearchParams({
          url,
          quality,
          format,
          id: downloadId,
        });
        if (title) params.append("title", title);

        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = `/api/download?${params.toString()}`;
        document.body.appendChild(iframe);

        setTimeout(() => {
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }, 600000);
      } catch (err: any) {
        setError(err.message);
        setDownloading(false);
        eventSource?.close();
      }
    },
    []
  );

  /**
   * Cancel the current download
   */
  const cancelDownload = useCallback(async () => {
    if (!downloadIdRef.current) return;

    // Immediate UI feedback
    setDownloading(false);
    setProgress(-1);
    setServerProgress({ phase: "cancelled", percent: 0 });

    try {
      await fetch(`/api/download?id=${downloadIdRef.current}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Cancel error:", err);
    } finally {
      // Clean up
      downloadIdRef.current = null;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }
  }, []);

  return {
    downloading,
    serverProgress,
    error,
    startDownload,
    cancelDownload,
    getMergeStats,
    progress,
  };
};

export default useDownload;
