# 🚀 Cosmy's YouTube Downloader

A high-performance, aesthetically pleasing, and production-ready YouTube video downloader built with Next.js, optimized for speed and quality.

![License](https://img.shields.io/badge/license-MIT-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## 🌟 Key Features

- **High-Fidelity Downloads**: Support for up to 4K resolution with exact quality matching.
- **Buffer-to-Disk Architecture**: Utilizes a robust 3-phase download process (Download -> Merge -> Stream) to ensure stability.
- **High-Speed Engine**: Leverages `aria2c` for multi-connection downloads, achieving speeds 10x-50x faster than standard tools.
- **Smart Merging**: Automatically merges high-quality video and audio streams using FFmpeg.
- **iMovie Compatibility**: Intelligent conditional encoding ensures files work seamlessly with editors like iMovie (using Fast Stream Copy where possible).
- **Modern UI/UX**:
  - Sleek "Bento grid" aesthetics on the landing and terms pages.
  - Smooth animations with Framer Motion.
  - Clean, responsive design using Material UI & custom CSS.
- **Real-time Progress**: Accurate progress bars for both server-side downloading and client-side streaming.
- **Privacy Focused**: Server-side temporary files are automatically cleaned up; no logs are kept.

## 🏗 Architecture & Performance

This project uses an industry-standard **Buffer-to-Disk** approach to solve common streaming reliability issues.

### How it Works

1.  **Phase 1: High-Speed Download (Server-Side)**
    - The server spawns `yt-dlp` paired with `aria2c` (up to 16 connections) to download raw streams to a temporary server directory (`/tmp`).
    - FFmpeg merges video and audio instantaneously.
    - _Result_: 15-20 MB/s download speeds (vs 0.5 MB/s typical).

2.  **Phase 2: Stream to Client**
    - Once the file is ready on the server, it's streamed to the browser with proper `Content-Length` headers.
    - This ensures the browser knows the exact file size and displays an accurate download bar.

3.  **Phase 3: Automatic Cleanup**
    - Temporary files are rigorously deleted after the stream ends, on error, or if the user cancels.

For more details, see [ARCHITECTURE.md](./ARCHITECTURE.md) and [PERFORMANCE.md](./PERFORMANCE.md).

## 🛠 Technology Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules, Material UI, Framer Motion
- **Core Engines**:
  - [yt-dlp](https://github.com/yt-dlp/yt-dlp) (Media extraction)
  - [ffmpeg](https://ffmpeg.org/) (Media processing/merging)
  - [aria2](https://github.com/aria2/aria2) (Download acceleration)

## 📋 Prerequisites

To run this application locally or on a server, you **must** have the following system dependencies installed.

### 1. yt-dlp

The core engine for extracting video data.

- **Mac**: `brew install yt-dlp`
- **Linux**: `sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && sudo chmod a+rx /usr/local/bin/yt-dlp`
- **Windows**: Download from [releases](https://github.com/yt-dlp/yt-dlp/releases).

### 2. FFmpeg

Required for merging audio and video streams.

- **Mac**: `brew install ffmpeg`
- **Linux**: `sudo apt install ffmpeg`
- **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html).

### 3. aria2 (Optional but Recommended)

Required for high-speed downloads.

- **Mac**: `brew install aria2`
- **Linux**: `sudo apt install aria2`
- **Windows**: Download from [aria2 releases](https://github.com/aria2/aria2/releases).

## 🚀 Getting Started

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/Cosmy145/Cosmy-s-Youtube-Downloader.git
    cd Cosmy-s-Youtube-Downloader
    ```

2.  **Install Dependencies**

    ```bash
    npm install
    ```

3.  **Run Development Server**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) in your browser.

4.  **Production Build**
    ```bash
    npm run build
    npm start
    ```

## 🌍 Deployment

**Important**: This application requires a persistent runtime environment to handle system processes (`yt-dlp`, `ffmpeg`).

- **Recommended**: VPS (DigitalOcean, AWS EC2, Hetzner, Railway with Dockerfile).
- **Not Supported**: Serverless platforms (Vercel, Netlify) due to timeout limits and lack of persistent filesystem access.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## ⚖️ Legal & Disclaimer

This project is for educational and personal use only. Users are responsible for complying with YouTube's Terms of Service and applicable copyright laws. Do not use this tool to infringe on intellectual property rights.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
