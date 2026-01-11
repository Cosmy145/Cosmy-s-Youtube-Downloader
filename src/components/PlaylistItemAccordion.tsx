import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  LinearProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { QualityTable } from "./QualityTable";
import { DetailedProgressBar } from "./DetailedProgressBar";
import { VideoMetadataCard } from "./VideoMetadataCard";

interface PlaylistItemAccordionProps {
  item: any;
  index: number;
  expanded: boolean;
  onExpand: () => void;
  // State from parent
  qualities: any[];
  onDownload: (quality: string) => void;
  // Queue/Download State
  status: "idle" | "downloading" | "completed" | "error";
  progressObj?: any; // serverProgress
  displayStats?: any; // { percent, eta... }
  onCancel?: () => void;
  isQueueRunning: boolean;
}

export const PlaylistItemAccordion = ({
  item,
  index,
  expanded,
  onExpand,
  qualities,
  onDownload,
  status,
  progressObj,
  displayStats,
  onCancel,
  isQueueRunning,
}: PlaylistItemAccordionProps) => {
  return (
    <Accordion
      expanded={expanded}
      onChange={onExpand}
      sx={{
        background: "rgba(255,255,255,0.02)",
        mb: 2,
        borderRadius: "16px !important",
        border: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(10px)",
        "&:before": { display: "none" },
        transition: "all 0.3s ease",
        "&:hover": {
          background: "rgba(255,255,255,0.04)",
          transform: "translateX(4px)",
        },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box
          sx={{ display: "flex", alignItems: "center", width: "100%", gap: 2 }}
        >
          <Typography color="text.secondary" sx={{ minWidth: 24 }}>
            {index + 1}.
          </Typography>

          <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 2 }}>
            <Typography sx={{ fontWeight: 500 }}>{item.title}</Typography>
            {status === "completed" && (
              <Chip
                icon={<CheckCircleIcon />}
                label="Done"
                color="success"
                size="small"
                variant="outlined"
              />
            )}
            {status === "downloading" && (
              <Chip
                label={isQueueRunning ? "Queue Active" : "Downloading..."}
                color="primary"
                size="small"
                variant="outlined"
              />
            )}
            {status === "error" && (
              <Chip
                label="Error"
                color="error"
                size="small"
                variant="outlined"
              />
            )}
          </Box>

          {/* Mini Progress Bar in Summary if collapsed and downloading */}
          {!expanded && status === "downloading" && displayStats && (
            <Box sx={{ width: 100, mr: 2 }}>
              <LinearProgress
                variant="determinate"
                value={displayStats.percent}
              />
            </Box>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <VideoMetadataCard
          thumbnail={item.thumbnail}
          title={item.title}
          uploader={item.uploader}
          duration={
            item.duration
              ? `${Math.floor(item.duration / 60)}:${(item.duration % 60)
                  .toString()
                  .padStart(2, "0")}`
              : "--:--"
          }
        />

        {status === "downloading" && progressObj ? (
          <DetailedProgressBar
            phase={progressObj.phase}
            percent={displayStats.percent}
            speed={progressObj.speed || ""}
            eta={displayStats.eta || ""}
            total={progressObj.total || ""}
            downloaded={progressObj.downloaded || ""}
            onCancel={onCancel!}
          />
        ) : (
          <QualityTable
            qualities={qualities} // We might need to fetch individual qualities? Or use global defaults?
            // For playlists, usually we use 'best' or standard formats unless we fetch metadata for EACH item.
            // As per existing logic, we only have 'flat-playlist' so we don't have individual formats until we fetch them?
            // Actually, yt-dlp --flat-playlist DOESN'T return formats.
            // So we might only show a "Download Best" button or "Download 1080p" etc.
            // But if we want individual selection, we'd need to fetch metadata for that specific video.
            // For now, let's provide "Standard Qualities" list or just use what we have.
            // The user requested: "user can select it's quality seperately".
            // This implies generating a generic list [Best, 1080p, 720p...] since we haven't fetched deep metadata yet.
            onDownload={onDownload}
            disabled={status === "completed"}
          />
        )}
      </AccordionDetails>
    </Accordion>
  );
};
