export interface VideoFormat {
  format_id: string;
  ext: string;
  resolution: string;
  filesize?: number;
  vcodec?: string;
  acodec?: string;
  format_note?: string;
}

export interface BaseMetadata {
  id: string;
  title: string;
  thumbnail: string;
  uploader: string;
  description?: string;
  view_count?: number;
  original_url?: string;
}

export interface SingleVideoMetadata extends BaseMetadata {
  type: "video";
  duration: number;
  formats: VideoFormat[];
}

export interface PlaylistItem {
  id: string;
  title: string;
  duration: number;
  uploader: string;
  url: string;
  thumbnail?: string;
}

export interface PlaylistMetadata extends BaseMetadata {
  type: "playlist";
  item_count: number;
  items: PlaylistItem[];
}

export type VideoMetadata = SingleVideoMetadata | PlaylistMetadata;

export interface DownloadRequest {
  url: string;
  quality?: string;
  format?: "video" | "audio";
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
