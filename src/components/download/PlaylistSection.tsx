"use client";

import { Box } from "@mui/material";
import { PlaylistControls } from "@/components/PlaylistControls";
import { PlaylistRowItem } from "@/components/download/PlaylistRowItem";
import type { PlaylistMetadata } from "@/types";

interface PlaylistSectionProps {
  metadata: PlaylistMetadata;
  playlistQuality: string;
  queueIndex: number;
  isQueueRunning: boolean;
  onQualityChange: (quality: string) => void;
  onStartQueue: () => void;
  onStopQueue: () => void;
  onQueueComplete: () => void;
  onRegisterCancel: (cancelFn: () => void) => void;
  onItemCancelled: (index: number) => void;
}

/**
 * Playlist download section with controls and item list
 */
export const PlaylistSection = ({
  metadata,
  playlistQuality,
  queueIndex,
  isQueueRunning,
  onQualityChange,
  onStartQueue,
  onStopQueue,
  onQueueComplete,
  onRegisterCancel,
  onItemCancelled,
}: PlaylistSectionProps) => {
  return (
    <Box>
      {/* Playlist Controls */}
      <PlaylistControls
        title={metadata.title}
        itemCount={metadata.item_count}
        thumbnail={metadata.thumbnail}
        uploader={metadata.uploader}
        viewCount={metadata.view_count}
        isQueueRunning={isQueueRunning}
        onStartQueue={onStartQueue}
        onStopQueue={onStopQueue}
        queueIndex={queueIndex}
        globalQuality={playlistQuality}
        onQualityChange={onQualityChange}
      />

      {/* Playlist Items */}
      <Box sx={{ mt: 4 }}>
        {metadata.items.map((item, idx) => (
          <PlaylistRowItem
            key={`${item.url}-${idx}`}
            item={item}
            index={idx}
            isActive={isQueueRunning && queueIndex === idx}
            onComplete={onQueueComplete}
            defaultQuality={playlistQuality}
            onRegisterCancel={onRegisterCancel}
            isQueueRunning={isQueueRunning}
            onItemCancelled={onItemCancelled}
          />
        ))}
      </Box>
    </Box>
  );
};

export default PlaylistSection;
