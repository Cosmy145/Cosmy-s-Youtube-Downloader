"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  InputBase,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { VideoMetadataCard } from "@/components/VideoMetadataCard";
import { QualityTable } from "@/components/QualityTable";
import { DetailedProgressBar } from "@/components/DetailedProgressBar";
import { PlaylistControls } from "@/components/PlaylistControls";
import { PlaylistItemAccordion } from "@/components/PlaylistItemAccordion";
import type { VideoMetadata, PlaylistItem, PlaylistMetadata } from "@/types";

// --- Hook Definition (kept inline for simplicity as requested, but cleaned up) ---
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

  // Helper to extract stats
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
      let speedVal = 1;
      if (serverProgress?.total) {
        const match = (serverProgress.total as string).match(/@\s*([\d.]+)x/);
        if (match) speedVal = parseFloat(match[1]);
      }
      if (speedVal > 0) {
        const etaSeconds = remaining / speedVal;
        const m = Math.floor(etaSeconds / 60);
        const s = Math.floor(etaSeconds % 60);
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
    try {
      await fetch(`/api/download?id=${downloadIdRef.current}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
      setProgress(-1);
      setServerProgress({});
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
}: {
  item: PlaylistItem;
  index: number;
  isActive: boolean;
  onComplete: () => void;
  defaultQuality: string;
}) => {
  const dl = useDownload();
  const [status, setStatus] = useState<
    "idle" | "downloading" | "completed" | "error"
  >("idle");
  const [expanded, setExpanded] = useState(false);

  // Auto-start queue logic
  useEffect(() => {
    if (isActive && status === "idle") {
      setStatus("downloading");
      dl.startDownload(item.url, defaultQuality, "video", item.title).catch(
        () => setStatus("error")
      );
    }
  }, [isActive, status, item.url, defaultQuality, item.title, dl]);

  // Completion watcher
  useEffect(() => {
    if (status === "downloading" && dl.progress === 100) {
      setStatus("completed");
      onComplete();
    } else if (status === "downloading" && dl.error) {
      setStatus("error");
      onComplete(); // Advance even on error
    }
  }, [dl.progress, dl.error, status, onComplete]);

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

  // Construct displayStats object for accordion
  const displayStatsObj = { percent: displayPercent, eta: displayEta };

  const qualities = [
    { quality: "best", hasAudio: true },
    { quality: "1080p", hasAudio: true },
    { quality: "720p", hasAudio: true },
    { quality: "audio", hasAudio: true },
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
      onCancel={dl.cancelDownload}
      isQueueRunning={isActive && status === "downloading"}
    />
  );
};

export default function Home() {
  const [url, setUrl] = useState("");
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
  const [playlistQuality, setPlaylistQuality] = useState("best");
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isQueueRunning, setIsQueueRunning] = useState(false);

  const fetchVideoInfo = async () => {
    if (!url) {
      setError("Please enter URL");
      return;
    }
    setLoading(true);
    setError("");
    setMetadata(null);
    setIsQueueRunning(false);
    setQueueIndex(-1); // Reset playlist state

    try {
      const response = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
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

  // Playlist Queue Handlers
  const startQueue = () => {
    setQueueIndex(0);
    setIsQueueRunning(true);
  };
  const stopQueue = () => {
    setIsQueueRunning(false);
    setQueueIndex(-1);
  };
  const handleQueueComplete = () => {
    if (!isQueueRunning || !metadata || metadata.type !== "playlist") return;
    setQueueIndex((prev) => {
      const next = prev + 1;
      if (next >= metadata.items.length) {
        setIsQueueRunning(false);
        return -1;
      }
      return next;
    });
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

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ textAlign: "center", mb: 8 }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 800,
            background:
              "linear-gradient(135deg, #a29bfe 0%, #6c5ce7 50%, #00d2d3 100%)",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: { xs: "2.5rem", md: "4rem" },
            mb: 2,
            letterSpacing: "-0.02em",
          }}
        >
          YouTube Downloader
        </Typography>
        <Typography
          variant="h5"
          color="text.secondary"
          sx={{ fontWeight: 400, opacity: 0.8 }}
        >
          Premium Quality Downloads • Playlists • 4K Support
        </Typography>
      </Box>

      <Paper
        elevation={0}
        component="form"
        sx={{
          p: "8px 16px",
          display: "flex",
          alignItems: "center",
          width: "100%",
          maxWidth: 800,
          mx: "auto",
          mb: 6,
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "50px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          transition: "all 0.3s ease",
          "&:focus-within": {
            background: "rgba(255,255,255,0.08)",
            borderColor: "#a29bfe",
            boxShadow: "0 12px 48px rgba(162, 155, 254, 0.2)",
          },
        }}
        onSubmit={(e: any) => {
          e.preventDefault();
          fetchVideoInfo();
        }}
      >
        <InputBase
          sx={{
            ml: 2,
            flex: 1,
            fontSize: "1.1rem",
            color: "#fff",
            "& .MuiInputBase-input::placeholder": {
              color: "rgba(255,255,255,0.5)",
              opacity: 1,
            },
          }}
          placeholder="Paste YouTube Video or Playlist URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading || singleDownload.downloading || isQueueRunning}
        />
        <Button
          type="submit"
          variant="contained"
          onClick={fetchVideoInfo}
          disabled={loading || singleDownload.downloading || isQueueRunning}
          sx={{
            borderRadius: "30px",
            px: 4,
            py: 1.2,
            background: "linear-gradient(45deg, #a29bfe, #6c5ce7)",
            boxShadow: "0 4px 15px rgba(108, 92, 231, 0.4)",
            textTransform: "none",
            fontSize: "1rem",
            fontWeight: 600,
            minWidth: "120px",
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Start"}
        </Button>
      </Paper>

      {error && (
        <Alert
          severity="error"
          sx={{ mt: 2, maxWidth: 800, mx: "auto", borderRadius: 2 }}
        >
          {error}
        </Alert>
      )}

      {metadata && !isPlaylist && (
        <Box>
          <VideoMetadataCard
            thumbnail={metadata.thumbnail}
            title={metadata.title}
            uploader={metadata.uploader}
            duration={formatDuration(metadata.duration)}
            viewCount={(metadata as any).view_count}
          />

          {singleDownload.downloading ? (
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
            />
          )}
        </Box>
      )}

      {metadata && isPlaylist && (
        <Box>
          <PlaylistControls
            title={metadata.title}
            itemCount={(metadata as PlaylistMetadata).item_count}
            thumbnail={metadata.thumbnail}
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
              />
            ))}
          </Box>
        </Box>
      )}
    </Container>
  );
}
