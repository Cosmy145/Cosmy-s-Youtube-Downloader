"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container, Box, Alert, CircularProgress } from "@mui/material";
import type {
  VideoMetadata,
  PlaylistMetadata,
  SingleVideoMetadata,
} from "@/types";

// Hooks
import { useDownload } from "@/hooks/useDownload";

// Components
import { LoadingSpinner } from "@/components/common";
import {
  DownloadHeader,
  VideoDownloadSection,
  PlaylistSection,
} from "@/components/download";

/**
 * Download page content (wrapped in Suspense)
 */
function DownloadPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlFromQuery = searchParams.get("url") || "";

  return <DownloadPageInner initialUrl={urlFromQuery} router={router} />;
}

/**
 * Main download page logic
 */
function DownloadPageInner({
  initialUrl,
  router,
}: {
  initialUrl: string;
  router: ReturnType<typeof useRouter>;
}) {
  // URL and Loading State
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [metadata, setMetadata] = useState<
    | (VideoMetadata & {
        availableQualities?: { quality: string; hasAudio: boolean }[];
      })
    | null
  >(null);

  // Single Video State
  const singleDownload = useDownload();
  const [transcriptDownloading, setTranscriptDownloading] = useState(false);

  // Playlist State
  const [playlistQuality, setPlaylistQuality] = useState("1080p");
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isQueueRunning, setIsQueueRunning] = useState(false);
  const activeItemCancelRef = useRef<(() => void) | null>(null);
  const [cancelledItems, setCancelledItems] = useState<Set<number>>(new Set());

  // Fetch video info on mount if URL exists
  useEffect(() => {
    if (initialUrl) {
      fetchVideoInfo();
    }
  }, [initialUrl]);

  // Update page title when metadata changes
  useEffect(() => {
    if (metadata?.title) {
      // Remove quotes from start and end of title
      const cleanTitle = metadata.title.replace(/^["']|["']$/g, "").trim();
      document.title = `${cleanTitle} | Cosmy's YT Downloader`;
    } else {
      document.title = "Download Center | Cosmy's YT Downloader";
    }
  }, [metadata]);

  /**
   * Fetch video/playlist metadata
   */
  const fetchVideoInfo = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError("");
    setMetadata(null);
    setIsQueueRunning(false);
    setQueueIndex(-1);

    try {
      const response = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
      });
      const data = await response.json();

      if (data.success) {
        setMetadata(data.data);
      } else {
        setError(data.error || "Failed to fetch metadata");
      }
    } catch (err) {
      setError("Error fetching video information");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle URL submission
   */
  const handleSubmit = () => {
    router.push(`/download?url=${encodeURIComponent(url.trim())}`);
    fetchVideoInfo();
  };

  // === Single Video Handlers ===
  const handleSingleDownload = (quality: string) => {
    if (!metadata) return;
    singleDownload.startDownload(
      metadata.original_url || url,
      quality,
      "video",
      metadata.title
    );
  };

  const handleTranscriptDownload = async (language: string = "hi") => {
    if (!metadata || metadata.type !== "video") return;

    setTranscriptDownloading(true);
    try {
      const response = await fetch("/api/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: metadata.original_url || url,
          language,
        }),
      });
      const data = await response.json();

      if (data.success && data.transcript) {
        const blob = new Blob([data.transcript], { type: "text/plain" });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `${metadata.title.replace(
          /[^a-z0-9]/gi,
          "_"
        )}_transcript_${language}.srt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        alert(data.error || "Failed to download transcript");
      }
    } catch (err) {
      console.error("Transcript download error:", err);
      alert("Failed to download transcript. Please try again.");
    } finally {
      setTranscriptDownloading(false);
    }
  };

  // === Playlist Handlers ===
  const startQueue = () => {
    setQueueIndex(0);
    setIsQueueRunning(true);
    setCancelledItems(new Set());
  };

  const stopQueue = () => {
    if (activeItemCancelRef.current) {
      activeItemCancelRef.current();
      activeItemCancelRef.current = null;
    }
    setIsQueueRunning(false);
    setQueueIndex(-1);
  };

  const handleQueueComplete = useCallback(() => {
    if (!metadata || metadata.type !== "playlist") return;
    const playlistMeta = metadata as PlaylistMetadata;

    setQueueIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex >= playlistMeta.items.length) {
        setIsQueueRunning(false);
        return -1;
      }
      return nextIndex;
    });
  }, [metadata]);

  const handleItemCancelled = (index: number) => {
    setCancelledItems((prev) => new Set(prev).add(index));
  };

  // === Computed Values ===
  const isPlaylist = metadata?.type === "playlist";
  const getDuration = () => {
    if (!metadata || isPlaylist) return 0;
    return (metadata as SingleVideoMetadata).duration || 0;
  };

  const mergeStats = singleDownload.getMergeStats(getDuration());
  const displayPercent =
    singleDownload.serverProgress.downloaded === "Merging"
      ? mergeStats.percent
      : singleDownload.serverProgress.percent;
  const displayEta =
    singleDownload.serverProgress.downloaded === "Merging"
      ? mergeStats.eta
      : singleDownload.serverProgress.eta;

  // === Render ===

  // Full page loading state
  if (loading && !metadata) {
    return (
      <LoadingSpinner
        message="Fetching video information..."
        subMessage="Please wait"
      />
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#000" }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* URL Input Header */}
        <DownloadHeader
          url={url}
          loading={loading}
          onUrlChange={setUrl}
          onSubmit={handleSubmit}
        />

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {/* Single Video Section */}
        {metadata && !isPlaylist && (
          <VideoDownloadSection
            metadata={
              metadata as SingleVideoMetadata & {
                availableQualities?: { quality: string; hasAudio: boolean }[];
              }
            }
            downloading={singleDownload.downloading}
            serverProgress={singleDownload.serverProgress}
            displayPercent={displayPercent}
            displayEta={displayEta || "..."}
            transcriptDownloading={transcriptDownloading}
            onDownload={handleSingleDownload}
            onCancel={singleDownload.cancelDownload}
            onTranscriptDownload={handleTranscriptDownload}
          />
        )}

        {/* Playlist Section */}
        {metadata && isPlaylist && (
          <PlaylistSection
            metadata={metadata as PlaylistMetadata}
            playlistQuality={playlistQuality}
            queueIndex={queueIndex}
            isQueueRunning={isQueueRunning}
            onQualityChange={setPlaylistQuality}
            onStartQueue={startQueue}
            onStopQueue={stopQueue}
            onQueueComplete={handleQueueComplete}
            onRegisterCancel={(fn) => {
              activeItemCancelRef.current = fn;
            }}
            onItemCancelled={handleItemCancelled}
          />
        )}
      </Container>
    </Box>
  );
}

/**
 * Main export with Suspense wrapper
 */
export default function DownloadPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading..." />}>
      <DownloadPageContent />
    </Suspense>
  );
}
