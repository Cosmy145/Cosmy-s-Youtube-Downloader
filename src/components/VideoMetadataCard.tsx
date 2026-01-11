import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
} from "@mui/material";

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
  return (
    <Card
      sx={{
        display: "flex",
        mb: 4, // More spacing
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 4,
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        overflow: "hidden", // Ensure border radius clips content
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
        },
      }}
    >
      <CardMedia
        component="img"
        sx={{ width: 400, objectFit: "cover" }}
        image={thumbnail}
        alt={title}
      />
      <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <CardContent sx={{ flex: "1 0 auto" }}>
          <Typography
            component="div"
            variant="h5"
            sx={{ mb: 1, fontWeight: "bold" }}
          >
            {title}
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            component="div"
          >
            {uploader}
          </Typography>
          <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
            <Chip label={duration} size="small" variant="outlined" />
            {viewCount && (
              <Chip
                label={`${viewCount.toLocaleString()} views`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </CardContent>
      </Box>
    </Card>
  );
};
