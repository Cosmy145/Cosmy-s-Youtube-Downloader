import { exec, spawn } from "child_process";
import { promisify } from "util";
import type { VideoMetadata } from "@/types";
import path from "path";
import fs from "fs";

const execPromise = promisify(exec);

function getYtDlpPath(): string {
  const localBinary = path.join(process.cwd(), "bin", "yt-dlp");
  return fs.existsSync(localBinary) ? localBinary : "yt-dlp";
}

/**
 * Get cookies flag for yt-dlp (only in development)
 */
function getCookiesFlag(): string {
  return process.env.NODE_ENV === "production"
    ? ""
    : "--cookies-from-browser chrome";
}

/**
 * Validates if a URL is a valid YouTube URL
 */
export function validateYouTubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  return youtubeRegex.test(url);
}

/**
 * Fetches video metadata without downloading
 */
export async function getVideoMetadata(url: string): Promise<VideoMetadata> {
  if (!validateYouTubeUrl(url)) {
    throw new Error("Invalid YouTube URL");
  }

  try {
    // -J returns a single JSON object (better for playlists)
    // --flat-playlist gets playlist items without downloading details for each
    // --no-warnings suppresses warnings
    // --cookies-from-browser chrome uses Chrome cookies (only in dev)

    const { stdout } = await execPromise(
      `${getYtDlpPath()} -j --flat-playlist ${getCookiesFlag()} --no-warnings "${url}"`.trim()
    );

    let mainMetadata: any = null;
    let collectedItems: any[] = [];

    try {
      // Try to parse the entire output as a single JSON (expected with -J)
      const json = JSON.parse(stdout);

      if (json._type === "playlist" || Array.isArray(json.entries)) {
        mainMetadata = json;
      } else {
        // Single video or unrecognized structure
        collectedItems.push(json);
      }
    } catch (e) {
      // Fallback: splitting by lines if -J failed to produce single valid JSON
      // (This shouldn't typically happen with -J)
      const lines = stdout
        .trim()
        .split("\n")
        .filter((l) => l.trim());
      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json._type === "playlist" || json.entries) {
            mainMetadata = json;
          } else {
            collectedItems.push(json);
          }
        } catch (ignored) {}
      }
    }

    // Scenario A: We found a main Playlist object
    if (mainMetadata) {
      // Sometimes entries might be split across lines? Usually not with --flat-playlist main object.
      // But if mainMetadata has entries, use them.
      const entries = mainMetadata.entries || collectedItems; // Fallback to collected if entries empty

      return {
        type: "playlist",
        id: mainMetadata.id,
        title: mainMetadata.title,
        thumbnail:
          mainMetadata.thumbnails?.[mainMetadata.thumbnails.length - 1]?.url ||
          "",
        uploader: mainMetadata.uploader || mainMetadata.channel || "Unknown",
        description: mainMetadata.description,
        view_count: mainMetadata.view_count,
        original_url: url,
        item_count: mainMetadata.playlist_count || entries.length || 0,
        items: entries.map((e: any) => ({
          id: e.id,
          title: e.title,
          duration: e.duration,
          uploader: e.uploader,
          url: e.url || `https://www.youtube.com/watch?v=${e.id}`,
          thumbnail:
            e.thumbnails?.[e.thumbnails.length - 1]?.url || e.thumbnail,
        })),
      };
    }

    // Scenario B: No main object, but we collected items (NDJSON stream of videos)
    if (collectedItems.length > 1) {
      // Synthetic playlist - try to extract meaningful info
      const first = collectedItems[0];

      // Try to get a better playlist title from first video
      const playlistTitle = first.playlist || first.title || `Playlist`;

      return {
        type: "playlist",
        id: "synthetic_playlist",
        title: playlistTitle,
        thumbnail:
          first.thumbnails?.[first.thumbnails.length - 1]?.url ||
          first.thumbnail,
        uploader: first.uploader || first.channel || "Unknown",
        description: first.description,
        view_count: undefined,
        item_count: collectedItems.length,
        items: collectedItems.map((e: any) => ({
          id: e.id,
          title: e.title,
          duration: e.duration,
          uploader: e.uploader || e.channel,
          url:
            e.webpage_url || e.url || `https://www.youtube.com/watch?v=${e.id}`,
          thumbnail:
            e.thumbnails?.[e.thumbnails.length - 1]?.url || e.thumbnail,
        })),
        original_url: url,
      };
    }

    // Scenario C: Single Video (collectedItems[0])
    if (collectedItems.length === 1) {
      const metadata = collectedItems[0];
      return {
        type: "video",
        id: metadata.id,
        title: metadata.title,
        thumbnail:
          metadata.thumbnails?.[metadata.thumbnails.length - 1]?.url ||
          metadata.thumbnail,
        duration: metadata.duration,
        uploader: metadata.uploader || metadata.channel,
        formats: metadata.formats || [],
        description: metadata.description,
        view_count: metadata.view_count,
        original_url: url,
      };
    }

    throw new Error("No valid video metadata found");
  } catch (error) {
    console.error("Error fetching metadata:", error);
    throw new Error(
      "Failed to fetch video metadata. Make sure yt-dlp is installed."
    );
  }
}

/**
 * Gets available quality options from metadata with audio availability info
 */
export function getAvailableQualities(
  metadata: VideoMetadata
): Array<{ quality: string; hasAudio: boolean }> {
  if (metadata.type === "playlist") {
    // Playlists generally don't have uniform qualities until we resolve each video
    // We can return a default set or empty.
    // For now, return empty as the UI should handle playlist view differently.
    return [];
  }

  const qualitiesMap = new Map<string, boolean>();
  const audioFormatsMap = new Map<number, any>(); // bitrate -> format

  metadata.formats.forEach((format) => {
    // Video formats
    if (format.resolution && format.resolution !== "audio only") {
      const height = format.resolution.split("x")[1];
      if (height) {
        const quality = `${height}p`;
        const hasAudio = format.acodec && format.acodec !== "none";
        const existing = qualitiesMap.get(quality);
        qualitiesMap.set(quality, existing || hasAudio || false);
      }
    }

    // Audio-only formats
    if (
      format.resolution === "audio only" &&
      format.abr &&
      format.acodec &&
      format.acodec !== "none"
    ) {
      const bitrate = Math.round(format.abr);
      // Keep highest quality format for each bitrate
      if (
        !audioFormatsMap.has(bitrate) ||
        (format.filesize &&
          format.filesize > (audioFormatsMap.get(bitrate)?.filesize || 0))
      ) {
        audioFormatsMap.set(bitrate, format);
      }
    }
  });

  const videoQualities = Array.from(qualitiesMap.entries())
    .map(([quality, hasAudio]) => ({ quality, hasAudio }))
    .sort((a, b) => {
      const aNum = parseInt(a.quality);
      const bNum = parseInt(b.quality);
      return bNum - aNum; // Sort descending
    });

  // Get top 3 audio formats by bitrate
  const audioQualities = Array.from(audioFormatsMap.entries())
    .sort((a, b) => b[0] - a[0]) // Sort by bitrate descending
    .slice(0, 3) // Take top 3
    .map(([bitrate, format]) => ({
      quality: `${bitrate}kbps`,
      hasAudio: true,
    }));

  // Only return actual audio formats found (no fallback defaults)
  return [...videoQualities, ...audioQualities];
}

/**
 * Downloads video to disk using aria2c for speed and FFmpeg for merging
 * Returns the file path and name for streaming to client
 * Provides real-time progress updates via callback
 */
export async function downloadVideoToDisk(
  url: string,
  quality: string = "best",
  formatType: "video" | "audio" = "video",
  onProgress?: (progress: {
    percent: number;
    downloaded: string;
    total: string;
    speed: string;
    eta: string;
    mergedSeconds?: number;
  }) => void,
  signal?: AbortSignal,
  downloadId?: string
): Promise<{ filePath: string; fileName: string }> {
  const path = await import("path");
  const os = await import("os");
  const fs = await import("fs");

  let formatString: string;
  const timestamp = Date.now();
  const id = downloadId || `download_${timestamp}`;

  // Auto-detect if this is an audio download
  const isAudioDownload =
    formatType === "audio" || quality === "audio" || quality.includes("kbps");

  // Determine Extension: Always MP4 for compatibility
  // High-res (4K/2K) videos are usually VP9 and need re-encoding
  const isHighRes =
    !isAudioDownload &&
    (quality === "best" || quality === "2160p" || quality === "1440p");
  const ext = isAudioDownload ? "mp3" : "mp4";

  const fileName = `${id}.${ext}`;

  // ⚡️ RAM Disk Optimization:
  // Check for specialized RAM volume to bypass IO bottlenecks
  let tempDir = os.tmpdir();
  const ramDiskPath = "/Volumes/RAMDisk";
  if (fs.existsSync(ramDiskPath)) {
    tempDir = ramDiskPath;
    console.log("🚀 [IO Boost] Using /Volumes/RAMDisk for temporary storage");
  }
  const filePath = path.join(tempDir, fileName);
  const progressFilePath = path.join(tempDir, `progress_${id}.txt`);

  // Initialize progress file
  try {
    fs.writeFileSync(progressFilePath, "");
  } catch (e) {
    console.warn("Failed to create progress file", e);
  }

  // Strategy: Prioritize iMovie-Compatible Formats (H.264/AVC)
  if (isAudioDownload) {
    // Audio download - just use best audio available
    // yt-dlp will automatically select the best audio format
    formatString = "bestaudio";
  } else if (quality === "best") {
    // Best quality: Strongly prefer H.264, fall back to others
    formatString = "bestvideo[vcodec^=avc1]+bestaudio/bestvideo+bestaudio/best";
  } else if (isHighRes) {
    // 4K/2K: Prefer H.264 (avc1) for instant copy, HEVC as backup, VP9 last resort
    formatString =
      "bestvideo[height=2160][vcodec^=avc1]+bestaudio[ext=m4a]/bestvideo[height=2160][vcodec^=hev1]+bestaudio[ext=m4a]/bestvideo[height=2160]+bestaudio/bestvideo[height>=2160]+bestaudio";
  } else {
    // 1080p/720p: Prefer H.264 in MP4 container
    const height = quality.replace("p", "");
    formatString = `bestvideo[height<=${height}][vcodec^=avc1][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${height}]`;
  }

  // 🎥 SMART FFMPEG: Conditional encoding based on resolution
  // 4K/2K: Usually VP9, needs re-encoding for iMovie
  // 1080p/720p: Usually H.264, just copy
  const ffmpegArgs = isHighRes
    ? // 4K/2K: Re-encode to H.264 for iMovie compatibility (using software encoder for Railway)
      `ffmpeg:-progress "${progressFilePath}" -c:v libx264 -preset faster -profile:v main -level 5.1 -b:v 35M -pix_fmt yuv420p -c:a aac -b:a 256k -ar 48000 -movflags +faststart`
    : // 1080p/720p: Stream copy (instant)
      `ffmpeg:-progress "${progressFilePath}" -c copy -movflags +faststart`;

  // 🚀 Configuration: Different for audio vs video
  let args: string[];

  if (isAudioDownload) {
    // Audio download configuration
    args = [
      "-f",
      formatString,

      // Extract audio and convert to MP3
      "--extract-audio",
      "--audio-format",
      "mp3",
      "--audio-quality",
      "0", // Best quality

      // Network Speed
      "-N",
      "32",
      "--no-check-certificate",

      // Authentication (only in development)
      ...(process.env.NODE_ENV !== "production"
        ? ["--cookies-from-browser", "chrome"]
        : []),

      "-o",
      filePath,
      "--newline",
      "--no-warnings",
      "--progress",
      url,
    ];
  } else {
    // Video download configuration
    args = [
      "-f",
      formatString,
      "--merge-output-format",
      ext,

      // Network Speed: Native yt-dlp parallelism
      "-N",
      "32",
      "--no-check-certificate",

      // Authentication (only in development)
      ...(process.env.NODE_ENV !== "production"
        ? ["--cookies-from-browser", "chrome"]
        : []),

      // Post-Process (Remux)
      "--postprocessor-args",
      ffmpegArgs,

      "-o",
      filePath,
      "--newline", // Required for parsing
      "--no-warnings",
      "--progress", // Show progress updates
      url,
    ];
  }

  return new Promise((resolve, reject) => {
    // Force Python to flush stdout/stderr immediately (no buffering)
    const ytDlpProcess = spawn(getYtDlpPath(), args, {
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
      signal, // Pass the abort signal
    });

    // Explicitly handle abort to ensure immediate kill
    if (signal) {
      signal.addEventListener("abort", () => {
        if (!ytDlpProcess.killed) {
          console.log("🛑 Abort signal received, force killing yt-dlp...");
          ytDlpProcess.kill("SIGKILL");
        }
      });
    }
    let outputBuffer = "";
    let isFinished = false;
    let lastError = ""; // Capture actual error message
    let ffmpegProgressBuffer: Record<string, string> = {}; // Buffer for FFmpeg progress key=value pairs
    let avgSpeedVal = 0;
    let avgEtaVal = 0;

    // Poll progress file for FFmpeg stats (Bypasses yt-dlp suppression)
    const progressInterval = setInterval(() => {
      if (!fs.existsSync(progressFilePath)) return;
      try {
        const content = fs.readFileSync(progressFilePath, "utf8");
        const lines = content.split("\n");
        const stats: Record<string, string> = {};

        // Process all lines to get latest state
        for (const line of lines) {
          const [k, v] = line.split("=");
          if (k && v) stats[k.trim()] = v.trim();
        }

        if (stats.out_time && onProgress) {
          const timeParts = stats.out_time.split(".")[0].split(":").map(Number);
          let seconds = 0;
          if (timeParts.length === 3) {
            seconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
          } else if (timeParts.length === 2) {
            seconds = timeParts[0] * 60 + timeParts[1];
          }

          onProgress({
            percent: 100,
            downloaded: "Merging",
            total: `${stats.out_time.split(".")[0]} @ ${stats.speed || "1x"}`,
            speed: `${stats.fps || 0} fps`,
            eta: "Merging...",
            mergedSeconds: seconds,
          });
        }
      } catch (e) {}
    }, 1000);

    // Helper to finish safely
    const finish = (err?: Error) => {
      clearInterval(progressInterval);
      if (fs.existsSync(progressFilePath)) {
        try {
          fs.unlinkSync(progressFilePath);
        } catch (e) {}
      }
      if (isFinished) return;
      isFinished = true;
      if (err) reject(err);
      else resolve({ filePath, fileName });
    };

    // Listen to both stdout and stderr for progress
    const handleOutput = (data: Buffer) => {
      const output = data.toString();

      // Update lastError if line looks like an error
      if (
        output.toLowerCase().includes("error") ||
        output.trim().startsWith("ERROR:")
      ) {
        lastError = output.trim();
      }
      outputBuffer += output;

      // Split by newlines and carriage returns
      const lines = outputBuffer.split(/\r|\n/);

      // Keep the last incomplete line in the buffer
      outputBuffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;

        // Verify post-processing start immediately
        if (
          (line.includes("[Merger]") || line.includes("[Fixup")) &&
          onProgress
        ) {
          onProgress({
            percent: 100,
            downloaded: "Merging",
            total: "Processing...",
            speed: "-",
            eta: "...",
          });
        }

        // Check if this is a line we should suppress
        const isDownloadProgress =
          line.includes("[download]") && line.includes("%");
        const isFFmpegProgress =
          line.includes("frame=") && line.includes("fps=");

        // Write non-progress lines to terminal (like [Merger], [info], errors, etc.)
        if (!isDownloadProgress && !isFFmpegProgress) {
          console.log(line);
        }

        // Parse FFmpeg progress in key=value format (from -progress pipe:2)
        // Matches "key=value", "key= value", "key = value"
        const ffmpegKeyValue = line.trim().match(/^(\w+)\s*=\s*(.+)$/);
        if (ffmpegKeyValue) {
          const [, key, value] = ffmpegKeyValue;
          ffmpegProgressBuffer[key] = value;

          // When we see 'progress=continue', we have a complete set of progress data
          if (key === "progress" && value === "continue" && onProgress) {
            const frame = ffmpegProgressBuffer.frame || "0";
            const fps = ffmpegProgressBuffer.fps || "0";
            const outTime = ffmpegProgressBuffer.out_time || "00:00:00";
            const speed = ffmpegProgressBuffer.speed || "0";

            onProgress({
              percent: 100,
              downloaded: "Merging",
              total: `${outTime} @ ${speed}`,
              speed: `${fps} fps`,
              eta: "Merging...",
            });

            console.log(
              `🎬 Merging | Frame: ${frame} | ${fps} fps | Time: ${outTime} | Speed: ${speed}`
            );

            // Clear buffer for next progress update
            ffmpegProgressBuffer = {};
          }
          continue;
        }

        // Parse Standard yt-dlp progress:
        // [download]  45.2% of  320.10MiB at   25.04MiB/s ETA 00:12
        const stdMatch = line.match(
          /\[download\]\s+(\d+\.?\d*)%\s+of\s+~?([\d.]+\s?\w+)\s+at\s+([\d.]+\s?\w+\/s)(?:\s+ETA\s+([\d:]+))?/
        );

        // Parse aria2c progress (relayed by yt-dlp):
        // Standard: [#20aa3b 26MiB/320MiB(8%) CN:16 DL:23MiB ETA:12s]
        // Variation: [#ed4b5c 22MiB/22MiB(99%) CN:1 DL:13MiB]
        const ariaMatch = line.match(
          /\[#\w+\s+([\d.]+\w+)\/([\d.]+\w+)\(([\d.]+)%\)\s+CN:\d+\s+DL:([\d.]+\w+)(?:\s+ETA:([\w:]+))?/
        );

        // Parse FFmpeg progress (single-line format, fallback):
        // frame= 1234 fps=60 q=28.0 size=   45056kB time=00:00:41.23 bitrate=8956.7kbits/s speed=2.0x
        const ffmpegMatch = line.match(
          /frame=\s*(\d+)\s+fps=\s*([\d.]+)\s+.*?time=\s*([\d:\.]+)\s+.*?speed=\s*([\d.]+)x/
        );

        if (stdMatch && onProgress) {
          const [, percent, total, speedStr, etaStr = "00:00"] = stdMatch;
          const percentNum = parseFloat(percent);

          // Normalized total (remove ~)
          const cleanTotal = total.replace("~", "");

          // Calculate downloaded from percent if needed
          const totalMatch = cleanTotal.match(/([\d.]+)\s*(\w+)/);
          let downloaded = "0";
          if (totalMatch) {
            const [, totalNum, totalUnit] = totalMatch;
            downloaded =
              ((percentNum / 100) * parseFloat(totalNum)).toFixed(2) +
              totalUnit;
          }

          // Smooth Speed
          const currentSpeedVal = parseFloat(speedStr);
          if (avgSpeedVal === 0 || isNaN(avgSpeedVal))
            avgSpeedVal = currentSpeedVal;
          else avgSpeedVal = 0.1 * currentSpeedVal + 0.9 * avgSpeedVal;
          const displaySpeed = `${avgSpeedVal.toFixed(2)}${speedStr.replace(
            /[\d.]+/,
            ""
          )}`;

          // Smooth ETA
          let currentEtaVal = 0;
          if (etaStr.includes(":")) {
            const parts = etaStr.split(":").map(Number);
            if (parts.length === 3)
              currentEtaVal = parts[0] * 3600 + parts[1] * 60 + parts[2];
            else currentEtaVal = parts[0] * 60 + parts[1];
          } else {
            currentEtaVal = parseFloat(etaStr) || 0;
          }

          if (avgEtaVal === 0 || isNaN(avgEtaVal)) avgEtaVal = currentEtaVal;
          else avgEtaVal = 0.1 * currentEtaVal + 0.9 * avgEtaVal;

          const h = Math.floor(avgEtaVal / 3600);
          const m = Math.floor((avgEtaVal % 3600) / 60);
          const s = Math.floor(avgEtaVal % 60);
          const displayEta =
            h > 0
              ? `${h}:${m.toString().padStart(2, "0")}:${s
                  .toString()
                  .padStart(2, "0")}`
              : `${m.toString().padStart(2, "0")}:${s
                  .toString()
                  .padStart(2, "0")}`;

          onProgress({
            percent: percentNum,
            downloaded,
            total: cleanTotal,
            speed: displaySpeed,
            eta: displayEta,
          });

          // Log real-time (no throttle) with cleaner format
          console.log(
            `${percent}% | ${displaySpeed} | ${downloaded}/${cleanTotal} | ETA: ${displayEta}`
          );
        } else if (ariaMatch && onProgress) {
          const [, downloaded, total, percentStrRaw, speed, eta = "unknown"] =
            ariaMatch;

          // Helper to parse size string (e.g. "23.5MiB") -> bytes
          const parseBytes = (s: string) => {
            const m = s.match(/([\d.]+)([KMG]i?B)/i);
            if (!m) return 0;
            const val = parseFloat(m[1]);
            const unit = m[2].toUpperCase();
            if (unit.startsWith("K")) return val * 1024;
            if (unit.startsWith("M")) return val * 1024 * 1024;
            if (unit.startsWith("G")) return val * 1024 * 1024 * 1024;
            return val;
          };

          let percentNum = parseFloat(percentStrRaw);

          // Try to calculate precise percentage if total > 0
          const downBytes = parseBytes(downloaded);
          const totalBytes = parseBytes(total);
          if (totalBytes > 0) {
            percentNum = (downBytes / totalBytes) * 100;
          }

          onProgress({
            percent: percentNum,
            downloaded,
            total,
            speed: `${speed}/s`, // aria2c shows speed as just "DL:23MiB"
            eta,
          });

          // Log real-time (no throttle) with cleaner format and 1 decimal precision
          console.log(
            `${percentNum.toFixed(
              1
            )}% | ${speed}/s | ${downloaded}/${total} | ETA: ${eta}`
          );
        } else if (ffmpegMatch && onProgress) {
          // FFmpeg conversion/merge progress (single-line fallback)
          const [, frame, fps, time, speed] = ffmpegMatch;

          // Show as "Merging" phase in UI
          onProgress({
            percent: 100, // Keep at 100% since download is done
            downloaded: "Merging",
            total: `${time} @ ${speed}x`,
            speed: `${fps} fps`,
            eta: "Merging...",
          });

          // Log FFmpeg progress to terminal
          console.log(
            `🎬 Converting | Frame: ${frame} | ${fps} fps | Time: ${time} | Speed: ${speed}x`
          );
        } else {
          // Debugging: Log raw line if it looks like progress but wasn't matched
          // Or if it contains any numbers and % signs to see what we missed
          if (
            line.includes("[#") ||
            line.includes("%") ||
            line.includes("DL:")
          ) {
            // console.log("[Unmatched]:", line.trim());
          }
        }

        // Log important messages
        if (line.includes("[info]") || line.includes("[Merger]")) {
          console.log("yt-dlp:", line.trim());
        }
      }
    };

    ytDlpProcess.stdout?.on("data", handleOutput);
    ytDlpProcess.stderr?.on("data", handleOutput);

    ytDlpProcess.on("close", (code) => {
      if (signal?.aborted) {
        finish(new Error("Download aborted"));
        return;
      }

      if (code === 0) {
        console.log(`✓ Download complete: ${filePath}`);
        finish();
      } else {
        finish(
          new Error(
            `${getYtDlpPath()} exited with code ${code}. Error: ${
              lastError || "Unknown error"
            }`
          )
        );
      }
    });

    ytDlpProcess.on("error", (error) => {
      console.error("yt-dlp process error:", error);
      finish(error);
    });
  });
}

/**
 * Gets the filename for the download
 */
export async function getVideoFilename(url: string): Promise<string> {
  try {
    const { stdout } = await execPromise(
      `${getYtDlpPath()} --get-filename -o "%(title)s.%(ext)s" --no-warnings "${url}"`
    );
    return stdout.trim();
  } catch (error) {
    return "video.mp4";
  }
}

/**
 * Cleans up all files associated with a specific download ID
 */
export function cleanupDownloadArtifacts(downloadId: string) {
  const os = require("os");
  const path = require("path");
  const fs = require("fs");

  const ramDisk = "/Volumes/RAMDisk";
  let tempDir = os.tmpdir();
  if (fs.existsSync(ramDisk)) {
    tempDir = ramDisk;
  }

  console.log(`[Cleanup] Scanning temp dir for artifacts: ${downloadId}`);

  try {
    const files = fs.readdirSync(tempDir);
    if (!downloadId) return;

    for (const file of files) {
      if (file.includes(downloadId)) {
        const fullPath = path.join(tempDir, file);
        try {
          fs.unlinkSync(fullPath);
          console.log(`[Cleanup] Deleted: ${file}`);
        } catch (e) {
          console.warn(`[Cleanup] Failed to delete ${file}`, e);
        }
      }
    }
  } catch (err) {
    console.error("[Cleanup] Error scanning directory:", err);
  }
}

/**
 * Fetches video transcript/subtitles
 */
export async function getVideoTranscript(
  url: string,
  language: string = "hi"
): Promise<string> {
  if (!validateYouTubeUrl(url)) {
    throw new Error("Invalid YouTube URL");
  }

  const path = await import("path");
  const os = await import("os");
  const fs = await import("fs");

  const tempDir = os.tmpdir();
  const timestamp = Date.now();
  const outputTemplate = path.join(tempDir, `transcript_${timestamp}`);

  console.log(`[Transcript] Fetching transcript for: ${url}`);
  console.log(`[Transcript] Requested language: ${language.toUpperCase()}`);

  try {
    // Try requested language first
    let command =
      `yt-dlp --write-auto-subs --write-subs --sub-lang ${language} --skip-download --convert-subs srt ${getCookiesFlag()} -o "${outputTemplate}" "${url}"`.trim();
    console.log(
      `[Transcript] Attempting ${language.toUpperCase()} subtitles...`
    );

    try {
      await execPromise(command);
    } catch (langError) {
      // If requested language fails, try English as fallback (unless already English)
      if (language !== "en") {
        console.log(
          `[Transcript] ${language.toUpperCase()} not available, trying English...`
        );
        command =
          `yt-dlp --write-auto-subs --write-subs --sub-lang en --skip-download --convert-subs srt ${getCookiesFlag()} -o \"${outputTemplate}\" \"${url}\"`.trim();
        await execPromise(command);
      } else {
        throw langError;
      }
    }

    // Find the generated subtitle file
    const files = fs.readdirSync(tempDir);
    const subFile = files.find(
      (f) => f.startsWith(`transcript_${timestamp}`) && f.endsWith(".srt")
    );

    if (!subFile) {
      console.log(`[Transcript] ❌ No subtitle file found`);
      throw new Error("No transcript/subtitles available for this video");
    }

    // Detect language from filename (e.g., transcript_123.hi.srt or transcript_123.en.srt)
    const langMatch = subFile.match(/\.([a-z]{2,3})\.srt$/);
    const detectedLang = langMatch ? langMatch[1] : "unknown";

    console.log(`[Transcript] ✓ Found subtitle file: ${subFile}`);
    console.log(
      `[Transcript] ✓ Language detected: ${detectedLang.toUpperCase()}`
    );

    const subFilePath = path.join(tempDir, subFile);
    const content = fs.readFileSync(subFilePath, "utf-8");

    // Clean up the subtitle file
    try {
      fs.unlinkSync(subFilePath);
      console.log(`[Transcript] ✓ Cleaned up temporary file`);
    } catch (e) {
      console.warn("[Transcript] Failed to delete transcript file:", e);
    }

    console.log(
      `[Transcript] ✓ Successfully fetched ${detectedLang.toUpperCase()} transcript (${
        content.length
      } characters)`
    );
    return content;
  } catch (error: any) {
    console.error(`[Transcript] ❌ Error:`, error.message);
    throw new Error(
      `Failed to fetch transcript: ${error.message || "Unknown error"}`
    );
  }
}
