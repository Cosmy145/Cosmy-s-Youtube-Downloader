"use client";

import { Box } from "@mui/material";
import { VideoMetadataCard } from "@/components/VideoMetadataCard";
import { QualityTable } from "@/components/QualityTable";
import { DetailedProgressBar } from "@/components/DetailedProgressBar";
import { formatDuration } from "@/lib/utils";
import type { SingleVideoMetadata } from "@/types";

interface ServerProgress {
  phase?: string;
  percent: number;
  downloaded?: string;
  total?: string;
  speed?: string;
  eta?: string;
}

interface VideoDownloadSectionProps {
  metadata: SingleVideoMetadata & {
    availableQualities?: { quality: string; hasAudio: boolean }[];
  };
  downloading: boolean;
  serverProgress: ServerProgress;
  displayPercent: number;
  displayEta: string;
  transcriptDownloading: boolean;
  onDownload: (quality: string) => void;
  onCancel: () => void;
  onTranscriptDownload: (language: string) => void;
}

/**
 * Single video download section with metadata and quality selection
 */
export const VideoDownloadSection = ({
  metadata,
  downloading,
  serverProgress,
  displayPercent,
  displayEta,
  transcriptDownloading,
  onDownload,
  onCancel,
  onTranscriptDownload,
}: VideoDownloadSectionProps) => {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        gap: 4,
      }}
    >
      {/* Video Metadata Card */}
      <VideoMetadataCard
        thumbnail={metadata.thumbnail}
        title={metadata.title}
        uploader={metadata.uploader}
        duration={formatDuration(metadata.duration)}
        viewCount={metadata.view_count}
      />

      {/* Download Section */}
      <Box>
        {downloading ? (
          <DetailedProgressBar
            phase={serverProgress.phase || "downloading"}
            percent={displayPercent}
            speed={serverProgress.speed || "Calculating..."}
            eta={displayEta}
            total={serverProgress.total || "..."}
            downloaded={serverProgress.downloaded || "..."}
            onCancel={onCancel}
          />
        ) : (
          <QualityTable
            qualities={metadata.availableQualities || []}
            onDownload={onDownload}
            transcriptDownloading={transcriptDownloading}
            onTranscriptDownload={onTranscriptDownload}
          />
        )}
      </Box>
    </Box>
  );
};

export default VideoDownloadSection;
