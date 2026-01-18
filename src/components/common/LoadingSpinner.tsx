"use client";

import { Box, CircularProgress, Typography } from "@mui/material";

interface LoadingSpinnerProps {
  message?: string;
  subMessage?: string;
}

/**
 * Full-page loading spinner component
 */
export const LoadingSpinner = ({
  message = "Loading...",
  subMessage,
}: LoadingSpinnerProps) => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CircularProgress size={60} sx={{ color: "#FF0000", mb: 3 }} />
      <Typography sx={{ color: "#fff", fontSize: "18px", fontWeight: 600 }}>
        {message}
      </Typography>
      {subMessage && (
        <Typography
          sx={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", mt: 1 }}
        >
          {subMessage}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;
