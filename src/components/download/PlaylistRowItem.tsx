"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useDownload } from "@/hooks/useDownload";
import { PlaylistItemAccordion } from "@/components/PlaylistItemAccordion";
import type { PlaylistItem } from "@/types";

interface PlaylistRowItemProps {
  item: PlaylistItem;
  index: number;
  isActive: boolean;
  onComplete: () => void;
  defaultQuality: string;
  onRegisterCancel: (cancelFn: () => void) => void;
  isQueueRunning: boolean;
  onItemCancelled: (index: number) => void;
}

type ItemStatus =
  | "idle"
  | "downloading"
  | "completed"
  | "error"
  | "cancelled"
  | "pending";

const QUALITY_OPTIONS = [
  { quality: "1080p", hasAudio: true },
  { quality: "720p", hasAudio: true },
  { quality: "480p", hasAudio: true },
  { quality: "360p", hasAudio: true },
  { quality: "192kbps", hasAudio: true },
  { quality: "128kbps", hasAudio: true },
];

/**
 * Individual playlist item with download management
 */
export const PlaylistRowItem = ({
  item,
  index,
  isActive,
  onComplete,
  defaultQuality,
  onRegisterCancel,
  isQueueRunning,
  onItemCancelled,
}: PlaylistRowItemProps) => {
  const dl = useDownload();
  const [status, setStatus] = useState<ItemStatus>("idle");
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
        () => {
          setStatus("error");
        }
      );
    }
  }, [isActive, status, item.url, defaultQuality, item.title, dl]);

  // Reset hasStarted when status changes back to idle
  useEffect(() => {
    if (status === "idle") {
      hasStartedRef.current = false;
    }
  }, [status]);

  // Reset status when queue stops and restarts
  useEffect(() => {
    if (isQueueRunning && (status === "cancelled" || status === "error")) {
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
  }, [status, dl, onComplete, isActive, onItemCancelled, index]);

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
  const handleManualDownload = (quality: string) => {
    setStatus("downloading");
    dl.startDownload(item.url, quality, "video", item.title);
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

  return (
    <PlaylistItemAccordion
      item={item}
      index={index}
      expanded={expanded}
      onExpand={() => setExpanded(!expanded)}
      qualities={QUALITY_OPTIONS}
      onDownload={handleManualDownload}
      status={status}
      progressObj={dl.serverProgress}
      displayStats={displayStatsObj}
      onCancel={handleCancel}
      isQueueRunning={isActive && status === "downloading"}
    />
  );
};

export default PlaylistRowItem;
