"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Container,
  Box,
  Typography,
  Paper,
  InputBase,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { VideoMetadataCard } from "@/components/VideoMetadataCard";
import { QualityTable } from "@/components/QualityTable";
import { DetailedProgressBar } from "@/components/DetailedProgressBar";
import { PlaylistControls } from "@/components/PlaylistControls";
import { PlaylistItemAccordion } from "@/components/PlaylistItemAccordion";
import type { VideoMetadata, PlaylistItem, PlaylistMetadata } from "@/types";

// --- Hook Definition ---
const useDownload = () => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [serverProgress, setServerProgress] = useState<any>({
    percent: 0,
    phase: "idle",
  });
  const [error, setError] = useState("");
  const downloadIdRef = useRef<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Smoothing refs for merge stats
  const mergeSpeedRef = useRef<number>(1);
  const mergeEtaRef = useRef<number>(0);

  // Helper to extract stats with smoothing
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

const formatDuration = (seconds?: number) => {
  if (!seconds) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// --- Sub-component for Playlist Item Logic ---
const PlaylistRowItem = ({
  item,
  index,
  isActive,
  onComplete,
  defaultQuality,
  onRegisterCancel,
  isQueueRunning,
  onItemCancelled,
}: {
  item: PlaylistItem;
  index: number;
  isActive: boolean;
  onComplete: () => void;
  defaultQuality: string;
  onRegisterCancel: (cancelFn: () => void) => void;
  isQueueRunning: boolean;
  onItemCancelled: (index: number) => void;
}) => {
  const dl = useDownload();
  const [status, setStatus] = useState<
    "idle" | "downloading" | "completed" | "error" | "cancelled" | "pending"
  >("idle");
  const [expanded, setExpanded] = useState(false);
  const hasStartedRef = useRef(false);

  // Detect pending status
  useEffect(() => {
    if (isQueueRunning && !isActive && status === "idle") {
      setStatus("pending");
    } else if (!isQueueRunning && status === "pending") {
      setStatus("idle");
    }
  }, [isQueueRunning, isActive, status]);

  // Auto-start queue logic
  useEffect(() => {
    if (
      isActive &&
      (status === "idle" || status === "pending") &&
      !hasStartedRef.current
    ) {
      hasStartedRef.current = true;
      setStatus("downloading");
      dl.startDownload(item.url, defaultQuality, "video", item.title).catch(
        (err) => {
          setStatus("error");
        }
      );
    }
  }, [
    isActive,
    status,
    item.url,
    defaultQuality,
    item.title,
    dl.startDownload,
  ]);

  // Reset hasStarted when status changes back to idle
  useEffect(() => {
    if (status === "idle") {
      hasStartedRef.current = false;
    }
  }, [status]);

  // Reset status when queue stops and restarts
  useEffect(() => {
    if (isQueueRunning && (status === "cancelled" || status === "error")) {
      // Reset to idle when queue restarts
      setStatus("idle");
      hasStartedRef.current = false;
    }
  }, [isQueueRunning, status]);

  // Cancel Handler
  const handleCancel = useCallback(() => {
    setStatus("cancelled");
    onItemCancelled(index);
    if (status === "downloading") {
      dl.cancelDownload();
    }
    if (isActive) {
      onComplete();
    }
  }, [status, dl.cancelDownload, onComplete, isActive, onItemCancelled, index]);

  // Auto-expand when active and downloading
  useEffect(() => {
    if (isActive && status === "downloading") {
      setExpanded(true);
      onRegisterCancel(handleCancel);
    }
  }, [isActive, status, onRegisterCancel, handleCancel]);

  // Auto-close when done
  useEffect(() => {
    if (
      status === "completed" ||
      status === "cancelled" ||
      status === "error"
    ) {
      setExpanded(false);
    }
  }, [status]);

  // Completion watcher
  useEffect(() => {
    if (status === "downloading" && dl.progress === 100) {
      setStatus("completed");
      onComplete();
    } else if (status === "downloading" && dl.error) {
      setStatus("error");
      onComplete();
    }
  }, [dl.progress, dl.error, status, onComplete]);

  // Cancellation watcher
  useEffect(() => {
    if (status === "downloading" && !dl.downloading && dl.progress === -1) {
      setStatus("cancelled");
    }
  }, [dl.downloading, dl.progress, status]);

  // Manual Download Trigger
  const handleManualDownload = (q: string) => {
    setStatus("downloading");
    dl.startDownload(item.url, q, "video", item.title);
  };

  // Stats Calculation
  const mergeStats = dl.getMergeStats(item.duration);
  const displayPercent =
    dl.serverProgress.downloaded === "Merging"
      ? mergeStats.percent
      : dl.serverProgress.percent;
  const displayEta =
    dl.serverProgress.downloaded === "Merging"
      ? mergeStats.eta
      : dl.serverProgress.eta;

  const displayStatsObj = { percent: displayPercent, eta: displayEta };

  const qualities = [
    { quality: "1080p", hasAudio: true },
    { quality: "720p", hasAudio: true },
    { quality: "480p", hasAudio: true },
    { quality: "360p", hasAudio: true },
    { quality: "192kbps", hasAudio: true },
    { quality: "128kbps", hasAudio: true },
  ];

  return (
    <PlaylistItemAccordion
      item={item}
      index={index}
      expanded={expanded}
      onExpand={() => setExpanded(!expanded)}
      qualities={qualities}
      onDownload={handleManualDownload}
      status={status}
      progressObj={dl.serverProgress}
      displayStats={displayStatsObj}
      onCancel={handleCancel}
      isQueueRunning={isActive && status === "downloading"}
    />
  );
};

// Main component wrapper
function DownloadPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlFromQuery = searchParams.get("url") || "";

  return <DownloadPageInner initialUrl={urlFromQuery} router={router} />;
}

function DownloadPageInner({
  initialUrl,
  router,
}: {
  initialUrl: string;
  router: any;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [showDownloadSection, setShowDownloadSection] = useState(true);

  useEffect(() => {
    document.title = "Cosmy's Youtube Downloader";
  }, []);

  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<
    | (VideoMetadata & {
        availableQualities?: { quality: string; hasAudio: boolean }[];
      })
    | null
  >(null);
  const [error, setError] = useState("");

  // Single Video State
  const singleDownload = useDownload();

  // Playlist State
  const [playlistQuality, setPlaylistQuality] = useState("1080p");
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isQueueRunning, setIsQueueRunning] = useState(false);
  const activeItemCancelRef = useRef<(() => void) | null>(null);
  const [cancelledItems, setCancelledItems] = useState<Set<number>>(new Set());
  const [transcriptDownloading, setTranscriptDownloading] = useState(false);

  // Fetch video info on mount if URL exists
  useEffect(() => {
    if (initialUrl) {
      fetchVideoInfo();
    }
  }, [initialUrl]);

  const fetchVideoInfo = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError("Please enter URL");
      return;
    }
    setLoading(true);
    setError("");
    setMetadata(null);
    setIsQueueRunning(false);
    setQueueIndex(-1);
    setShowDownloadSection(true);

    try {
      const response = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
      });
      const data = await response.json();
      if (data.success) setMetadata(data.data);
      else setError(data.error || "Failed to fetch info");
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  // Single Video Download Handler
  const handleSingleDownload = (quality: string) => {
    if (!metadata) return;
    singleDownload.startDownload(
      metadata.original_url || url,
      quality,
      "video",
      metadata.title
    );
  };

  // Transcript Download Handler
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
        // Create a blob and download it
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
    } catch (error) {
      console.error("Transcript download error:", error);
      alert("Failed to download transcript. Please try again.");
    } finally {
      setTranscriptDownloading(false);
    }
  };

  // Playlist Queue Handlers
  const startQueue = () => {
    setQueueIndex(0);
    setIsQueueRunning(true);
    setCancelledItems(new Set()); // Clear cancelled items when starting fresh
  };

  const stopQueue = () => {
    if (activeItemCancelRef.current) {
      activeItemCancelRef.current();
      activeItemCancelRef.current = null;
    }
    setIsQueueRunning(false);
    setQueueIndex(-1);
    // Don't clear cancelled items here - keep track of what was cancelled
  };

  const handleQueueComplete = () => {
    if (!isQueueRunning || !metadata || metadata.type !== "playlist") return;
    setQueueIndex((prev) => {
      let next = prev + 1;

      // Skip over cancelled items
      while (next < metadata.items.length && cancelledItems.has(next)) {
        next++;
      }

      if (next >= metadata.items.length) {
        setIsQueueRunning(false);
        return -1;
      }
      return next;
    });
  };

  const handleItemCancelled = (index: number) => {
    setCancelledItems((prev) => new Set(prev).add(index));
  };

  const isPlaylist = metadata?.type === "playlist";

  // Single Video Stats
  const getDuration = () => {
    if (!metadata) return 0;
    return "duration" in metadata
      ? (metadata as import("@/types").SingleVideoMetadata).duration
      : 0;
  };
  const svMergeStats = singleDownload.getMergeStats(getDuration());
  const svDisplayPercent =
    singleDownload.serverProgress.downloaded === "Merging"
      ? svMergeStats.percent
      : singleDownload.serverProgress.percent;
  const svDisplayEta =
    singleDownload.serverProgress.downloaded === "Merging"
      ? svMergeStats.eta
      : singleDownload.serverProgress.eta;

  // Full page loading state
  if (loading && !metadata) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={60} sx={{ color: "#FF0000", mb: 3 }} />
        <Typography sx={{ color: "#fff", fontSize: "18px", fontWeight: 600 }}>
          Fetching video information...
        </Typography>
        <Typography
          sx={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", mt: 1 }}
        >
          Please wait
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#000",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        component="header"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: { xs: 2, md: 6 },
          py: 2,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              bgcolor: "#FF0000",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            ▶
          </Box>
          <Typography
            sx={{
              color: "#fff",
              fontSize: "16px",
              fontWeight: 700,
              letterSpacing: "0.5px",
            }}
          >
            COSMY'S YOUTUBE DOWNLOADER
          </Typography>
        </Box>
        <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 4 }}>
          <Typography
            sx={{
              color: "#fff",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              "&:hover": { color: "#FF0000" },
            }}
          >
            HOME
          </Typography>
          <Typography
            sx={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              "&:hover": { color: "#fff" },
            }}
          >
            FAQ
          </Typography>
          <Typography
            sx={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              "&:hover": { color: "#fff" },
            }}
          >
            CONTACT
          </Typography>
        </Box>
      </Box>

      {/* Hero Section - Hidden on download page */}
      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 8 }, display: "none" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 4, md: 8 },
            alignItems: "center",
            minHeight: { md: "600px" },
          }}
        >
          {/* Left Side - Hero Text */}
          <Box>
            <Box
              sx={{
                display: "inline-block",
                bgcolor: "#FF0000",
                color: "#fff",
                px: 2,
                py: 0.5,
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "1px",
                mb: 3,
              }}
            >
              HOW TO ONLINE?
            </Box>
            <Typography
              sx={{
                fontSize: { xs: "48px", md: "72px" },
                fontWeight: 900,
                lineHeight: 1.1,
                color: "#fff",
                mb: 3,
              }}
            >
              DOWNLOAD
              <br />
              YOUTUBE
              <br />
              VIDEOS IN{" "}
              <Box component="span" sx={{ color: "#FF0000" }}>
                4K
              </Box>
            </Typography>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.6)",
                fontSize: "14px",
                lineHeight: 1.6,
                maxWidth: "400px",
              }}
            >
              Premium quality, ultra-fast speeds, and no ads. The best way to
              save your favorite content securely.
            </Typography>
          </Box>

          {/* Right Side - Download Box */}
          <Box
            sx={{
              bgcolor: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              p: 4,
              backdropFilter: "blur(10px)",
            }}
          >
            <InputBase
              sx={{
                width: "100%",
                bgcolor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                px: 2,
                py: 1.5,
                color: "#fff",
                fontSize: "14px",
                mb: 2,
                "& .MuiInputBase-input::placeholder": {
                  color: "rgba(255,255,255,0.3)",
                  opacity: 1,
                },
              }}
              placeholder="Paste YouTube URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              disabled={loading || singleDownload.downloading || isQueueRunning}
            />
            <Typography
              sx={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "11px",
                mb: 2,
              }}
            >
              ● SIMPLE TOOL BECAUSE YOUR CLIPBOARD HAS{" "}
              <Box component="span" sx={{ color: "#FF0000" }}>
                LIMITS
              </Box>
            </Typography>
            <Button
              fullWidth
              onClick={fetchVideoInfo}
              disabled={loading || singleDownload.downloading || isQueueRunning}
              sx={{
                bgcolor: "#FF0000",
                color: "#fff",
                py: 1.5,
                fontSize: "14px",
                fontWeight: 700,
                borderRadius: "8px",
                textTransform: "none",
                mb: 3,
                "&:hover": { bgcolor: "#CC0000" },
                "&:disabled": { bgcolor: "rgba(255,0,0,0.3)" },
              }}
            >
              {loading ? (
                <CircularProgress size={20} sx={{ color: "#fff" }} />
              ) : (
                <>DOWNLOAD ⬇</>
              )}
            </Button>

            {/* Feature Badges */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    bgcolor: "#FF0000",
                    borderRadius: "2px",
                  }}
                />
                <Typography sx={{ color: "#fff", fontSize: "11px" }}>
                  4K QUALITY
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    bgcolor: "#FF0000",
                    borderRadius: "2px",
                  }}
                />
                <Typography sx={{ color: "#fff", fontSize: "11px" }}>
                  ULTRA FAST
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    bgcolor: "#FF0000",
                    borderRadius: "2px",
                  }}
                />
                <Typography sx={{ color: "#fff", fontSize: "11px" }}>
                  MP3 & MP4
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    bgcolor: "#FF0000",
                    borderRadius: "2px",
                  }}
                />
                <Typography sx={{ color: "#fff", fontSize: "11px" }}>
                  SECURE
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Download Section - Shows after user clicks download */}
      {showDownloadSection && (
        <Container maxWidth="xl" sx={{ py: 6 }}>
          {/* URL Input Header */}
          <Box sx={{ mb: 4 }}>
            <Paper
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                router.push(`/download?url=${encodeURIComponent(url.trim())}`);
                fetchVideoInfo();
              }}
              sx={{
                p: "4px",
                display: "flex",
                alignItems: "center",
                bgcolor: "rgba(255,255,255,0.05)",
                border: "2px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
              }}
            >
              <InputBase
                sx={{
                  ml: 2,
                  flex: 1,
                  color: "#fff",
                  fontSize: "16px",
                  "& input::placeholder": {
                    color: "rgba(255,255,255,0.4)",
                    opacity: 1,
                  },
                }}
                placeholder="Paste YouTube URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onFocus={(e) => e.target.select()}
              />
              <Button
                type="submit"
                disabled={loading}
                sx={{
                  px: 4,
                  py: 1.5,
                  bgcolor: "#FF0000",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "14px",
                  borderRadius: "8px",
                  textTransform: "none",
                  "&:hover": { bgcolor: "#CC0000" },
                }}
              >
                {loading ? "Loading..." : "Get Info"}
              </Button>
            </Paper>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 4, borderRadius: 2, bgcolor: "rgba(255,0,0,0.1)" }}
            >
              {error}
            </Alert>
          )}

          {metadata && !isPlaylist && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 6,
              }}
            >
              {/* Left Side - Video Info */}
              <Box>
                <VideoMetadataCard
                  thumbnail={metadata.thumbnail}
                  title={metadata.title}
                  uploader={metadata.uploader}
                  duration={formatDuration(metadata.duration)}
                  viewCount={(metadata as any).view_count}
                />
              </Box>

              {/* Right Side - Quality Options */}
              <Box>
                {singleDownload.downloading &&
                singleDownload.serverProgress.phase !== "cancelled" ? (
                  <DetailedProgressBar
                    phase={singleDownload.serverProgress.phase}
                    downloaded={singleDownload.serverProgress.downloaded}
                    total={singleDownload.serverProgress.total || ""}
                    speed={singleDownload.serverProgress.speed || ""}
                    percent={svDisplayPercent}
                    eta={svDisplayEta}
                    onCancel={singleDownload.cancelDownload}
                  />
                ) : (
                  <QualityTable
                    qualities={metadata.availableQualities || []}
                    onDownload={handleSingleDownload}
                    onTranscriptDownload={handleTranscriptDownload}
                    transcriptDownloading={transcriptDownloading}
                  />
                )}
              </Box>
            </Box>
          )}

          {metadata && isPlaylist && (
            <Box>
              <PlaylistControls
                title={metadata.title}
                itemCount={(metadata as PlaylistMetadata).item_count}
                thumbnail={metadata.thumbnail}
                uploader={metadata.uploader}
                viewCount={metadata.view_count}
                isQueueRunning={isQueueRunning}
                onStartQueue={startQueue}
                onStopQueue={stopQueue}
                queueIndex={queueIndex}
                globalQuality={playlistQuality}
                onQualityChange={setPlaylistQuality}
              />

              <Box>
                {(metadata as PlaylistMetadata).items.map((item, idx) => (
                  <PlaylistRowItem
                    key={item.id}
                    item={item}
                    index={idx}
                    isActive={isQueueRunning && idx === queueIndex}
                    onComplete={handleQueueComplete}
                    defaultQuality={playlistQuality}
                    isQueueRunning={isQueueRunning}
                    onRegisterCancel={(cancelFn) => {
                      activeItemCancelRef.current = cancelFn;
                    }}
                    onItemCancelled={handleItemCancelled}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Container>
      )}

      {/* How It Works Section - Hidden on download page */}
      <Box sx={{ bgcolor: "#0a0a0a", py: { xs: 6, md: 10 }, display: "none" }}>
        <Container maxWidth="lg">
          <Typography
            sx={{
              fontSize: { xs: "32px", md: "48px" },
              fontWeight: 900,
              color: "#fff",
              mb: 2,
            }}
          >
            HOW IT WORKS
          </Typography>
          <Typography
            sx={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "14px",
              mb: 6,
            }}
          >
            Download your favorite videos in three simple steps. No complicated
            software, just copy, paste, and save.
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: 3,
            }}
          >
            {/* Step 1 */}
            <Box
              sx={{
                bgcolor: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                p: 4,
                position: "relative",
                "&::before": {
                  content: '"📋"',
                  position: "absolute",
                  top: 20,
                  right: 20,
                  fontSize: "32px",
                  opacity: 0.3,
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: "56px",
                  fontWeight: 900,
                  color: "#FF0000",
                  lineHeight: 1,
                  mb: 2,
                }}
              >
                01
              </Typography>
              <Typography
                sx={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#fff",
                  mb: 1.5,
                }}
              >
                COPY URL
              </Typography>
              <Typography
                sx={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.5)",
                  lineHeight: 1.6,
                }}
              >
                Find the video you want. Copy the link either on YouTube or copy
                the link from your browser's address bar.
              </Typography>
            </Box>

            {/* Step 2 */}
            <Box
              sx={{
                bgcolor: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                p: 4,
                position: "relative",
                "&::before": {
                  content: '"📝"',
                  position: "absolute",
                  top: 20,
                  right: 20,
                  fontSize: "32px",
                  opacity: 0.3,
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: "56px",
                  fontWeight: 900,
                  color: "#FF0000",
                  lineHeight: 1,
                  mb: 2,
                }}
              >
                02
              </Typography>
              <Typography
                sx={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#fff",
                  mb: 1.5,
                }}
              >
                PASTE LINK
              </Typography>
              <Typography
                sx={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.5)",
                  lineHeight: 1.6,
                }}
              >
                Paste the YouTube link in the search box at the top of this page
                and click the "Start Download" button.
              </Typography>
            </Box>

            {/* Step 3 */}
            <Box
              sx={{
                bgcolor: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                p: 4,
                position: "relative",
                "&::before": {
                  content: '"💾"',
                  position: "absolute",
                  top: 20,
                  right: 20,
                  fontSize: "32px",
                  opacity: 0.3,
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: "56px",
                  fontWeight: 900,
                  color: "#FF0000",
                  lineHeight: 1,
                  mb: 2,
                }}
              >
                03
              </Typography>
              <Typography
                sx={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#fff",
                  mb: 1.5,
                }}
              >
                DOWNLOAD
              </Typography>
              <Typography
                sx={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.5)",
                  lineHeight: 1.6,
                }}
              >
                Choose your preferred format and quality (up to 4K) and then
                click the file transfer link to start.
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* CTA Section - Hidden on download page */}
      <Box sx={{ py: { xs: 8, md: 12 }, textAlign: "center", display: "none" }}>
        <Container maxWidth="md">
          <Typography
            sx={{
              fontSize: { xs: "36px", md: "56px" },
              fontWeight: 900,
              color: "#fff",
              mb: 2,
            }}
          >
            READY TO DOWNLOAD?
          </Typography>
          <Typography
            sx={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "14px",
              mb: 4,
            }}
          >
            Get unrestricted access to your favorite videos offline.
            <br />
            Fast, free, and secure.
          </Typography>
          <Button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            sx={{
              bgcolor: "#FF0000",
              color: "#fff",
              px: 6,
              py: 2,
              fontSize: "14px",
              fontWeight: 700,
              borderRadius: "8px",
              textTransform: "none",
              "&:hover": { bgcolor: "#CC0000" },
            }}
          >
            TRY IT NOW
          </Button>
        </Container>
      </Box>

      {/* Footer - Hidden on download page */}
      <Box
        sx={{
          borderTop: "1px solid rgba(255,255,255,0.1)",
          py: 6,
          mt: "auto",
          display: "none",
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr 1fr" },
              gap: 4,
              mb: 4,
            }}
          >
            <Box>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    bgcolor: "#FF0000",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                  }}
                >
                  ▶
                </Box>
                <Typography
                  sx={{ color: "#fff", fontSize: "14px", fontWeight: 700 }}
                >
                  COSMY'S YOUTUBE DOWNLOADER
                </Typography>
              </Box>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "12px",
                  lineHeight: 1.6,
                }}
              >
                The best free YouTube downloader on the web, now updated for
                videos, and more and strip just one click.
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                CONTENT
              </Typography>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "12px",
                  mb: 1,
                  cursor: "pointer",
                  "&:hover": { color: "#fff" },
                }}
              >
                Features
              </Typography>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "12px",
                  cursor: "pointer",
                  "&:hover": { color: "#fff" },
                }}
              >
                Extension
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                SUPPORT
              </Typography>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "12px",
                  mb: 1,
                  cursor: "pointer",
                  "&:hover": { color: "#fff" },
                }}
              >
                FAQ
              </Typography>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "12px",
                  cursor: "pointer",
                  "&:hover": { color: "#fff" },
                }}
              >
                Contact
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                LEGAL
              </Typography>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "12px",
                  mb: 1,
                  cursor: "pointer",
                  "&:hover": { color: "#fff" },
                }}
              >
                Privacy
              </Typography>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "12px",
                  cursor: "pointer",
                  "&:hover": { color: "#fff" },
                }}
              >
                Terms
              </Typography>
            </Box>
          </Box>

          <Typography
            sx={{
              color: "rgba(255,255,255,0.3)",
              fontSize: "11px",
              textAlign: "center",
              pt: 4,
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            © 2025 - 2077 COSMY'S YT DOWNLOADER. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

// Main export with Suspense wrapper
export default function DownloadPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            bgcolor: "#000",
          }}
        >
          <CircularProgress sx={{ color: "#FF0000" }} />
        </Box>
      }
    >
      <DownloadPageContent />
    </Suspense>
  );
}
