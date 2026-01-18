import { NextRequest, NextResponse } from "next/server";
import { getVideoTranscript } from "@/lib/yt-dlp-utils";

export async function POST(request: NextRequest) {
  try {
    const { url, language = "hi" } = await request.json();

    console.log(`[API /transcript] Request received for URL: ${url}`);
    console.log(`[API /transcript] Language: ${language}`);

    if (!url) {
      console.log(`[API /transcript] ❌ Missing URL parameter`);
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      );
    }

    console.log(`[API /transcript] Fetching transcript...`);
    const transcript = await getVideoTranscript(url, language);

    console.log(`[API /transcript] ✓ Transcript fetched successfully`);

    return NextResponse.json({
      success: true,
      transcript,
    });
  } catch (error: any) {
    console.error(`[API /transcript] ❌ Error:`, error.message);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch transcript" },
      { status: 500 }
    );
  }
}
