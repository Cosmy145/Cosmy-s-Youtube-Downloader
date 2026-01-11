import { NextRequest, NextResponse } from "next/server";
import { getVideoMetadata, getAvailableQualities } from "@/lib/yt-dlp-utils";
import type { ApiResponse, VideoMetadata } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "URL is required" },
        { status: 400 }
      );
    }

    const metadata = await getVideoMetadata(url);
    const availableQualities = getAvailableQualities(metadata);

    return NextResponse.json<
      ApiResponse<VideoMetadata & { availableQualities: string[] }>
    >({
      success: true,
      data: {
        ...metadata,
        availableQualities,
      },
    });
  } catch (error) {
    console.error("Metadata API error:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch video metadata",
      },
      { status: 500 }
    );
  }
}
