import { Box, Button, Typography } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import VideocamIcon from "@mui/icons-material/Videocam";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import { useState } from "react";

interface PlaylistControlsProps {
  title: string;
  itemCount: number;
  thumbnail: string;
  uploader?: string;
  viewCount?: number;
  isQueueRunning: boolean;
  onStartQueue: () => void;
  onStopQueue: () => void;
  queueIndex: number;
  globalQuality: string;
  onQualityChange: (q: string) => void;
}

export const PlaylistControls = ({
  title,
  itemCount,
  thumbnail,
  uploader,
  viewCount,
  isQueueRunning,
  onStartQueue,
  onStopQueue,
  queueIndex,
  globalQuality,
  onQualityChange,
}: PlaylistControlsProps) => {
  const [activeTab, setActiveTab] = useState<"video" | "audio">(
    globalQuality.includes("kbps") ? "audio" : "video"
  );

  // Video qualities (360p and above)
  const videoQualities = [
    { value: "1080p", label: "1080P" },
    { value: "720p", label: "720P" },
    { value: "480p", label: "480P" },
    { value: "360p", label: "360P" },
  ];

  // Audio qualities
  const audioQualities = [
    { value: "192kbps", label: "192KBPS" },
    { value: "160kbps", label: "160KBPS" },
    { value: "128kbps", label: "128KBPS" },
  ];

  const handleQualitySelect = (quality: string) => {
    onQualityChange(quality);
  };

  const currentQualities =
    activeTab === "video" ? videoQualities : audioQualities;

  return (
    <Box
      sx={{
        mb: 4,
        bgcolor: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "12px",
        overflow: "hidden",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Playlist Header with Thumbnail */}
      <Box sx={{ display: "flex", bgcolor: "rgba(0,0,0,0.4)" }}>
        {/* Thumbnail */}
        {thumbnail && (
          <Box
            sx={{
              width: { xs: 250, md: 350 },
              height: { xs: 200, md: 260 },
              bgcolor: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src={thumbnail}
              alt={title}
              sx={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          </Box>
        )}

        {/* Playlist Info */}
        <Box
          sx={{
            flex: 1,
            p: 4,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: "24px", md: "36px" },
              fontWeight: 900,
              color: "#fff",
              mb: 2,
              textTransform: "uppercase",
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>

          <Box
            sx={{
              display: "flex",
              gap: 3,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {uploader && (
              <Typography
                sx={{
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: 600,
                }}
              >
                By {uploader}
              </Typography>
            )}

            <Typography
              sx={{
                fontSize: "14px",
                color: "rgba(255,255,255,0.7)",
                fontWeight: 600,
              }}
            >
              {itemCount} videos
            </Typography>

            {viewCount && viewCount > 0 && (
              <Typography
                sx={{
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: 600,
                }}
              >
                {viewCount.toLocaleString()} views
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Controls Section */}
      <Box sx={{ p: 4 }}>
        {/* Tab Toggle */}
        <Box
          sx={{
            display: "flex",
            gap: 0,
            mb: 3,
            bgcolor: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            p: 0.5,
          }}
        >
          <Box
            onClick={() => {
              setActiveTab("video");
              if (activeTab === "audio") {
                onQualityChange("1080p");
              }
            }}
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
                activeTab === "video"
                  ? "rgba(255,255,255,0.08)"
                  : "transparent",
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
            onClick={() => {
              setActiveTab("audio");
              if (activeTab === "video") {
                onQualityChange("192kbps");
              }
            }}
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
                activeTab === "audio"
                  ? "rgba(255,255,255,0.08)"
                  : "transparent",
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

        {/* Quality Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.5)",
              mb: 2,
            }}
          >
            SELECT QUALITY FOR ALL DOWNLOADS:
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {currentQualities.map((quality) => (
              <Box
                key={quality.value}
                onClick={() => handleQualitySelect(quality.value)}
                sx={{
                  px: 3,
                  py: 1.5,
                  bgcolor:
                    globalQuality === quality.value
                      ? "#FF0000"
                      : "rgba(255,255,255,0.05)",
                  border: `1px solid ${
                    globalQuality === quality.value
                      ? "#FF0000"
                      : "rgba(255,255,255,0.1)"
                  }`,
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": {
                    bgcolor:
                      globalQuality === quality.value
                        ? "#CC0000"
                        : "rgba(255,255,255,0.08)",
                    borderColor:
                      globalQuality === quality.value
                        ? "#CC0000"
                        : "rgba(255,255,255,0.2)",
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {quality.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {!isQueueRunning ? (
            <Button
              onClick={onStartQueue}
              startIcon={<PlayArrowIcon />}
              sx={{
                bgcolor: "#FF0000",
                color: "#fff",
                px: 4,
                py: 1.5,
                fontSize: "14px",
                fontWeight: 700,
                borderRadius: "8px",
                textTransform: "none",
                "&:hover": { bgcolor: "#CC0000" },
              }}
            >
              Download All ({itemCount})
            </Button>
          ) : (
            <>
              <Button
                onClick={onStopQueue}
                startIcon={<StopIcon />}
                sx={{
                  bgcolor: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  px: 4,
                  py: 1.5,
                  fontSize: "14px",
                  fontWeight: 700,
                  borderRadius: "8px",
                  textTransform: "none",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.15)" },
                }}
              >
                Stop All
              </Button>
              <Typography
                sx={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}
              >
                {queueIndex} / {itemCount} completed
              </Typography>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};
