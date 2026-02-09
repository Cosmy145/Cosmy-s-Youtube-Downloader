# Railway Deployment Guide

## Prerequisites

Your Railway project should have the following environment variables configured:

- `NODE_ENV=production`

## Deployment Steps

### 1. Initial Setup

The application uses Nixpacks for building on Railway. The build process is configured in `nixpacks.toml` and includes:

- Node.js 20
- Python 3 (required by yt-dlp)
- FFmpeg (for video processing)

### 2. Automatic yt-dlp Installation

During the build process, the `scripts/setup-yt-dlp.js` script will:

1. Download the latest yt-dlp binary from GitHub
2. Place it in the `bin/` directory
3. Make it executable (chmod 755)

This happens automatically during the `install` phase.

### 3. Verify Deployment

After deployment, check the build logs for:

```
[Setup] ✓ Setup complete! yt-dlp is ready at: /app/bin/yt-dlp
[Install] ✓ yt-dlp binary exists
```

You can also visit `/api/health` to verify the application is running correctly.

## Troubleshooting

### yt-dlp not found

If you see errors like:

```
/bin/sh: 1: yt-dlp: not found
```

**Causes:**

1. The setup script didn't run during build
2. The binary wasn't downloaded successfully
3. The bin directory wasn't created

**Solutions:**

1. **Check build logs** - Look for the setup script output in Railway's build logs
2. **Trigger a rebuild** - Sometimes a fresh build resolves issues:

   ```bash
   # Create an empty file to trigger rebuild
   touch .railway-rebuild
   git add .railway-rebuild
   git commit -m "Trigger Railway rebuild"
   git push
   ```

3. **Verify nixpacks.toml** - Ensure it includes:

   ```toml
   [phases.install]
   cmds = [
     "npm ci",
     "node scripts/setup-yt-dlp.js"
   ]
   ```

4. **Check Railway environment** - Ensure Python 3 is available (required by yt-dlp)

### HTTP 403 Errors

If downloads fail with HTTP 403 errors:

- This is usually YouTube blocking the request
- The application uses cookies in development but not in production
- Consider implementing IP rotation or using YouTube API for production

### Memory Issues

If you encounter memory issues during video processing:

- Increase Railway's memory allocation
- Consider using lower quality settings for large videos
- The application uses temporary storage efficiently

## Local Testing

Before deploying, test the setup locally:

```bash
# Install dependencies
npm install

# Run setup script
node scripts/setup-yt-dlp.js

# Test yt-dlp
node scripts/test-yt-dlp.js

# Run development server
npm run dev
```

## Build Configuration

The build process uses:

- **Builder**: Nixpacks
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Node Version**: 20

These are configured in `railway.json` and `nixpacks.toml`.

## Support

If issues persist:

1. Check Railway build logs for detailed error messages
2. Verify all dependencies are installed
3. Ensure the setup script completed successfully
4. Check that the bin directory exists and contains yt-dlp
