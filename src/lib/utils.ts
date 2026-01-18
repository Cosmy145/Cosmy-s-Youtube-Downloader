/**
 * Format duration from seconds to MM:SS format
 */
export const formatDuration = (seconds?: number): string => {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

/**
 * Format view count with K/M suffix
 */
export const formatViewCount = (count?: number): string => {
  if (!count) return "0";
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

/**
 * Sanitize filename for safe file system usage
 */
export const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-z0-9]/gi, "_");
};

/**
 * Create download trigger via hidden iframe
 */
export const triggerDownload = (url: string): void => {
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = url;
  document.body.appendChild(iframe);
  setTimeout(() => {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }, 600000);
};
