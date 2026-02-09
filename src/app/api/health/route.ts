import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execPromise = promisify(exec);

export async function GET() {
  try {
    const binPath = path.join(process.cwd(), "bin", "yt-dlp");
    const binExists = fs.existsSync(binPath);

    let ytDlpVersion = "not available";
    let ytDlpWorking = false;

    if (binExists) {
      try {
        const { stdout } = await execPromise(`"${binPath}" --version`);
        ytDlpVersion = stdout.trim();
        ytDlpWorking = true;
      } catch (error) {
        ytDlpVersion = "exists but not executable";
      }
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      ytDlp: {
        installed: binExists,
        working: ytDlpWorking,
        version: ytDlpVersion,
        path: binPath,
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
