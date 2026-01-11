import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

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
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        mb: 3,
        background: "rgba(255,255,255,0.02)",
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(10px)",
        overflow: "hidden",
      }}
    >
      <Table aria-label="quality options">
        <TableHead>
          <TableRow>
            <TableCell>Quality</TableCell>
            <TableCell>Format</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {qualities.map((q) => (
            <TableRow
              key={q.quality}
              sx={{
                "&:last-child td, &:last-child th": { border: 0 },
                "&:hover": { background: "rgba(162, 155, 254, 0.08)" },
                transition: "background 0.2s",
              }}
            >
              <TableCell component="th" scope="row">
                <Typography variant="body1" fontWeight="500">
                  {q.quality}
                </Typography>
              </TableCell>
              <TableCell>
                {q.quality === "best"
                  ? "MP4 (Best)"
                  : parseInt(q.quality) >= 1080
                  ? "MP4 (High)"
                  : "MP4"}
              </TableCell>
              <TableCell align="right">
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => onDownload(q.quality)}
                  disabled={disabled}
                  size="small"
                >
                  Download
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
