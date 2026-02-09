#!/usr/bin/env node

/**
 * Test script to verify yt-dlp setup
 * Run this to ensure yt-dlp is properly configured before deploying
 */

const { exec } = require("child_process");
const { promisify } = require("util");
const path = require("path");
const fs = require("fs");

const execPromise = promisify(exec);

async function testYtDlp() {
  console.log("🧪 Testing yt-dlp setup...\n");

  // Check if binary exists
  const binPath = path.join(process.cwd(), "bin", "yt-dlp");
  console.log(`1. Checking binary at: ${binPath}`);

  if (!fs.existsSync(binPath)) {
    console.error("   ❌ Binary not found!");
    console.log("\n💡 Run: node scripts/setup-yt-dlp.js");
    process.exit(1);
  }

  console.log("   ✓ Binary exists");

  // Check file size
  const stats = fs.statSync(binPath);
  console.log(`   ✓ Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  // Check permissions
  const mode = (stats.mode & parseInt("777", 8)).toString(8);
  console.log(`   ✓ Permissions: ${mode}`);

  if (mode !== "755") {
    console.warn(`   ⚠️  Expected 755, got ${mode}`);
  }

  // Test execution
  console.log("\n2. Testing yt-dlp execution...");
  try {
    const { stdout } = await execPromise(`"${binPath}" --version`);
    console.log(`   ✓ Version: ${stdout.trim()}`);
  } catch (error) {
    console.error("   ❌ Failed to execute:", error.message);
    process.exit(1);
  }

  // Test with a simple command
  console.log("\n3. Testing metadata fetch...");
  try {
    const testUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    const { stdout } = await execPromise(
      `"${binPath}" -j --flat-playlist --no-warnings "${testUrl}"`,
    );
    const metadata = JSON.parse(stdout);
    console.log(`   ✓ Successfully fetched metadata for: ${metadata.title}`);
  } catch (error) {
    console.error("   ❌ Failed to fetch metadata:", error.message);
    console.log(
      "   💡 This might be a network issue or YouTube blocking the request",
    );
  }

  console.log("\n✅ All tests passed! yt-dlp is ready to use.");
}

testYtDlp().catch((error) => {
  console.error("\n❌ Test failed:", error);
  process.exit(1);
});
