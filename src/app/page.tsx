"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Box,
  Typography,
  Paper,
  InputBase,
  Button,
  AppBar,
  Toolbar,
} from "@mui/material";

export default function Home() {
  const [url, setUrl] = useState("");
  useEffect(() => {
    document.title = "Cosmy's Youtube Downloader";
  }, []);
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<
    | (VideoMetadata & {
        availableQualities?: { quality: string; hasAudio: boolean }[];
      })
    | null
  >(null);
  const [error, setError] = useState("");

  // Single Video State
  const singleDownload = useDownload();

  // Playlist State
  const [playlistQuality, setPlaylistQuality] = useState("best");
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isQueueRunning, setIsQueueRunning] = useState(false);

  const fetchVideoInfo = async () => {
    if (!url) {
      setError("Please enter URL");
      return;
    }
    setLoading(true);
    setError("");
    setMetadata(null);
    setIsQueueRunning(false);
    setQueueIndex(-1); // Reset playlist state

    try {
      const response = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (data.success) setMetadata(data.data);
      else setError(data.error || "Failed to fetch info");
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ textAlign: "center", mb: 8 }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 800,
            background:
              "linear-gradient(135deg, #a29bfe 0%, #6c5ce7 50%, #00d2d3 100%)",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: { xs: "2.5rem", md: "4rem" },
            mb: 2,
            letterSpacing: "-0.02em",
          }}
        >
          Cosmy's Youtube Downloader
        </Typography>
        <Typography
          variant="h5"
          color="text.secondary"
          sx={{ fontWeight: 400, opacity: 0.8 }}
        >
          Premium Quality Downloads • Playlists • 4K Support
        </Typography>
      </Box>

      <Paper
        elevation={0}
        component="form"
        sx={{
          bgcolor: "#000",
          boxShadow: "none",
          borderBottom: "1px solid #222",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ justifyContent: "space-between", py: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: "#FF0000",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography sx={{ fontSize: "20px", fontWeight: 900 }}>
                  ▶
                </Typography>
              </Box>
              <Typography
                sx={{ fontSize: "16px", fontWeight: 700, letterSpacing: "1px" }}
              >
                COSMY'S YOUTUBE DOWNLOADER
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 4 }}>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  "&:hover": { color: "#FF0000" },
                }}
              >
                HOME
              </Typography>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  "&:hover": { color: "#FF0000" },
                }}
              >
                FAQ
              </Typography>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  "&:hover": { color: "#FF0000" },
                }}
              >
                CONTACT
              </Typography>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 6,
            alignItems: "center",
          }}
        >
          {/* Left Side */}
          <Box>
            <Box
              sx={{
                display: "inline-block",
                bgcolor: "#FF0000",
                px: 2,
                py: 0.5,
                mb: 3,
                borderRadius: "4px",
              }}
            >
              <Typography
                sx={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1px" }}
              >
                NEW & ONLINE!
              </Typography>
            </Box>

            <Typography
              sx={{
                fontSize: { xs: "48px", md: "72px" },
                fontWeight: 900,
                lineHeight: 1,
                mb: 3,
              }}
            >
              DOWNLOAD
              <br />
              YOUTUBE
              <br />
              VIDEOS IN{" "}
              <Box component="span" sx={{ color: "#FF0000" }}>
                4K
              </Box>
            </Typography>

            <Typography
              sx={{ fontSize: "16px", color: "#999", mb: 4, maxWidth: "400px" }}
            >
              Premium quality, ultra-fast speeds, and no ads. The best way to
              save your favorite content securely.
            </Typography>
          </Box>

          {/* Right Side - Download Box */}
          <Box
            sx={{
              bgcolor: "#0a0a0a",
              border: "1px solid #222",
              borderRadius: "12px",
              p: 4,
            }}
          >
            <Paper
              component="form"
              onSubmit={handleSubmit}
              sx={{
                bgcolor: "#1a1a1a",
                border: "1px solid #333",
                borderRadius: "8px",
                mb: 3,
              }}
            >
              <InputBase
                sx={{
                  width: "100%",
                  px: 2,
                  py: 1.5,
                  color: "#fff",
                  fontSize: "14px",
                  "& input::placeholder": { color: "#666" },
                }}
                placeholder="Paste YouTube URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onFocus={(e) => e.target.select()}
              />
            </Paper>

            <Typography
              sx={{
                fontSize: "11px",
                color: "#999",
                mb: 2,
                textAlign: "center",
              }}
            >
              ⚠️ PLEASE TURN ON DESKTOP MODE IF USING MOBILE FOR FASTER DOWNLOAD
            </Typography>

            <Button
              type="submit"
              onClick={handleSubmit}
              fullWidth
              sx={{
                bgcolor: "#FF0000",
                color: "#fff",
                py: 1.5,
                fontSize: "14px",
                fontWeight: 700,
                borderRadius: "8px",
                mb: 3,
                "&:hover": { bgcolor: "#CC0000" },
              }}
            >
              DOWNLOAD ↓
            </Button>

            {/* Feature Badges */}
            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              {[
                { icon: "◆", label: "4K QUALITY" },
                { icon: "⚡", label: "ULTRA FAST" },
                { icon: "♫", label: "MP3 & MP4" },
                { icon: "🔒", label: "SECURE" },
              ].map((item, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    bgcolor: "#1a1a1a",
                    px: 2,
                    py: 1,
                    borderRadius: "6px",
                  }}
                >
                  <Typography sx={{ color: "#FF0000" }}>{item.icon}</Typography>
                  <Typography sx={{ fontSize: "11px", fontWeight: 600 }}>
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Container>

      {/* How It Works */}
      <Box sx={{ bgcolor: "#0a0a0a", py: 8, borderTop: "1px solid #222" }}>
        <Container maxWidth="xl">
          <Typography
            sx={{
              fontSize: "36px",
              fontWeight: 900,
              mb: 2,
              textAlign: "center",
            }}
          >
            HOW IT WORKS
          </Typography>
          <Typography
            sx={{
              fontSize: "14px",
              color: "#999",
              mb: 6,
              textAlign: "center",
              maxWidth: "600px",
              mx: "auto",
            }}
          >
            Download your favorite videos in three simple steps. No complicated
            software, just copy, paste, and save.
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
              gap: 3,
            }}
          >
            {[
              {
                num: "01",
                title: "COPY URL",
                desc: "Find the video you want from any platform and copy its URL from the address bar.",
              },
              {
                num: "02",
                title: "PASTE LINK",
                desc: "Paste the copied link in the search bar at the top of this page and click the 'Start Download' button.",
              },
              {
                num: "03",
                title: "DOWNLOAD",
                desc: "Select your preferred format (MP4/MP3) and quality (up to 4K) then save the file to your device.",
              },
            ].map((step, idx) => (
              <Box
                key={idx}
                sx={{
                  bgcolor: "#000",
                  border: "1px solid #222",
                  borderRadius: "8px",
                  p: 4,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "48px",
                    fontWeight: 900,
                    color: "#FF0000",
                    mb: 2,
                  }}
                >
                  {step.num}
                </Typography>
                <Typography sx={{ fontSize: "18px", fontWeight: 700, mb: 2 }}>
                  {step.title}
                </Typography>
                <Typography sx={{ fontSize: "14px", color: "#999" }}>
                  {step.desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          bgcolor: "#0a0a0a",
          py: 12,
          textAlign: "center",
          borderTop: "1px solid #222",
        }}
      >
        <Container maxWidth="md">
          <Typography sx={{ fontSize: "48px", fontWeight: 900, mb: 3 }}>
            READY TO DOWNLOAD?
          </Typography>
          <Typography sx={{ fontSize: "16px", color: "#999", mb: 4 }}>
            Get unrestricted access to your favorite videos offline.
            <br />
            Fast, free, and secure.
          </Typography>
          <Button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            sx={{
              bgcolor: "#FF0000",
              color: "#fff",
              px: 6,
              py: 2,
              fontSize: "14px",
              fontWeight: 700,
              borderRadius: "8px",
              "&:hover": { bgcolor: "#CC0000" },
            }}
          >
            TRY IT NOW
          </Button>
        </Container>
      </Box>

      {/* Footer */}
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
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    bgcolor: "#FF0000",
                    borderRadius: "2px",
                  }}
                />
                <Typography sx={{ fontSize: "14px", fontWeight: 700 }}>
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
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#999",
                  mb: 1,
                  cursor: "pointer",
                  "&:hover": { color: "#fff" },
                }}
              >
                Extension
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
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#999",
                  mb: 1,
                  cursor: "pointer",
                  "&:hover": { color: "#fff" },
                }}
              >
                Contact
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
    </Box>
  );
}
