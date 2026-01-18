import { Box, Typography } from "@mui/material";

interface VideoMetadataCardProps {
  thumbnail: string;
  title: string;
  uploader: string;
  duration: string;
  viewCount?: number;
}

export const VideoMetadataCard = ({
  thumbnail,
  title,
  uploader,
  duration,
  viewCount,
}: VideoMetadataCardProps) => {
  // Split title to highlight the last part in red (if contains certain keywords)
  const highlightTitle = (titleText: string) => {
    const parts = titleText.split(/(\bLIVE\b|\bSET\b)/gi);
    return parts.map((part, i) => {
      if (/live|set/i.test(part)) {
        return (
          <Box component="span" key={i} sx={{ color: "#FF0000" }}>
            {part}
          </Box>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const formatViews = (views?: number) => {
    if (!views) return "0";
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  return (
    <Box sx={{ mb: 4 }}>
      {/* Video Thumbnail */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: "700px",
          aspectRatio: "16/9",
          bgcolor: "#1a1a1a",
          border: "2px solid rgba(255,255,255,0.15)",
          borderRadius: "8px",
          overflow: "hidden",
          mb: 3,
        }}
      >
        <Box
          component="img"
          src={thumbnail}
          alt={title}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </Box>

      {/* Video Title */}
      <Typography
        sx={{
          fontSize: { xs: "28px", md: "40px" },
          fontWeight: 900,
          lineHeight: 1.2,
          color: "#fff",
          mb: 3,
          textTransform: "uppercase",
        }}
      >
        {highlightTitle(title)}
      </Typography>

      {/* Video Stats */}
      <Box sx={{ display: "flex", gap: 4, alignItems: "center" }}>
        <Box>
          <Typography
            sx={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.4)",
              mb: 0.5,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            DURATION
          </Typography>
          <Typography
            sx={{
              fontSize: "16px",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            {duration}
          </Typography>
        </Box>

        <Box
          sx={{
            width: "2px",
            height: "30px",
            bgcolor: "#FF0000",
          }}
        />

        <Box>
          <Typography
            sx={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.4)",
              mb: 0.5,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            VIEWS
          </Typography>
          <Typography
            sx={{
              fontSize: "16px",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            {formatViews(viewCount)}
          </Typography>
        </Box>

        <Box
          sx={{
            width: "2px",
            height: "30px",
            bgcolor: "#FF0000",
          }}
        />

        <Box>
          <Typography
            sx={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.4)",
              mb: 0.5,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            CREATOR
          </Typography>
          <Typography
            sx={{
              fontSize: "16px",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            {uploader}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
