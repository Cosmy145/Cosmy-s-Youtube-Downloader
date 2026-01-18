# YouTube Downloader

A simple YouTube video downloader built with Next.js, TypeScript, and yt-dlp.

## Prerequisites

Before running this application, you need to install:

1. **yt-dlp** - The YouTube download tool
2. **FFmpeg** - For merging video and audio streams

### Installing yt-dlp

**macOS:**

```bash
brew install yt-dlp
```

**Linux:**

```bash
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

**Windows:**
Download from [yt-dlp releases](https://github.com/yt-dlp/yt-dlp/releases) and add to PATH.

### Installing FFmpeg

**macOS:**

```bash
brew install ffmpeg
```

**Linux:**

```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH.

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

## Running the Application

### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Usage

1. Paste a YouTube URL into the input field
2. Click "Get Info" to fetch video metadata
3. Select your preferred quality
4. Click "Download Video" to start the download

## Features

- ✅ Fetch video metadata (title, thumbnail, duration)
- ✅ Multiple quality options
- ✅ Direct streaming (no server storage)
- ✅ Automatic video+audio merging for high quality videos
- ✅ Simple and clean UI

## Important Notes

### Hosting

This application requires `yt-dlp` and `FFmpeg` to be installed on the server. It **will not work** on serverless platforms like Vercel or Netlify due to:

- Missing system dependencies
- Function timeout limits (usually 10-30 seconds)

**Recommended hosting options:**

- VPS (DigitalOcean, Hetzner, AWS EC2)
- Any platform where you can install system dependencies

### Legal Considerations

⚠️ **Important:** Only download videos you have the right to download. Respect YouTube's Terms of Service and copyright laws.

### Rate Limiting

Heavy usage from a single IP may trigger YouTube's rate limiting. For production use, consider implementing:

- Request queuing
- Rotating proxies
- Rate limiting on your end

## Troubleshooting

### "yt-dlp command not found"

Make sure yt-dlp is installed and in your system PATH:

```bash
which yt-dlp
```

### "FFmpeg not found"

Make sure FFmpeg is installed:

```bash
which ffmpeg
```

### Download fails or times out

- Check your internet connection
- Try a different video
- Check if the video is available in your region
- Ensure yt-dlp is up to date: `yt-dlp -U`

## Technology Stack

- **Frontend:** Next.js 14, React, TypeScript
- **Backend:** Next.js API Routes
- **Download Engine:** yt-dlp
- **Video Processing:** FFmpeg
- **Styling:** CSS Modules

## License

MIT
# Production Ready
