import { NextRequest } from "next/server";
import { downloadVideoToDisk } from "@/lib/yt-dlp-utils";
import { createReadStream, statSync, unlinkSync } from "fs";

// Store active downloads with their progress
const activeDownloads = new Map<string, any>();

async function performDownload(
  url: string,
  quality: string,
  format: string,
  downloadId: string,
  title?: string
) {
  let filePath: string | null = null;

  try {
    console.log(`[${downloadId}] Starting download: ${quality} quality`);

    // Initialize progress tracking with AbortController
    const controller = new AbortController();
    activeDownloads.set(downloadId, {
      percent: 0,
      downloaded: "0MB",
      total: "0MB",
      speed: "0MB/s",
      eta: "00:00",
      status: "downloading",
      controller, // Store controller to cancel later
    });

    // Phase 1: Download to disk with progress tracking
    const { filePath: downloadedFile } = await downloadVideoToDisk(
      url,
      quality,
      format as "video" | "audio",
      (progress) => {
        // Update progress for this download
        const currentData = activeDownloads.get(downloadId) || {};
        activeDownloads.set(downloadId, {
          ...currentData,
          ...progress,
          status:
            progress.downloaded === "Converting" ? "converting" : "downloading",
        });
      },
      controller.signal
    );
    filePath = downloadedFile;

    // Update status to streaming (file ready, sending to browser)
    const dataAfterDownload = activeDownloads.get(downloadId) || {};
    activeDownloads.set(downloadId, {
      ...dataAfterDownload,
      status: "streaming",
      percent: 100,
      downloaded: dataAfterDownload.total || "Complete",
      eta: "00:00",
    });

    // Small delay to ensure SSE receives the status update
    await new Promise((resolve) => setTimeout(resolve, 100));
    console.log(`[${downloadId}] Download complete, streaming to client`);

    // Phase 2: Get file stats and create read stream
    const stats = statSync(filePath);
    const fileStream = createReadStream(filePath);

    // Phase 3: Stream to client
    const stream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => {
          controller.enqueue(chunk);
        });

        fileStream.on("end", () => {
          controller.close();
          // Delayed cleanup to ensure SSE reads the "streaming" status
          setTimeout(() => {
            activeDownloads.delete(downloadId);
            if (filePath) {
              try {
                unlinkSync(filePath);
                console.log(`[${downloadId}] ✓ Cleaned up temp file`);
              } catch (err) {
                console.error(
                  `[${downloadId}] Failed to delete temp file`,
                  err
                );
              }
            }
          }, 2000); // 2 second delay for SSE to close gracefully
        });

        fileStream.on("error", (error) => {
          console.error(`[${downloadId}] File stream error:`, error);
          controller.error(error);
          activeDownloads.delete(downloadId);
          if (filePath) {
            try {
              unlinkSync(filePath);
            } catch (err) {
              console.error(
                `[${downloadId}] Failed to delete temp file on error`
              );
            }
          }
        });
      },
      cancel() {
        console.log(`[${downloadId}] Stream cancelled by client`);
        fileStream.destroy();
        activeDownloads.delete(downloadId);
        if (filePath) {
          try {
            unlinkSync(filePath);
          } catch (err) {
            console.error(
              `[${downloadId}] Failed to delete temp file on cancel`
            );
          }
        }
      },
    });

    // Determine extension from actual file
    // Dynamic import inside async function to avoid top-level await issues if any
    const extMatch = filePath.match(/\.([0-9a-z]+)$/i);
    const ext = extMatch
      ? extMatch[1].toLowerCase()
      : format === "audio"
      ? "mp3"
      : "mp4";

    // Sanitize title for filename
    const safeTitle = title
      ? title.replace(/[^\w\s\-\.]/g, "").trim()
      : `download_${Date.now()}`;
    const filename = safeTitle.endsWith(`.${ext}`)
      ? safeTitle
      : `${safeTitle}.${ext}`;

    return new Response(stream, {
      headers: {
        "Content-Type":
          ext === "mp3"
            ? "audio/mpeg"
            : ext === "webm"
            ? "video/webm"
            : "video/mp4",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": stats.size.toString(),
        "X-Download-Id": downloadId,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("abort")) {
      console.log(`[${downloadId}] Download aborted`);
    } else {
      console.error(`[${downloadId}] Download API error:`, error);
    }

    activeDownloads.delete(downloadId);
    if (filePath) {
      try {
        unlinkSync(filePath);
      } catch (err) {
        console.error(`[${downloadId}] Failed to delete temp file on error`);
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to download video",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      url,
      quality = "best",
      format = "video",
      downloadId: clientDownloadId,
      title,
    } = body;
    const downloadId = clientDownloadId || `download_${Date.now()}`;

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return performDownload(url, quality, format, downloadId, title);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
// Cancel an active download
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const downloadId = searchParams.get("id");

  if (!downloadId) {
    return new Response(JSON.stringify({ error: "Download ID required" }), {
      status: 400,
    });
  }

  const download = activeDownloads.get(downloadId);
  if (download && download.controller) {
    console.log(`[${downloadId}] Aborting download via API request`);
    download.controller.abort(); // Kills yt-dlp process
    activeDownloads.delete(downloadId);
    return new Response(JSON.stringify({ success: true }));
  }

  return new Response(JSON.stringify({ error: "Download not found" }), {
    status: 404,
  });
}
// GET endpoint (Handles both SSE and Direct Download)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const downloadId = searchParams.get("id");
  const url = searchParams.get("url");

  // MODE 1: Direct File Download (Browser Navigation)
  if (url && downloadId) {
    const quality = searchParams.get("quality") || "best";
    const format = searchParams.get("format") || "video";
    const title = searchParams.get("title") || undefined;
    return performDownload(url, quality, format, downloadId, title);
  }

  // MODE 2: SSE Progress Updates
  if (!downloadId) {
    return new Response("Download ID required", { status: 400 });
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const startTime = Date.now();
      let isActive = true; // Prevents race conditions

      const interval = setInterval(() => {
        if (!isActive) {
          clearInterval(interval);
          return;
        }

        const progress = activeDownloads.get(downloadId);

        if (progress) {
          // Remove controller from JSON response to avoid circular ref error
          const { controller: _, ...safeProgress } = progress;
          try {
            const data = `data: ${JSON.stringify(safeProgress)}\n\n`;
            controller.enqueue(encoder.encode(data));

            // If download is complete or streaming to browser, close the SSE stream
            if (
              progress.status === "complete" ||
              progress.status === "streaming"
            ) {
              isActive = false;
              clearInterval(interval);
              try {
                controller.close();
              } catch (e) {}
            }
          } catch (e) {
            // Stream likely closed by client
            isActive = false;
            clearInterval(interval);
          }
        } else {
          // If less than 10 seconds have passed, it might be starting up (race condition fix)
          if (Date.now() - startTime < 10000) {
            return;
          }

          // Download not found or completed/cleaned up
          isActive = false;
          clearInterval(interval);
          try {
            controller.close();
          } catch (e) {}
        }
      }, 500); // Update every 500ms

      // Cleanup on close
      return () => {
        isActive = false;
        clearInterval(interval);
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// DELETE endpoint to cancel a download

export const maxDuration = 300; // 5 minutes
