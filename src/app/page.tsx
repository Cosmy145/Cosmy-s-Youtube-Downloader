"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./page.module.css";
import type { VideoMetadata, PlaylistItem, PlaylistMetadata } from "@/types";

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

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = [
      "Bytes",
      "KiB",
      "MiB",
      "GiB",
      "TiB",
      "PiB",
      "EiB",
      "ZiB",
      "YiB",
    ];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
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
        // 1. Start listening for progress via SSE
        eventSource = new EventSource(`/api/download?id=${downloadId}`);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (e) => {
          if (isCompleted) return;
          try {
            const d = JSON.parse(e.data);
            setServerProgress({ ...d, phase: d.status || "downloading" });

            // Keep SSE open during conversion - only close when truly done
            // The conversion phase sends percent=100 with downloaded="Converting"
            if (d.status === "streaming" && d.downloaded !== "Converting") {
              // Browser is receiving the file now - we're truly done
              isCompleted = true;
              setProgress(100);
              setDownloading(false);
              eventSource?.close();
            }
          } catch (err) {}
        };

        eventSource.onerror = () => {
          // SSE connection closed or failed - clean up UI
          if (!isCompleted) {
            isCompleted = true;
            setDownloading(false);
            eventSource?.close();
          }
        };

        // 2. Trigger Direct Download (Browser Native)
        const params = new URLSearchParams({
          url,
          quality,
          format,
          id: downloadId,
        });
        if (title) params.append("title", title);

        // Use window.location.href to trigger download while keeping page active
        // (Content-Disposition: attachment prevents navigation)
        window.location.href = `/api/download?${params.toString()}`;
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
      // Cancel on server
      await fetch(`/api/download?id=${downloadIdRef.current}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to cancel download:", err);
    } finally {
      // Cleanup local state
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

  const stats =
    serverProgress && (serverProgress.speed || serverProgress.total)
      ? {
          speed: serverProgress.speed || "0MB/s",
          eta: serverProgress.eta || "00:00",
          total: serverProgress.total || "0MB",
          downloaded: serverProgress.downloaded || "0MB",
          percent: serverProgress.percent || 0,
        }
      : null;

  return {
    downloading,
    progress,
    serverProgress,
    error,
    startDownload,
    cancelDownload,
    formatBytes,
    stats,
  };
};

const formatDuration = (seconds?: number) => {
  if (!seconds) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

interface PlaylistItemRowProps {
  item: PlaylistItem;
  index: number;
  isActive: boolean;
  onComplete: () => void;
  quality: string;
}

const PlaylistItemRow = ({
  item,
  index,
  isActive,
  onComplete,
  quality,
}: PlaylistItemRowProps) => {
  const {
    downloading,
    progress,
    serverProgress,
    startDownload,
    cancelDownload,
    formatBytes,
    stats,
    error,
  } = useDownload();
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (isActive && !downloading && !isCompleted) {
      handleDownload();
    }
  }, [isActive, downloading, isCompleted]);

  const handleDownload = async () => {
    if (downloading || isCompleted) return;
    await startDownload(item.url, quality, "video", item.title);
    if (!error) setIsCompleted(true);
    onComplete(); // Notify parent to fetch next
  };

  return (
    <div className={styles.playlistItem}>
      <div className={styles.itemIndex}>{index + 1}</div>
      {item.thumbnail && (
        <img
          src={item.thumbnail}
          alt={item.title}
          className={styles.itemThumbnail}
        />
      )}
      <div className={styles.itemInfo}>
        <span className={styles.itemTitle}>{item.title}</span>
        <div className={styles.itemMeta}>
          {item.uploader} • {formatDuration(item.duration)}
        </div>
      </div>

      <div className={styles.itemAction}>
        {downloading ? (
          <div style={{ textAlign: "right" }}>
            <div className={styles.miniProgress}>
              {serverProgress.phase === "downloading"
                ? `Server: ${serverProgress.percent.toFixed(0)}%`
                : `Downloading: ${progress > 0 ? progress + "%" : "..."}`}
            </div>
            <button
              className={`${styles.miniButton} ${styles.cancel}`}
              onClick={cancelDownload}
              style={{ marginTop: "4px" }}
            >
              Cancel
            </button>
          </div>
        ) : isCompleted ? (
          <span style={{ color: "green", fontWeight: 600 }}>✓ Done</span>
        ) : (
          <button className={styles.miniButton} onClick={handleDownload}>
            Download
          </button>
        )}
        {error && <div style={{ color: "red", fontSize: "0.8rem" }}>Error</div>}
      </div>
    </div>
  );
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<
    (VideoMetadata & { availableQualities: { quality: string }[] }) | null
  >(null);
  const [error, setError] = useState("");
  const [selectedQuality, setSelectedQuality] = useState("best");

  // Single Video Hook
  const singleDownload = useDownload();

  // Playlist Auto-Download State
  // Playlist Queue State
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isQueueRunning, setIsQueueRunning] = useState(false);
  const [playlistQuality, setPlaylistQuality] = useState("best");
  const PLAYLIST_QUALITIES = [
    "best",
    "2160p",
    "1440p",
    "1080p",
    "720p",
    "480p",
    "360p",
  ];

  const startQueue = () => {
    setQueueIndex(0);
    setIsQueueRunning(true);
  };

  const stopQueue = () => {
    setIsQueueRunning(false);
    setQueueIndex(-1);
  };

  const handleQueueComplete = () => {
    if (isQueueRunning && metadata?.type === "playlist") {
      setQueueIndex((prev) => {
        const next = prev + 1;
        if (next >= metadata.items.length) {
          setIsQueueRunning(false);
          return -1;
        }
        return next;
      });
    }
  };

  const fetchVideoInfo = async () => {
    if (!url) {
      setError("Please enter a YouTube URL");
      return;
    }

    setLoading(true);
    setError("");
    setMetadata(null);
    stopQueue();

    try {
      const response = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (data.success) {
        setMetadata(data.data);
        if (
          data.data.availableQualities &&
          data.data.availableQualities.length > 0
        ) {
          setSelectedQuality(data.data.availableQualities[0].quality);
        }
      } else {
        setError(data.error || "Failed to fetch video info");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSingleDownload = () => {
    if (!metadata) return;
    singleDownload.startDownload(
      metadata.original_url || url,
      selectedQuality,
      "video",
      metadata.title
    );
  };

  // Determine view type
  const isPlaylist = metadata?.type === "playlist";

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>YouTube Downloader</h1>
        <p className={styles.subtitle}>
          Download Videos & Playlists in High Quality
        </p>

        <div className={styles.inputGroup}>
          <input
            type="text"
            className={styles.input}
            placeholder="Paste YouTube Video or Playlist URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchVideoInfo()}
          />
          <button
            className={styles.fetchButton}
            onClick={fetchVideoInfo}
            disabled={loading}
          >
            {loading ? "Loading..." : "Get Info"}
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {metadata && !isPlaylist && (
          // Single Video View
          <div className={styles.videoInfo}>
            <img
              src={metadata.thumbnail}
              alt={metadata.title}
              className={styles.thumbnail}
            />
            <h2 className={styles.videoTitle}>{metadata.title}</h2>
            <p className={styles.videoMeta}>
              {metadata.uploader} • {formatDuration(metadata.duration)}
            </p>

            <div className={styles.qualitySection}>
              <label className={styles.label}>Select Quality:</label>
              <select
                className={styles.select}
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(e.target.value)}
              >
                <option value="best">Best Quality</option>
                {metadata.availableQualities.map((q) => (
                  <option key={q.quality} value={q.quality}>
                    {q.quality}
                  </option>
                ))}
              </select>
            </div>

            {!singleDownload.downloading ? (
              <button
                className={styles.downloadButton}
                onClick={handleSingleDownload}
                disabled={singleDownload.downloading}
              >
                Download Video
              </button>
            ) : (
              <button
                className={styles.cancelButton}
                onClick={singleDownload.cancelDownload}
              >
                Cancel Download
              </button>
            )}

            {singleDownload.downloading && (
              <div className={styles.progressContainer}>
                {/* Phase 1: Server Download */}
                {singleDownload.serverProgress.phase === "downloading" &&
                  singleDownload.serverProgress.downloaded !== "Converting" && (
                    <div className={styles.phaseInfo}>
                      <h4>Downloading to Server...</h4>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{
                            width: `${singleDownload.serverProgress.percent}%`,
                          }}
                        />
                      </div>
                      <div className={styles.progressStats}>
                        <span>
                          {singleDownload.serverProgress.percent.toFixed(1)}%
                        </span>
                        <span>
                          {singleDownload.serverProgress.speed} • ETA:{" "}
                          {singleDownload.serverProgress.eta}
                        </span>
                      </div>
                    </div>
                  )}

                {/* Phase 2: Converting (4K HEVC encoding) */}
                {singleDownload.serverProgress.downloaded === "Converting" && (
                  <div className={styles.phaseInfo}>
                    <h4>🎬 Converting Video...</h4>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFillIndeterminate} />
                    </div>
                    <div className={styles.progressStats}>
                      <span>{singleDownload.serverProgress.speed}</span>
                      <span>{singleDownload.serverProgress.total}</span>
                    </div>
                  </div>
                )}

                {/* Phase 3: Streaming */}
                {singleDownload.serverProgress.phase === "streaming" && (
                  <div className={styles.phaseInfo}>
                    <h4>Saving to Device...</h4>
                    <div className={styles.progressBar}>
                      <div
                        className={
                          singleDownload.progress === -1
                            ? styles.progressFillIndeterminate
                            : styles.progressFill
                        }
                        style={
                          singleDownload.progress === -1
                            ? {}
                            : { width: `${singleDownload.progress}%` }
                        }
                      />
                    </div>
                    <div className={styles.progressStats}>
                      <span>
                        {singleDownload.progress > 0
                          ? singleDownload.progress + "%"
                          : "Processing..."}
                      </span>
                      {singleDownload.stats && (
                        <span>
                          {singleDownload.stats.total} •{" "}
                          {singleDownload.stats.speed} • ETA{" "}
                          {singleDownload.stats.eta}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {metadata && isPlaylist && (
          // Playlist View
          <div className={styles.playlistContainer}>
            <div className={styles.playlistHeader}>
              {metadata.thumbnail && (
                <img
                  src={metadata.thumbnail}
                  alt={metadata.title}
                  className={styles.playlistThumbnail}
                />
              )}
              <div className={styles.playlistHeaderContent}>
                <h2 className={styles.playlistTitle}>{metadata.title}</h2>
                <div className={styles.playlistMeta}>
                  {metadata.uploader} •{" "}
                  {(metadata as PlaylistMetadata).item_count} Videos
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <span
                    style={{
                      fontSize: "0.9rem",
                      marginRight: "10px",
                      fontWeight: 600,
                    }}
                  >
                    Quality:
                  </span>
                  <select
                    className={styles.select}
                    style={{ width: "auto", padding: "6px 12px" }}
                    value={playlistQuality}
                    onChange={(e) => setPlaylistQuality(e.target.value)}
                  >
                    {PLAYLIST_QUALITIES.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>

                {!isQueueRunning ? (
                  <button
                    className={styles.downloadAllButton}
                    onClick={startQueue}
                  >
                    Download All Queue ({playlistQuality})
                  </button>
                ) : (
                  <button
                    className={styles.downloadAllButton}
                    style={{ background: "#ff6b6b" }}
                    onClick={stopQueue}
                  >
                    Stop Queue ({queueIndex + 1}/
                    {(metadata as PlaylistMetadata).item_count})
                  </button>
                )}
              </div>
            </div>

            <div className={styles.playlistItems}>
              {(metadata as PlaylistMetadata).items.map((item, index) => (
                <PlaylistItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  isActive={isQueueRunning && index === queueIndex}
                  onComplete={handleQueueComplete}
                  quality={playlistQuality}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
