"use client";

import { Container, Box, Typography, AppBar, Toolbar } from "@mui/material";
import { Logo } from "@/components/common";
import Link from "next/link";

export const Header = () => {
  return (
    <AppBar
      position="static"
      sx={{
        bgcolor: "#000",
        boxShadow: "none",
        borderBottom: "1px solid #222",
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ justifyContent: "space-between", py: 2 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Logo size={32} />
              <Typography
                sx={{
                  fontSize: "16px",
                  fontWeight: 700,
                  letterSpacing: "1px",
                  color: "#fff",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                COSMY'S YOUTUBE DOWNLOADER
              </Typography>
            </Box>
          </Link>
          <Box sx={{ display: "flex", gap: 4 }}>
            <Link href="/faq" style={{ textDecoration: "none" }}>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "#fff",
                  "&:hover": { color: "#FF0000" },
                }}
              >
                FAQ
              </Typography>
            </Link>
            <Link href="/terms" style={{ textDecoration: "none" }}>
              <Typography
                sx={{
                  fontSize: "14px", // Consistent font size
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "#fff",
                  "&:hover": { color: "#FF0000" },
                }}
              >
                TERMS
              </Typography>
            </Link>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};
