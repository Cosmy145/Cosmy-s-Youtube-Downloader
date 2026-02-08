"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  AppBar,
  Toolbar,
  Button,
  Collapse,
} from "@mui/material";
import { Logo } from "@/components/common";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Link from "next/link";

// FAQ Data from docs/FAQ.md
const faqData = [
  // General Questions
  {
    category: "General Questions",
    questions: [
      {
        id: 1,
        question: "What is Cosmy's YouTube Downloader?",
        answer:
          "Cosmy's YouTube Downloader is a free, web-based tool that allows you to download YouTube videos and playlists in various qualities (up to 4K) and formats (MP4, MP3). It's fast, secure, and requires no software installation.",
      },
      {
        id: 2,
        question: "Is this service free to use?",
        answer:
          "Yes! Cosmy's YouTube Downloader is completely free. There are no hidden charges, subscriptions, or premium tiers. All features are available to everyone.",
      },
      {
        id: 3,
        question: "Do I need to create an account?",
        answer:
          "No account creation is required. Simply paste your YouTube URL and start downloading immediately.",
      },
      {
        id: 4,
        question: "Is it safe to use this website?",
        answer:
          "Absolutely. We don't store any of your personal data or downloaded content. All downloads are processed in real-time and automatically deleted from our servers after completion.",
      },
    ],
  },
  // Video Quality & Formats
  {
    category: "Video Quality & Formats",
    questions: [
      {
        id: 5,
        question: "What video qualities are available?",
        answer:
          "We support multiple quality options: 4K Ultra HD (2160p), 2K QHD (1440p), 1080p HD, 720p HD, 480p SD, and 360p SD. File sizes range from ~200MB to ~4GB per hour depending on quality.",
      },
      {
        id: 6,
        question: "Can I download only the audio?",
        answer:
          "Yes! We offer audio-only downloads in MP3 format with 192kbps (high quality) and 128kbps (standard quality) bitrate options.",
      },
      {
        id: 7,
        question: "What file formats are supported?",
        answer:
          "Video: MP4 (H.264), WebM. Audio: MP3. These formats are compatible with virtually all devices and media players.",
      },
    ],
  },
  // Playlist Downloads
  {
    category: "Playlist Downloads",
    questions: [
      {
        id: 8,
        question: "Can I download entire playlists?",
        answer:
          "Yes! Simply paste the playlist URL and we'll fetch all videos in the playlist. You can then download them individually or use our queue feature to download multiple videos automatically.",
      },
      {
        id: 9,
        question: "Is there a limit on playlist size?",
        answer:
          "We can handle playlists with hundreds of videos. However, for very large playlists, we recommend downloading in batches for the best experience.",
      },
      {
        id: 10,
        question: "Can I select which videos to download from a playlist?",
        answer:
          "Yes! After pasting a playlist URL, you'll see all videos listed. You can expand each one and choose to download or skip it.",
      },
    ],
  },
  // Troubleshooting
  {
    category: "Troubleshooting",
    questions: [
      {
        id: 11,
        question: "Why is my download failing?",
        answer:
          "Common reasons include: Age-restricted content (requires authentication), Private videos (only public videos work), Region-locked content (may not work in certain countries), or the video may have been removed by the uploader.",
      },
      {
        id: 12,
        question: "Why is my 4K download slow?",
        answer:
          "4K videos are large files (several GB). Download speed depends on your internet connection, server load, and video length. For faster downloads, try 1080p which offers great quality with smaller file sizes.",
      },
      {
        id: 13,
        question:
          'The progress bar is stuck at "Merging" - what does this mean?',
        answer:
          "After downloading video and audio streams separately, we merge them into a single file. This process can take a moment for larger files - please be patient!",
      },
      {
        id: 14,
        question: "Why can't I download some videos?",
        answer:
          "Some videos have restrictions: Age-restricted (18+), Geo-blocked, Private or unlisted, or Removed/unavailable. These limitations are set by YouTube, not us.",
      },
    ],
  },
  // Technical Questions
  {
    category: "Technical Questions",
    questions: [
      {
        id: 15,
        question: "How does the download work?",
        answer:
          "We use yt-dlp, a powerful open-source tool, to fetch video metadata and streams directly from YouTube. The video is downloaded to our server, processed, and then streamed to your browser for download.",
      },
      {
        id: 16,
        question: "Do you store my downloaded videos?",
        answer:
          "No. Videos are immediately deleted from our servers after you download them. We don't keep any copies of the content you download.",
      },
      {
        id: 17,
        question: "What about subtitles/transcripts?",
        answer:
          "Yes! We offer transcript downloads in SRT format. If available, you can download subtitles in the video's original language or auto-generated subtitles.",
      },
      {
        id: 18,
        question: "Can I use this on mobile?",
        answer:
          "Yes! Our website is fully responsive and works on all devices - phones, tablets, and computers. For the best mobile experience, we recommend using desktop mode in your browser.",
      },
    ],
  },
  // Legal & Privacy
  {
    category: "Legal & Privacy",
    questions: [
      {
        id: 19,
        question: "Is downloading YouTube videos legal?",
        answer:
          "This varies by jurisdiction and intended use. Generally allowed: Personal offline viewing, educational purposes. Not allowed: Re-uploading, commercial use, copyright infringement. Please respect content creators' rights.",
      },
      {
        id: 20,
        question: "Do you track my downloads?",
        answer:
          "No. We don't log URLs, track downloads, or store any personal information. Your privacy is our priority.",
      },
    ],
  },
  // Contact & Support
  {
    category: "Contact & Support",
    questions: [
      {
        id: 21,
        question: "How can I report a bug?",
        answer:
          "Please open an issue on our GitHub repository at github.com/Cosmy145/Cosmy-s-Youtube-Downloader/issues.",
      },
      {
        id: 22,
        question: "Is the source code available?",
        answer:
          "Yes! Cosmy's YouTube Downloader is open source. You can view, fork, and contribute to the code on GitHub.",
      },
    ],
  },
];

interface FAQItemProps {
  number: number;
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

const FAQItem = ({
  number,
  question,
  answer,
  isOpen,
  onToggle,
}: FAQItemProps) => {
  return (
    <Box
      onClick={onToggle}
      sx={{
        bgcolor: "#0a0a0a",
        border: "1px solid #222",
        borderRadius: "4px",
        mb: 2,
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: "#FF0000",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography
            sx={{
              color: "#FF0000",
              fontWeight: 700,
              fontSize: "20px",
              fontFamily: "monospace",
            }}
          >
            {String(number).padStart(2, "0")}
          </Typography>
          <Typography
            sx={{
              color: "#fff",
              fontWeight: 600,
              fontSize: { xs: "14px", md: "16px" },
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {question}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            bgcolor: "#FF0000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "transform 0.3s ease",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          {isOpen ? (
            <ExpandMoreIcon sx={{ color: "#fff", fontSize: 24 }} />
          ) : (
            <HelpOutlineIcon sx={{ color: "#fff", fontSize: 20 }} />
          )}
        </Box>
      </Box>
      <Collapse in={isOpen}>
        <Box
          sx={{
            px: 3,
            pb: 3,
            pt: 0,
            borderTop: "1px solid #222",
          }}
        >
          <Typography
            sx={{
              color: "#999",
              fontSize: "14px",
              lineHeight: 1.7,
              pt: 2,
            }}
          >
            {answer}
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
};

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    document.title = "FAQ | Cosmy's YT Downloader";
  }, []);

  const toggleItem = (id: number) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <Box sx={{ bgcolor: "#000", minHeight: "100vh", color: "#fff" }}>
      {/* Header */}
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
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  cursor: "pointer",
                }}
              >
                <Logo size={32} />
                <Typography
                  sx={{
                    fontSize: "16px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    color: "#fff",
                  }}
                >
                  COSMY'S YOUTUBE DOWNLOADER
                </Typography>
              </Box>
            </Link>
            <Box sx={{ display: "flex", gap: 4 }}>
              <Link href="/" style={{ textDecoration: "none" }}>
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    color: "#fff",
                    "&:hover": { color: "#FF0000" },
                  }}
                >
                  HOME
                </Typography>
              </Link>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#FF0000",
                }}
              >
                FAQ
              </Typography>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Title Section */}
        <Box sx={{ mb: 6 }}>
          <Box
            sx={{
              borderLeft: "4px solid #FF0000",
              pl: 3,
              mb: 2,
            }}
          >
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "36px", md: "56px" },
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: "-2px",
              }}
            >
              FREQUENTLY
              <br />
              ASKED
            </Typography>
          </Box>
          <Typography
            sx={{
              color: "#666",
              fontSize: "12px",
              fontFamily: "monospace",
              letterSpacing: "2px",
              mt: 2,
              pl: 3,
            }}
          >
            RAW DATA FOR END USERS. NO FLUFF. JUST ANSWERS.
          </Typography>
        </Box>

        {/* FAQ Categories */}
        {faqData.map((category) => (
          <Box key={category.category} sx={{ mb: 4 }}>
            <Typography
              sx={{
                color: "#FF0000",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "2px",
                mb: 2,
                textTransform: "uppercase",
              }}
            >
              {category.category}
            </Typography>
            {category.questions.map((faq) => (
              <FAQItem
                key={faq.id}
                number={faq.id}
                question={faq.question}
                answer={faq.answer}
                isOpen={openItems.has(faq.id)}
                onToggle={() => toggleItem(faq.id)}
              />
            ))}
          </Box>
        ))}

        {/* Still Have Questions CTA */}
        <Box
          sx={{
            bgcolor: "#FF0000",
            border: "2px solid #FF0000",
            borderRadius: "4px",
            p: 4,
            textAlign: "center",
            mt: 6,
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: "24px", md: "32px" },
              fontWeight: 800,
              mb: 2,
              letterSpacing: "-1px",
            }}
          >
            STILL HAVE QUESTIONS?
          </Typography>
          <Button
            href="https://github.com/Cosmy145/Cosmy-s-Youtube-Downloader/issues"
            target="_blank"
            sx={{
              bgcolor: "#000",
              color: "#fff",
              fontWeight: 700,
              fontSize: "14px",
              px: 4,
              py: 1.5,
              borderRadius: "2px",
              textTransform: "uppercase",
              letterSpacing: "1px",
              "&:hover": {
                bgcolor: "#222",
              },
            }}
          >
            Contact Support
          </Button>
        </Box>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: "#000", borderTop: "1px solid #222", py: 4, mt: 8 }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 700,
                  letterSpacing: "1px",
                }}
              >
                COSMY'S YOUTUBE DOWNLOADER
              </Typography>
              <Typography
                sx={{
                  fontSize: "10px",
                  color: "#666",
                  fontFamily: "monospace",
                  mt: 0.5,
                }}
              >
                © 2026. NO RIGHTS RESERVED.
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 4 }}>
              <Link href="/" style={{ textDecoration: "none" }}>
                <Typography
                  sx={{
                    fontSize: "12px",
                    color: "#999",
                    cursor: "pointer",
                    "&:hover": { color: "#fff" },
                  }}
                >
                  HOME
                </Typography>
              </Link>
              <Link href="/terms" style={{ textDecoration: "none" }}>
                <Typography
                  sx={{
                    fontSize: "12px",
                    color: "#999",
                    cursor: "pointer",
                    "&:hover": { color: "#fff" },
                  }}
                >
                  TERMS
                </Typography>
              </Link>
              <Link href="/privacy" style={{ textDecoration: "none" }}>
                <Typography
                  sx={{
                    fontSize: "12px",
                    color: "#999",
                    cursor: "pointer",
                    "&:hover": { color: "#fff" },
                  }}
                >
                  PRIVACY
                </Typography>
              </Link>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
