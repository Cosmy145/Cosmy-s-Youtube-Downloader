import {
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Typography,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";

interface PlaylistControlsProps {
  title: string;
  itemCount: number;
  thumbnail: string;
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
  isQueueRunning,
  onStartQueue,
  onStopQueue,
  queueIndex,
  globalQuality,
  onQualityChange,
}: PlaylistControlsProps) => {
  const progress = isQueueRunning ? (queueIndex / itemCount) * 100 : 0;

  return (
    <Card
      sx={{
        mb: 6,
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 4,
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box sx={{ display: "flex" }}>
        {thumbnail && (
          <Box
            component="img"
            src={thumbnail}
            sx={{ width: 320, objectFit: "cover" }}
          />
        )}
        <CardContent sx={{ flex: 1 }}>
          <Typography variant="h5" gutterBottom>
            {title}
          </Typography>
          <Typography color="text.secondary" gutterBottom>
            {itemCount} Videos
          </Typography>

          <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={globalQuality}
                onChange={(e) => onQualityChange(e.target.value)}
              >
                <MenuItem value="best">Best Quality</MenuItem>
                <MenuItem value="2160p">4K (2160p)</MenuItem>
                <MenuItem value="1080p">1080p</MenuItem>
                <MenuItem value="720p">720p</MenuItem>
                <MenuItem value="audio">Audio Only (MP3)</MenuItem>
              </Select>
            </FormControl>

            {!isQueueRunning ? (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrowIcon />}
                onClick={onStartQueue}
              >
                Download All
              </Button>
            ) : (
              <Button
                variant="contained"
                color="error"
                startIcon={<StopIcon />}
                onClick={onStopQueue}
              >
                Stop Queue
              </Button>
            )}
          </Box>
        </CardContent>
      </Box>
      {isQueueRunning && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
            Queue Progress: {queueIndex} / {itemCount} completed
          </Typography>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      )}
    </Card>
  );
};
