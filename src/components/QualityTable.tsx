import { Box, Typography, IconButton } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import VideocamIcon from "@mui/icons-material/Videocam";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import { useState } from "react";

interface QualityOption {
  quality: string;
  hasAudio: boolean;
}

interface QualityTableProps {
  qualities: QualityOption[];
  onDownload: (quality: string) => void;
  disabled?: boolean;
}

export const QualityTable = ({
  qualities,
  onDownload,
  disabled,
}: QualityTableProps) => {
  const [activeTab, setActiveTab] = useState<"video" | "audio">("video");

  // Separate video and audio qualities - only show 360p and above for video
  const videoQualities = qualities.filter((q) => {
    if (q.quality === "audio" || q.quality.includes("kbps")) return false;

    // Extract resolution number
    const resMatch = q.quality.match(/(\d+)p/);
    if (!resMatch) return q.quality === "best"; // Keep "best" quality

    const resolution = parseInt(resMatch[1]);
    return resolution >= 360; // Only 360p and above
  });

  // Only show top 3 audio qualities
  const audioQualities = qualities
    .filter((q) => q.quality === "audio" || q.quality.includes("kbps"))
    .slice(0, 3);

  const getQualityLabel = (quality: string) => {
    if (quality === "best") return "4K ULTRA HD";
    if (quality === "8k" || quality === "4320p") return "8K ULTRA HD";
    if (quality === "5k" || quality === "2880p") return "5K ULTRA HD";
    if (quality === "4k" || quality === "2160p") return "4K ULTRA HD";
    if (quality === "1440p") return "2K QHD";
    if (quality === "1080p") return "1080P HD";
    if (quality === "720p") return "720P HD";
    if (quality === "480p") return "480P SD";
    if (quality === "360p") return "360P SD";

    // Dynamic audio bitrate handling
    if (quality.includes("kbps") || quality === "audio") {
      const bitrateMatch = quality.match(/(\d+)kbps/);
      if (bitrateMatch) {
        return `${bitrateMatch[1]}KBPS`;
      }
      return "BEST AUDIO";
    }

    return quality.toUpperCase();
  };

  const getQualityDetails = (quality: string) => {
    if (quality === "best") return "2160p • ~4 GB";
    if (quality === "8k" || quality === "4320p") return "4320p • ~12 GB";
    if (quality === "5k" || quality === "2880p") return "2880p • ~7 GB";
    if (quality === "4k" || quality === "2160p") return "2160p • ~4 GB";
    if (quality === "1440p") return "1440p • ~1.5 GB";
    if (quality === "1080p") return "1080p • ~859 MB";
    if (quality === "720p") return "720p • ~320 MB";
    if (quality === "480p") return "480p • ~180 MB";
    if (quality === "360p") return "360p • ~120 MB";

    // Dynamic audio size estimation (rough: bitrate * 3.5 minutes average song)
    if (quality.includes("kbps")) {
      const bitrateMatch = quality.match(/(\d+)kbps/);
      if (bitrateMatch) {
        const bitrate = parseInt(bitrateMatch[1]);
        const estimatedMB = Math.round((bitrate * 210) / 8000); // 3.5 min * 60 sec = 210 sec

        if (bitrate >= 256) return `high quality • ~${estimatedMB} MB`;
        if (bitrate >= 160) return `good quality • ~${estimatedMB} MB`;
        return `standard • ~${estimatedMB} MB`;
      }
    }

    if (quality === "audio") return "best quality • ~18 MB";
    return "standard quality";
  };

  const getFormatBadge = (quality: string) => {
    if (quality === "audio" || quality.includes("kbps")) {
      return "MP3";
    }
    return "MP4";
  };

  const QualityRow = ({ quality }: { quality: string }) => (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: 2.5,
        mb: 2,
        bgcolor: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "8px",
        transition: "all 0.2s",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        "&:hover": disabled
          ? {}
          : {
              bgcolor: "rgba(255,255,255,0.05)",
              borderColor: "rgba(255,255,255,0.2)",
            },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
        {/* Format Badge */}
        <Box
          sx={{
            bgcolor: "#000",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "4px",
            px: 1,
            py: 0.5,
            minWidth: 45,
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {getFormatBadge(quality)}
          </Typography>
        </Box>

        {/* Quality Info */}
        <Box>
          <Typography
            sx={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#fff",
              mb: 0.5,
            }}
          >
            {getQualityLabel(quality)}
          </Typography>
          <Typography
            sx={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            {getQualityDetails(quality)}
          </Typography>
        </Box>
      </Box>

      {/* Download Button */}
      <IconButton
        onClick={() => !disabled && onDownload(quality)}
        disabled={disabled}
        sx={{
          color: "rgba(255,255,255,0.6)",
          "&:hover": {
            color: "#FF0000",
            bgcolor: "rgba(255,0,0,0.1)",
          },
        }}
      >
        <DownloadIcon />
      </IconButton>
    </Box>
  );

  const currentQualities =
    activeTab === "video" ? videoQualities : audioQualities;

  return (
    <Box>
      {/* Tab Toggle */}
      <Box
        sx={{
          display: "flex",
          gap: 0,
          mb: 4,
          bgcolor: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "8px",
          p: 0.5,
        }}
      >
        <Box
          onClick={() => setActiveTab("video")}
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
            py: 1.5,
            px: 3,
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.2s",
            bgcolor:
              activeTab === "video" ? "rgba(255,255,255,0.08)" : "transparent",
            "&:hover": {
              bgcolor:
                activeTab === "video"
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(255,255,255,0.03)",
            },
          }}
        >
          <VideocamIcon
            sx={{
              color: activeTab === "video" ? "#fff" : "rgba(255,255,255,0.4)",
              fontSize: 24,
              transition: "color 0.2s",
            }}
          />
          <Typography
            sx={{
              fontSize: "16px",
              fontWeight: 700,
              color: activeTab === "video" ? "#fff" : "rgba(255,255,255,0.4)",
              letterSpacing: "1px",
              transition: "color 0.2s",
            }}
          >
            VIDEO
          </Typography>
        </Box>

        <Box
          onClick={() => setActiveTab("audio")}
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
            py: 1.5,
            px: 3,
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.2s",
            bgcolor:
              activeTab === "audio" ? "rgba(255,255,255,0.08)" : "transparent",
            "&:hover": {
              bgcolor:
                activeTab === "audio"
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(255,255,255,0.03)",
            },
          }}
        >
          <HeadphonesIcon
            sx={{
              color: activeTab === "audio" ? "#fff" : "rgba(255,255,255,0.4)",
              fontSize: 24,
              transition: "color 0.2s",
            }}
          />
          <Typography
            sx={{
              fontSize: "16px",
              fontWeight: 700,
              color: activeTab === "audio" ? "#fff" : "rgba(255,255,255,0.4)",
              letterSpacing: "1px",
              transition: "color 0.2s",
            }}
          >
            AUDIO
          </Typography>
        </Box>
      </Box>

      {/* Quality List */}
      <Box>
        {currentQualities.map((q) => (
          <QualityRow key={q.quality} quality={q.quality} />
        ))}
      </Box>
    </Box>
  );
};
