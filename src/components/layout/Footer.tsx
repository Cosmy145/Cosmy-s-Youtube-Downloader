"use client";

import { Container, Box, Typography } from "@mui/material";
import { Logo } from "@/components/common";
import Link from "next/link";

export const Footer = () => {
  return (
    <Box sx={{ bgcolor: "#000", borderTop: "1px solid #222", py: 6 }}>
      <Container maxWidth="xl">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr 1fr" },
            gap: 4,
            mb: 4,
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Logo size={24} />
              <Typography
                sx={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}
              >
                COSMY'S YOUTUBE DOWNLOADER
              </Typography>
            </Box>
            <Typography
              sx={{ fontSize: "12px", color: "#666", maxWidth: "300px" }}
            >
              Download your favorite YouTube videos on the go. Now supporting
              4K, MP3, and more platforms. Just one click.
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 700,
                mb: 2,
                color: "#FF0000",
              }}
            >
              CONTENT
            </Typography>
            <Typography
              sx={{
                fontSize: "12px",
                color: "#999",
                mb: 1,
                cursor: "pointer",
                "&:hover": { color: "#fff" },
              }}
            >
              Features
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 700,
                mb: 2,
                color: "#FF0000",
              }}
            >
              SUPPORT
            </Typography>
            <Link href="/faq" style={{ textDecoration: "none" }}>
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#999",
                  mb: 1,
                  cursor: "pointer",
                  "&:hover": { color: "#fff" },
                }}
              >
                FAQ
              </Typography>
            </Link>
          </Box>

          <Box>
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 700,
                mb: 2,
                color: "#FF0000",
              }}
            >
              LEGAL
            </Typography>
            <Typography
              sx={{
                fontSize: "12px",
                color: "#999",
                mb: 1,
                cursor: "pointer",
                "&:hover": { color: "#fff" },
              }}
            >
              Privacy
            </Typography>
            <Link href="/terms" style={{ textDecoration: "none" }}>
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#999",
                  mb: 1,
                  cursor: "pointer",
                  "&:hover": { color: "#fff" },
                }}
              >
                Terms
              </Typography>
            </Link>
          </Box>
        </Box>

        <Box
          sx={{
            borderTop: "1px solid #222",
            pt: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography sx={{ fontSize: "11px", color: "#666" }}>
            © 2025 - YT DOWNLOADER. ALL RIGHTS PRESERVED.
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Typography
              sx={{
                fontSize: "18px",
                cursor: "pointer",
                "&:hover": { color: "#FF0000" },
              }}
            >
              👍
            </Typography>
            <Typography
              sx={{
                fontSize: "18px",
                cursor: "pointer",
                "&:hover": { color: "#FF0000" },
              }}
            >
              ↗
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
