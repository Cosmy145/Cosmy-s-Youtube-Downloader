import { Box, LinearProgress, Typography, Button, Paper } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { motion } from "framer-motion";

interface DetailedProgressBarProps {
  phase: string;
  percent: number;
  speed: string;
  eta: string;
  total: string;
  downloaded: string;
  onCancel: () => void;
}

export const DetailedProgressBar = ({
  phase,
  percent,
  speed,
  eta,
  total,
  downloaded,
  onCancel,
}: DetailedProgressBarProps) => {
  const isIndeterminate = percent <= 0;

  // Phase Display Logic
  let phaseLabel = "Initializing...";
  if (phase === "downloading")
    phaseLabel = `Downloading... ${percent.toFixed(1)}%`;
  if (downloaded === "Merging")
    phaseLabel = `Merging Video & Audio... (${percent.toFixed(0)}%)`;
  if (phase === "streaming") phaseLabel = "Saving to Disk...";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 4,
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" sx={{ color: "#a29bfe", fontWeight: 600 }}>
            {phaseLabel}
          </Typography>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<CloseIcon />}
            onClick={onCancel}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
        </Box>

        <Box sx={{ position: "relative", mb: 2 }}>
          <LinearProgress
            variant={isIndeterminate ? "indeterminate" : "determinate"}
            value={percent}
            sx={{
              height: 12,
              borderRadius: 6,
              bgcolor: "rgba(255,255,255,0.1)",
              "& .MuiLinearProgress-bar": {
                background: "linear-gradient(90deg, #a29bfe 0%, #6c5ce7 100%)",
              },
            }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            color: "text.secondary",
            fontSize: "0.9rem",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            ⚡ {speed || "Calculating..."}
          </Typography>
          <Typography variant="body2">
            📦 {downloaded} / {total}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            🕒 ETA: {eta}
          </Typography>
        </Box>
      </Paper>
    </motion.div>
  );
};
