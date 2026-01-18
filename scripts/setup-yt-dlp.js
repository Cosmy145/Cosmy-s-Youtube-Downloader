const YTDlpWrap = require("yt-dlp-wrap").default;
const path = require("path");
const fs = require("fs");

(async () => {
  try {
    const binPath = path.join(process.cwd(), "bin", "yt-dlp");
    console.log(`Downloading latest yt-dlp binary to ${binPath}...`);

    // Ensure bin directory exists
    const binDir = path.dirname(binPath);
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true });
    }

    await YTDlpWrap.downloadFromGithub(binPath);
    console.log("yt-dlp downloaded successfully");

    // Make executable
    fs.chmodSync(binPath, "755");
    console.log("Made binary executable");
  } catch (e) {
    console.error("Failed to download yt-dlp:", e);
    process.exit(1);
  }
})();
