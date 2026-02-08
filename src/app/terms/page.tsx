"use client";

import { useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  AppBar,
  Toolbar,
  Grid,
} from "@mui/material";
import { Logo } from "@/components/common";
import Link from "next/link";

export default function TermsPage() {
  useEffect(() => {
    document.title = "Terms of Service | Cosmy's YT Downloader";
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const SectionNumber = ({ num }: { num: string }) => (
    <Typography
      sx={{
        fontSize: "12px",
        fontFamily: "monospace",
        color: "#666",
        mb: 2,
        display: "block",
        borderBottom: "1px solid #333",
        pb: 1,
        width: "fit-content",
      }}
    >
      SECTION.{num}
    </Typography>
  );

  return (
    <Box
      sx={{
        bgcolor: "#050505",
        minHeight: "100vh",
        color: "#fff",
        fontFamily: "monospace",
        pb: 20,
      }}
    >
      {/* Header */}
      <AppBar
        position="static"
        sx={{
          bgcolor: "#050505",
          boxShadow: "none",
          borderBottom: "1px solid #1a1a1a",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ justifyContent: "space-between", py: 3 }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Logo size={40} />
                <Typography
                  sx={{
                    fontSize: "20px",
                    fontWeight: 900,
                    letterSpacing: "-0.5px",
                    color: "#fff",
                    fontFamily: "sans-serif",
                  }}
                >
                  COSMY'S DOWNLOADER
                </Typography>
              </Box>
            </Link>
            <Box sx={{ display: "flex", gap: 6 }}>
              {["HOME", "FAQ", "TERMS"].map((item) => (
                <Link
                  key={item}
                  href={
                    item === "HOME" ? "/" : item === "TERMS" ? "/terms" : "/faq"
                  }
                  style={{ textDecoration: "none" }}
                >
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: item === "TERMS" ? "#FF0000" : "#666",
                      fontFamily: "sans-serif",
                      "&:hover": { color: "#fff" },
                      transition: "color 0.2s",
                    }}
                  >
                    {item}
                  </Typography>
                </Link>
              ))}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 10 }}>
        {/* Hero Section */}
        <Box sx={{ mb: 16 }}>
          <Grid container spacing={4} alignItems="flex-end">
            <Grid size={{ xs: 12, md: 8 }}>
              <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
                <Box
                  sx={{
                    bgcolor: "#FF0000",
                    color: "white",
                    px: 2,
                    py: 1,
                    fontWeight: "bold",
                    fontSize: "12px",
                    fontFamily: "sans-serif",
                  }}
                >
                  LEGAL DOCUMENT
                </Box>
                <Box
                  sx={{
                    border: "1px solid #333",
                    color: "#666",
                    px: 2,
                    py: 1,
                    fontSize: "12px",
                  }}
                >
                  EFFECTIVE: JAN 2026
                </Box>
              </Box>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: "60px", md: "140px" },
                  fontWeight: 900,
                  lineHeight: 0.8,
                  letterSpacing: "-4px",
                  fontFamily: "sans-serif",
                  textTransform: "uppercase",
                  color: "#fff",
                }}
              >
                Terms of
                <br />
                Service
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography
                sx={{
                  fontSize: "18px",
                  color: "#888",
                  lineHeight: 1.6,
                  maxWidth: "400px",
                  borderLeft: "2px solid #333",
                  pl: 4,
                }}
              >
                By accessing Cosmy's YouTube Downloader ("the Service"), you
                accept and agree to be bound by these Terms of Service. If you
                do not agree to these terms, please do not use the Service.
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={4}>
          {/* 1. Acceptance & 2. Description */}
          <Grid size={{ xs: 12, md: 8 }} id="section-1">
            <Box
              sx={{
                bgcolor: "#0a0a0a",
                border: "1px solid #222",
                p: 6,
                height: "100%",
              }}
            >
              <SectionNumber num="01-02" />
              <Typography
                sx={{
                  fontSize: "42px",
                  fontWeight: 800,
                  mb: 4,
                  fontFamily: "sans-serif",
                  lineHeight: 0.9,
                }}
              >
                DESCRIPTION OF SERVICE
              </Typography>
              <Typography
                sx={{
                  fontSize: "16px",
                  color: "#ccc",
                  mb: 6,
                  maxWidth: "800px",
                  lineHeight: 1.7,
                }}
              >
                Cosmy's YouTube Downloader is a web-based tool that allows users
                to download publicly available YouTube videos and playlists,
                converts content to various formats (MP4, MP3), provides
                multiple quality options (4K, 1080p), and offers transcript
                downloads.
              </Typography>

              <Box sx={{ bgcolor: "#111", p: 4 }}>
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#fff",
                    mb: 3,
                    fontFamily: "sans-serif",
                  }}
                >
                  2.1 TECHNOLOGY STACK
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { name: "yt-dlp", desc: "Video Extraction Fork" },
                    { name: "FFmpeg", desc: "Audio/Video Processing" },
                    { name: "Next.js", desc: "Web Application Framework" },
                  ].map((tech) => (
                    <Grid key={tech.name} size={{ xs: 12, md: 4 }}>
                      <Box sx={{ border: "1px solid #333", p: 2 }}>
                        <Typography
                          sx={{ color: "#fff", fontWeight: "bold", mb: 0.5 }}
                        >
                          {tech.name}
                        </Typography>
                        <Typography sx={{ color: "#666", fontSize: "12px" }}>
                          {tech.desc}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Box>
          </Grid>

          {/* Navigation / TOC */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                position: "sticky",
                top: 40,
                border: "1px solid #222",
                p: 4,
                bgcolor: "#0a0a0a",
              }}
            >
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#666",
                  mb: 4,
                  letterSpacing: "2px",
                  fontWeight: 700,
                }}
              >
                CONTENTS
              </Typography>
              {[
                "1. Acceptance",
                "2. Description",
                "3. Responsibilities",
                "4. Intellectual Property",
                "5. Warranties",
                "6. Liability",
                "7. YouTube Terms",
                "8. Changes",
                "9. Termination",
                "10. Laws",
                "11. Severability",
                "12. Contact",
              ].map((item, i) => (
                <Typography
                  key={item}
                  onClick={() => scrollToSection(`section-${i + 1}`)}
                  sx={{
                    fontSize: "14px",
                    mb: 2,
                    cursor: "pointer",
                    color: "#888",
                    "&:hover": { color: "#fff", pl: 1 },
                    transition: "all 0.2s",
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Box>
          </Grid>

          {/* 3. User Responsibilities - Expanded */}
          <Grid size={{ xs: 12 }} id="section-3">
            <Box sx={{ mt: 8, mb: 4 }}>
              <SectionNumber num="03" />
              <Typography
                sx={{
                  fontSize: "60px",
                  fontWeight: 900,
                  fontFamily: "sans-serif",
                  color: "#fff",
                  mb: 2,
                }}
              >
                USER RESPONSIBILITIES
              </Typography>
            </Box>
          </Grid>

          {/* 3.1 Legal Use */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ borderTop: "2px solid #fff", pt: 2, height: "100%" }}>
              <Typography
                sx={{
                  fontSize: "24px",
                  fontWeight: 800,
                  mb: 3,
                  fontFamily: "sans-serif",
                }}
              >
                3.1 LEGAL USE
              </Typography>
              <Typography
                sx={{ fontSize: "14px", color: "#999", lineHeight: 1.6, mb: 2 }}
              >
                You agree to use the Service only for lawful purposes. You are
                responsible for:
              </Typography>
              <Box
                component="ul"
                sx={{ pl: 2, color: "#ccc", fontSize: "14px", lineHeight: 1.8 }}
              >
                <li>Compliance with local laws</li>
                <li>Respecting copyright rights</li>
                <li>No commercial use without auth</li>
                <li>No redistribution</li>
              </Box>
            </Box>
          </Grid>

          {/* 3.2 Acceptable Use */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                borderTop: "2px solid #22c55e",
                pt: 2,
                height: "100%",
                bgcolor: "rgba(34, 197, 94, 0.05)",
                p: 4,
              }}
            >
              <Typography
                sx={{
                  fontSize: "24px",
                  fontWeight: 800,
                  mb: 3,
                  fontFamily: "sans-serif",
                  color: "#22c55e",
                }}
              >
                3.2 ALLOWED ✅
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[
                  "Personal offline viewing",
                  "Educational purposes",
                  "Fair use (by law)",
                  "Content you own",
                ].map((item) => (
                  <Box
                    key={item}
                    sx={{ display: "flex", gap: 1.5, alignItems: "center" }}
                  >
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        bgcolor: "#22c55e",
                        borderRadius: "50%",
                      }}
                    />
                    <Typography sx={{ fontSize: "14px", color: "#eee" }}>
                      {item}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* 3.3 Prohibited Activities */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                borderTop: "2px solid #ef4444",
                pt: 2,
                height: "100%",
                bgcolor: "rgba(239, 68, 68, 0.05)",
                p: 4,
              }}
            >
              <Typography
                sx={{
                  fontSize: "24px",
                  fontWeight: 800,
                  mb: 3,
                  fontFamily: "sans-serif",
                  color: "#ef4444",
                }}
              >
                3.3 PROHIBITED ❌
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[
                  "Bypassing age restrictions",
                  "Circumventing geo-blocks",
                  "Commercial use (unauthorized)",
                  "Automated abuse / Overloading",
                  "Infringing copyrights",
                ].map((item) => (
                  <Box
                    key={item}
                    sx={{ display: "flex", gap: 1.5, alignItems: "center" }}
                  >
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        bgcolor: "#ef4444",
                        borderRadius: "50%",
                      }}
                    />
                    <Typography sx={{ fontSize: "14px", color: "#eee" }}>
                      {item}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* 4. Intellectual Property */}
          <Grid size={{ xs: 12 }} id="section-4" sx={{ mt: 8 }}>
            <Box sx={{ border: "1px solid #333", p: 0 }}>
              <Grid container>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Box
                    sx={{ p: 6, borderRight: "1px solid #333", height: "100%" }}
                  >
                    <SectionNumber num="04" />
                    <Typography
                      sx={{
                        fontSize: "36px",
                        fontWeight: 800,
                        mb: 4,
                        fontFamily: "sans-serif",
                      }}
                    >
                      INTELLECTUAL PROPERTY
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#fff",
                        mb: 2,
                      }}
                    >
                      4.1 THIRD PARTY CONTENT
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "14px",
                        color: "#999",
                        lineHeight: 1.6,
                        mb: 4,
                      }}
                    >
                      All downloaded content remains property of respective
                      owners. We do not claim ownership, store copies
                      indefinitely, or affiliate with YouTube/Google.
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#fff",
                        mb: 2,
                      }}
                    >
                      4.3 DEPENDENCIES
                    </Typography>
                    <Typography sx={{ fontSize: "12px", color: "#666" }}>
                      Python 3.8+ • FFmpeg/avconv • Certifi
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 7 }}>
                  <Box sx={{ p: 6, height: "100%", bgcolor: "#080808" }}>
                    <Typography
                      sx={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#fff",
                        mb: 4,
                      }}
                    >
                      4.2 OPEN SOURCE COMPONENTS
                    </Typography>
                    <Grid container spacing={4}>
                      <Grid size={{ xs: 6 }}>
                        <Box sx={{ border: "1px solid #333", p: 3 }}>
                          <Typography
                            sx={{ fontSize: "18px", fontWeight: 700, mb: 1 }}
                          >
                            yt-dlp
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "10px",
                              color: "#666",
                              mb: 2,
                              textTransform: "uppercase",
                            }}
                          >
                            License: Unlicense
                          </Typography>
                          <Typography sx={{ fontSize: "13px", color: "#aaa" }}>
                            Public domain software. A youtube-dl fork for
                            extraction.
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Box sx={{ border: "1px solid #333", p: 3 }}>
                          <Typography
                            sx={{ fontSize: "18px", fontWeight: 700, mb: 1 }}
                          >
                            FFmpeg
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "10px",
                              color: "#666",
                              mb: 2,
                              textTransform: "uppercase",
                            }}
                          >
                            License: LGPL/GPL
                          </Typography>
                          <Typography sx={{ fontSize: "13px", color: "#aaa" }}>
                            Library for audio/video processing, conversion and
                            merging.
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* 5. Warranties */}
          <Grid size={{ xs: 12, md: 6 }} id="section-5">
            <Box
              sx={{ mt: 8, p: 6, border: "1px dashed #444", height: "100%" }}
            >
              <SectionNumber num="05" />
              <Typography
                sx={{
                  fontSize: "32px",
                  fontWeight: 800,
                  mb: 4,
                  fontFamily: "sans-serif",
                }}
              >
                DISCLAIMER OF WARRANTIES
              </Typography>
              <Typography
                sx={{ fontSize: "14px", color: "#ccc", mb: 4, lineHeight: 1.6 }}
              >
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND,
                EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
              </Typography>
              <Grid container spacing={2}>
                {[
                  "Merchantability",
                  "Fitness for Purpose",
                  "Non-infringement",
                  "Continuous Operation",
                ].map((item) => (
                  <Grid key={item} size={{ xs: 6 }}>
                    <Typography
                      sx={{
                        color: "#666",
                        fontSize: "13px",
                        borderBottom: "1px solid #222",
                        pb: 1,
                      }}
                    >
                      {item}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
              <Typography sx={{ mt: 4, fontSize: "12px", color: "#555" }}>
                We do NOT guarantee: Availability of videos, download speeds,
                compatibility, or success for all URLs.
              </Typography>
            </Box>
          </Grid>

          {/* 6. Liability - RED SECTION */}
          <Grid size={{ xs: 12, md: 6 }} id="section-6">
            <Box
              sx={{
                mt: 8,
                p: 6,
                bgcolor: "#FF0000",
                height: "100%",
                color: "#fff",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Decorative background huge text */}
              <Typography
                sx={{
                  position: "absolute",
                  bottom: -20,
                  right: -20,
                  fontSize: "120px",
                  fontWeight: 900,
                  opacity: 0.1,
                  pointerEvents: "none",
                }}
              >
                ZERO
              </Typography>

              <SectionNumber num="06" />
              <Typography
                sx={{
                  fontSize: "32px",
                  fontWeight: 800,
                  mb: 2,
                  fontFamily: "sans-serif",
                }}
              >
                LIMITATION OF LIABILITY
              </Typography>
              <Typography sx={{ fontSize: "18px", fontWeight: 700, mb: 4 }}>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW:
              </Typography>
              <Box
                component="ul"
                sx={{
                  pl: 2,
                  fontSize: "14px",
                  lineHeight: 1.8,
                  "& li": { mb: 1 },
                }}
              >
                <li>
                  Cosmy's YouTube Downloader shall not be liable for any
                  indirect, incidental, special, or consequential damages.
                </li>
                <li>
                  Our total liability shall not exceed the amount paid by you
                  (ZERO).
                </li>
                <li>
                  We are not responsible for how you use downloaded content.
                </li>
              </Box>
            </Box>
          </Grid>

          {/* 7. YouTube Terms */}
          <Grid size={{ xs: 12 }} id="section-7" sx={{ mt: 8 }}>
            <Box sx={{ bgcolor: "#0a0a0a", borderTop: "4px solid #fff", p: 6 }}>
              <SectionNumber num="07" />
              <Grid container spacing={8}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography
                    sx={{
                      fontSize: "36px",
                      fontWeight: 800,
                      mb: 4,
                      fontFamily: "sans-serif",
                    }}
                  >
                    YOUTUBE T.O.S.
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "16px",
                      color: "#ccc",
                      lineHeight: 1.6,
                      mb: 4,
                    }}
                  >
                    YouTube's Terms of Service (https://www.youtube.com/t/terms)
                    may prohibit downloading videos.
                  </Typography>
                  <Box sx={{ border: "1px solid #333", p: 3 }}>
                    <Typography
                      sx={{
                        fontSize: "12px",
                        color: "#888",
                        fontWeight: 700,
                        mb: 2,
                      }}
                    >
                      BY USING THIS SERVICE:
                    </Typography>
                    <Typography sx={{ fontSize: "14px", color: "#ccc", mb: 1 }}>
                      • You acknowledge this potential conflict
                    </Typography>
                    <Typography sx={{ fontSize: "14px", color: "#ccc", mb: 1 }}>
                      • You accept full responsibility usage
                    </Typography>
                    <Typography sx={{ fontSize: "14px", color: "#ccc" }}>
                      • You agree to hold us harmless
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography
                    sx={{
                      fontSize: "24px",
                      fontWeight: 800,
                      mb: 4,
                      fontFamily: "sans-serif",
                      color: "#fff",
                    }}
                  >
                    7.2 DMCA COMPLIANCE
                  </Typography>
                  <Typography sx={{ fontSize: "14px", color: "#999", mb: 4 }}>
                    We respect intellectual property. If you believe content
                    found here infringes your copyright:
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    {[
                      "1. Contact us with detailed info",
                      "2. Include proof of ownership",
                      "3. We will investigate & act",
                    ].map((s) => (
                      <Typography
                        key={s}
                        sx={{
                          fontSize: "20px",
                          color: "#444",
                          fontWeight: 900,
                        }}
                      >
                        {s}
                      </Typography>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* 8, 9, 10, 11 Small Boxes */}
          <Grid size={{ xs: 12 }} sx={{ mt: 6 }}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 3 }} id="section-8">
                <Box
                  sx={{
                    p: 4,
                    bgcolor: "#080808",
                    border: "1px solid #1a1a1a",
                    height: "100%",
                  }}
                >
                  <SectionNumber num="08" />
                  <Typography
                    sx={{
                      fontSize: "16px",
                      fontWeight: 700,
                      mb: 2,
                      fontFamily: "sans-serif",
                    }}
                  >
                    CHANGES TO TERMS
                  </Typography>
                  <Typography sx={{ fontSize: "12px", color: "#666" }}>
                    We reserve the right to modify these Terms at any time.
                    Changes take effect upon posting.
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }} id="section-9">
                <Box
                  sx={{
                    p: 4,
                    bgcolor: "#080808",
                    border: "1px solid #1a1a1a",
                    height: "100%",
                  }}
                >
                  <SectionNumber num="09" />
                  <Typography
                    sx={{
                      fontSize: "16px",
                      fontWeight: 700,
                      mb: 2,
                      fontFamily: "sans-serif",
                    }}
                  >
                    TERMINATION
                  </Typography>
                  <Typography sx={{ fontSize: "12px", color: "#666" }}>
                    We may suspend access at any time without notice for
                    violation of terms or abuse.
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }} id="section-10">
                <Box
                  sx={{
                    p: 4,
                    bgcolor: "#080808",
                    border: "1px solid #1a1a1a",
                    height: "100%",
                  }}
                >
                  <SectionNumber num="10" />
                  <Typography
                    sx={{
                      fontSize: "16px",
                      fontWeight: 700,
                      mb: 2,
                      fontFamily: "sans-serif",
                    }}
                  >
                    GOVERNING LAW
                  </Typography>
                  <Typography sx={{ fontSize: "12px", color: "#666" }}>
                    Governed by applicable laws, without regard to conflict of
                    law principles.
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }} id="section-11">
                <Box
                  sx={{
                    p: 4,
                    bgcolor: "#080808",
                    border: "1px solid #1a1a1a",
                    height: "100%",
                  }}
                >
                  <SectionNumber num="11" />
                  <Typography
                    sx={{
                      fontSize: "16px",
                      fontWeight: 700,
                      mb: 2,
                      fontFamily: "sans-serif",
                    }}
                  >
                    SEVERABILITY
                  </Typography>
                  <Typography sx={{ fontSize: "12px", color: "#666" }}>
                    If any provision is unenforceable, remaining provisions
                    continue in full force.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>

          {/* 12. Contact */}
          <Grid size={{ xs: 12 }} id="section-12" sx={{ mt: 8 }}>
            <Box sx={{ bgcolor: "#fff", color: "#000", p: 8 }}>
              <Grid container alignItems="center" spacing={4}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography sx={{ fontSize: "12px", fontWeight: 700, mb: 2 }}>
                    SECTION.12
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "40px",
                      fontWeight: 900,
                      fontFamily: "sans-serif",
                      lineHeight: 0.9,
                    }}
                  >
                    QUESTIONS ABOUT
                    <br />
                    THESE TERMS?
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box
                    sx={{ display: "flex", gap: 2, flexDirection: "column" }}
                  >
                    <Link
                      href="https://github.com/Cosmy145/Cosmy-s-Youtube-Downloader"
                      style={{ textDecoration: "none" }}
                    >
                      <Box
                        sx={{
                          border: "2px solid #000",
                          p: 2,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          "&:hover": { bgcolor: "#000", color: "#fff" },
                          transition: "0.2s",
                        }}
                      >
                        <Typography sx={{ fontWeight: 700, color: "inherit" }}>
                          OPEN ISSUE ON GITHUB
                        </Typography>
                        <Typography sx={{ fontWeight: 700, color: "inherit" }}>
                          →
                        </Typography>
                      </Box>
                    </Link>
                    <Link href="/faq" style={{ textDecoration: "none" }}>
                      <Box
                        sx={{
                          borderBottom: "2px solid #000",
                          p: 2,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography sx={{ fontWeight: 700, color: "#000" }}>
                          READ FAQ
                        </Typography>
                        <Typography sx={{ fontWeight: 700, color: "#000" }}>
                          →
                        </Typography>
                      </Box>
                    </Link>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* SUMMARY - Plain Language */}
          <Grid size={{ xs: 12 }} sx={{ mt: 8 }}>
            <Box sx={{ border: "1px dashed #333", p: 6 }}>
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#666",
                  mb: 2,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                Summary
              </Typography>
              <Typography
                sx={{
                  fontSize: "24px",
                  fontWeight: 800,
                  mb: 6,
                  fontFamily: "sans-serif",
                }}
              >
                PLAIN LANGUAGE OVERVIEW
              </Typography>

              <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 700,
                      mb: 2,
                      color: "#ccc",
                    }}
                  >
                    DO THIS ✅
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    {[
                      "Use for personal, offline viewing",
                      "Respect copyright holders",
                      "Follow local laws",
                    ].map((i) => (
                      <Typography
                        key={i}
                        sx={{ fontSize: "16px", color: "#666" }}
                      >
                        • {i}
                      </Typography>
                    ))}
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 700,
                      mb: 2,
                      color: "#ccc",
                    }}
                  >
                    DON'T DO THIS ❌
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    {[
                      "Re-upload content",
                      "Sell downloaded content",
                      "Abuse the service",
                    ].map((i) => (
                      <Typography
                        key={i}
                        sx={{ fontSize: "16px", color: "#666" }}
                      >
                        • {i}
                      </Typography>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: 16,
            pt: 8,
            borderTop: "1px solid #1a1a1a",
            textAlign: "center",
          }}
        >
          <Typography
            sx={{ fontSize: "12px", color: "#444", fontStyle: "italic" }}
          >
            By using Cosmy's YouTube Downloader, you acknowledge that you have
            read, understood, and agree to be bound by these Terms of Service.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
