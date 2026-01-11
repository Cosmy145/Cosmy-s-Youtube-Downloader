import { NextRequest } from "next/server";
import { downloadVideoToDisk } from "@/lib/yt-dlp-utils";
import { createReadStream, statSync, unlinkSync } from "fs";

// Store active downloads with their progress
const activeDownloads = new Map<string, any>();

export async function POST(request: NextRequest) {
  let filePath: string | null = null;
  let downloadId = `download_${Date.now()}`;

  try {
    const body = await request.json();
    const {
      url,
      quality = "best",
      format = "video",
      downloadId: clientDownloadId,
    } = body;

    // Use client-provided ID if available
    if (clientDownloadId) {
      downloadId = clientDownloadId;
    }

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

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
          status: "downloading",
        });
      },
      controller.signal
    );
    filePath = downloadedFile;

    // Update status to merging/streaming
    const dataAfterDownload = activeDownloads.get(downloadId) || {};
    activeDownloads.set(downloadId, {
      ...dataAfterDownload,
      status: "streaming",
      percent: 100,
    });

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
          // Cleanup
          activeDownloads.delete(downloadId);
          if (filePath) {
            try {
              unlinkSync(filePath);
              console.log(`[${downloadId}] ✓ Cleaned up temp file`);
            } catch (err) {
              console.error(`[${downloadId}] Failed to delete temp file`, err);
            }
          }
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

    // Return the stream with proper headers
    const ext = format === "audio" ? "mp3" : "mp4";
    return new Response(stream, {
      headers: {
        "Content-Type": format === "audio" ? "audio/mpeg" : "video/mp4",
        "Content-Disposition": `attachment; filename="download.${ext}"`,
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

// DELETE endpoint to cancel a download
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const downloadId = searchParams.get("id");

  if (!downloadId) {
    return new Response("Download ID required", { status: 400 });
  }

  const download = activeDownloads.get(downloadId);
  if (download && download.controller) {
    console.log(`[${downloadId}] Cancelling download via API`);
    download.controller.abort(); // This triggers the abort signal in spawn
    activeDownloads.delete(downloadId);
    return new Response("Cancelled", { status: 200 });
  }

  return new Response("Download not found", { status: 404 });
}

// GET endpoint for Server-Sent Events progress updates
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const downloadId = searchParams.get("id");

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

            // If download is complete, close the stream
            if (progress.status === "complete" || progress.percent === 100) {
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

export const maxDuration = 300; // 5 minutes
