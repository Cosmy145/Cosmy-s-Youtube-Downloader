"use client";

import { Box, Paper, InputBase, Button } from "@mui/material";

interface DownloadHeaderProps {
  url: string;
  loading: boolean;
  onUrlChange: (url: string) => void;
  onSubmit: () => void;
}

/**
 * URL input header for the download page
 */
export const DownloadHeader = ({
  url,
  loading,
  onUrlChange,
  onSubmit,
}: DownloadHeaderProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: "4px",
          display: "flex",
          alignItems: "center",
          bgcolor: "rgba(255,255,255,0.05)",
          border: "2px solid rgba(255,255,255,0.1)",
          borderRadius: "12px",
        }}
      >
        <InputBase
          sx={{
            ml: 2,
            flex: 1,
            color: "#fff",
            fontSize: "16px",
            "& input::placeholder": {
              color: "rgba(255,255,255,0.4)",
              opacity: 1,
            },
          }}
          placeholder="Paste YouTube URL here..."
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          onFocus={(e) => e.target.select()}
        />
        <Button
          type="submit"
          disabled={loading}
          sx={{
            px: 4,
            py: 1.5,
            bgcolor: "#FF0000",
            color: "#fff",
            fontWeight: 700,
            fontSize: "14px",
            borderRadius: "8px",
            textTransform: "none",
            "&:hover": { bgcolor: "#CC0000" },
          }}
        >
          {loading ? "Loading..." : "Get Info"}
        </Button>
      </Paper>
    </Box>
  );
};

export default DownloadHeader;
