import { Box, Typography, IconButton, CircularProgress } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import VideocamIcon from "@mui/icons-material/Videocam";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState, useEffect, useRef } from "react";

interface QualityOption {
  quality: string;
  hasAudio: boolean;
}

interface QualityTableProps {
  qualities: QualityOption[];
  onDownload: (quality: string) => void;
  disabled?: boolean;
  videoUrl?: string;
  onTranscriptDownload?: (language: string) => void;
  transcriptDownloading?: boolean;
}

export const QualityTable = ({
  qualities,
  onDownload,
  disabled,
  videoUrl,
  onTranscriptDownload,
  transcriptDownloading,
}: QualityTableProps) => {
  const [activeTab, setActiveTab] = useState<"video" | "audio">("video");
  const [transcriptLang, setTranscriptLang] = useState("hi");
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);
  const wasDownloadingRef = useRef(false);

  // Close accordion when download completes
  useEffect(() => {
    if (wasDownloadingRef.current && !transcriptDownloading) {
      // Download just completed
      setTranscriptExpanded(false);
    }
    wasDownloadingRef.current = transcriptDownloading || false;
  }, [transcriptDownloading]);

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
    if (quality === "audio") return "AUDIO ONLY";

    // For kbps audio qualities
    if (quality.includes("kbps")) {
      const bitrate = parseInt(quality);
      let label = quality.toUpperCase();
      if (bitrate >= 192) label += " • HIGH QUALITY";
      else if (bitrate >= 128) label += " • GOOD QUALITY";
      else label += " • STANDARD";
      return label;
    }

    return quality.toUpperCase();
  };

  const getSizeEstimate = (quality: string) => {
    // High resolution video estimates
    if (quality === "8k" || quality === "4320p") return "~8 GB";
    if (quality === "5k" || quality === "2880p") return "~6 GB";
    if (quality === "4k" || quality === "2160p" || quality === "best")
      return "~4 GB";

    // Standard resolution video estimates
    if (quality === "1440p") return "~2.5 GB";
    if (quality === "1080p") return "~1.5 GB";
    if (quality === "720p") return "~800 MB";
    if (quality === "480p") return "~400 MB";
    if (quality === "360p") return "~200 MB";

    // Audio estimates based on bitrate
    if (quality.includes("kbps")) {
      const bitrate = parseInt(quality);
      if (bitrate >= 192) return "~15 MB";
      if (bitrate >= 160) return "~12 MB";
      if (bitrate >= 128) return "~10 MB";
      return "~8 MB";
    }

    if (quality === "audio") return "~10 MB";

    return null;
  };

  const currentQualities =
    activeTab === "video" ? videoQualities : audioQualities;

  const QualityRow = ({ quality }: { quality: string }) => (
    <Box
      onClick={() => !disabled && onDownload(quality)}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        py: 2,
        px: 3,
        mb: 1.5,
        bgcolor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "8px",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        opacity: disabled ? 0.5 : 1,
        "&:hover": disabled
          ? {}
          : {
              bgcolor: "rgba(255,255,255,0.06)",
              borderColor: "rgba(255,255,255,0.2)",
            },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            bgcolor: "#FF0000",
            borderRadius: "50%",
          }}
        />
        <Box>
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "0.5px",
            }}
          >
            {getQualityLabel(quality)}
          </Typography>
          {getSizeEstimate(quality) && (
            <Typography
              sx={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.5)",
                mt: 0.3,
              }}
            >
              Approx. {getSizeEstimate(quality)}
            </Typography>
          )}
        </Box>
      </Box>

      <IconButton
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          onDownload(quality);
        }}
        sx={{
          color: "#fff",
          bgcolor: "rgba(255,0,0,0.1)",
          "&:hover": { bgcolor: "rgba(255,0,0,0.2)" },
        }}
      >
        <DownloadIcon />
      </IconButton>
    </Box>
  );

  return (
    <Box>
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

      {/* Transcript Download Accordion */}
      {onTranscriptDownload && (
        <Box
          sx={{
            mt: 3,
            pt: 3,
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {/* Accordion Header */}
          <Box
            onClick={() => setTranscriptExpanded(!transcriptExpanded)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              py: 2,
              px: 3,
              bgcolor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: transcriptExpanded ? "8px 8px 0 0" : "8px",
              cursor: "pointer",
              transition: "all 0.2s",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.06)",
                borderColor: "rgba(255,255,255,0.2)",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                component="svg"
                sx={{ width: 24, height: 24, fill: "#fff" }}
                viewBox="0 0 24 24"
              >
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M7,11H17V13H7V11M7,15H17V17H7V15Z" />
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#fff",
                    letterSpacing: "0.5px",
                  }}
                >
                  TRANSCRIPT
                </Typography>
                <Typography
                  sx={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.5)",
                    mt: 0.3,
                  }}
                >
                  {transcriptExpanded
                    ? "Select language"
                    : `Download (${transcriptLang.toUpperCase()})`}
                </Typography>
              </Box>
            </Box>

            <ExpandMoreIcon
              sx={{
                color: "#fff",
                transform: transcriptExpanded
                  ? "rotate(180deg)"
                  : "rotate(0deg)",
                transition: "transform 0.3s",
              }}
            />
          </Box>

          {/* Accordion Content - Language Selection */}
          {transcriptExpanded && (
            <Box
              sx={{
                bgcolor: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderTop: "none",
                borderRadius: "0 0 8px 8px",
                p: 3,
              }}
            >
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.5)",
                  mb: 2,
                }}
              >
                SELECT LANGUAGE:
              </Typography>

              {/* Language Options */}
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
                {[
                  { code: "hi", label: "Hindi" },
                  { code: "en", label: "English" },
                  { code: "es", label: "Spanish" },
                  { code: "fr", label: "French" },
                ].map((lang) => (
                  <Box
                    key={lang.code}
                    onClick={() => setTranscriptLang(lang.code)}
                    sx={{
                      px: 3,
                      py: 1.5,
                      bgcolor:
                        transcriptLang === lang.code
                          ? "#FF0000"
                          : "rgba(255,255,255,0.05)",
                      border: `1px solid ${
                        transcriptLang === lang.code
                          ? "#FF0000"
                          : "rgba(255,255,255,0.1)"
                      }`,
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      "&:hover": {
                        bgcolor:
                          transcriptLang === lang.code
                            ? "#CC0000"
                            : "rgba(255,255,255,0.08)",
                        borderColor:
                          transcriptLang === lang.code
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
                      {lang.label}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Download Button */}
              <Box
                onClick={() => {
                  if (!disabled && !transcriptDownloading) {
                    onTranscriptDownload(transcriptLang);
                  }
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1.5,
                  py: 2,
                  px: 3,
                  bgcolor: "#FF0000",
                  borderRadius: "8px",
                  cursor:
                    disabled || transcriptDownloading
                      ? "not-allowed"
                      : "pointer",
                  opacity: disabled || transcriptDownloading ? 0.5 : 1,
                  transition: "all 0.2s",
                  "&:hover": {
                    bgcolor:
                      disabled || transcriptDownloading ? "#FF0000" : "#CC0000",
                  },
                }}
              >
                {transcriptDownloading ? (
                  <>
                    <CircularProgress size={20} sx={{ color: "#fff" }} />
                    <Typography
                      sx={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}
                    >
                      Downloading...
                    </Typography>
                  </>
                ) : (
                  <>
                    <DownloadIcon sx={{ fontSize: 20 }} />
                    <Typography
                      sx={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}
                    >
                      Download {transcriptLang.toUpperCase()} Transcript
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};
