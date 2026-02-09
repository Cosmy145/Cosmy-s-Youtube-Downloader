const YTDlpWrap = require("yt-dlp-wrap").default;
const path = require("path");
const fs = require("fs");

(async () => {
  try {
    const binPath = path.join(process.cwd(), "bin", "yt-dlp");
    console.log(`[Setup] Current working directory: ${process.cwd()}`);
    console.log(`[Setup] Target yt-dlp binary path: ${binPath}`);
    console.log(
      `[Setup] Node environment: ${process.env.NODE_ENV || "development"}`,
    );

    // Ensure bin directory exists
    const binDir = path.dirname(binPath);
    if (!fs.existsSync(binDir)) {
      console.log(`[Setup] Creating bin directory: ${binDir}`);
      fs.mkdirSync(binDir, { recursive: true });
    }

    // Check if binary already exists
    if (fs.existsSync(binPath)) {
      console.log(`[Setup] ⚠️  Binary already exists, removing old version...`);
      fs.unlinkSync(binPath);
    }

    console.log(`[Setup] Downloading latest yt-dlp binary from GitHub...`);
    await YTDlpWrap.downloadFromGithub(binPath);
    console.log(`[Setup] ✓ yt-dlp downloaded successfully`);

    // Verify file exists and has content
    const stats = fs.statSync(binPath);
    console.log(
      `[Setup] Binary size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`,
    );

    // Make executable
    fs.chmodSync(binPath, "755");
    console.log(`[Setup] ✓ Made binary executable (chmod 755)`);

    // Final verification
    if (!fs.existsSync(binPath)) {
      throw new Error("Binary file does not exist after download!");
    }

    console.log(`[Setup] ✓ Setup complete! yt-dlp is ready at: ${binPath}`);
  } catch (e) {
    console.error("[Setup] ❌ Failed to download yt-dlp:", e);
    console.error("[Setup] Error details:", e.message);
    console.error("[Setup] Stack trace:", e.stack);
    process.exit(1);
  }
})();
