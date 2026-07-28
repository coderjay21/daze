import { AUDIO_QUALITY, STORAGE_KEYS } from "@/constants";
import { appStorage } from "@/stores/storage";
import { Models, Song } from "@saavn-labs/sdk";
import { DownloadManager, TrackItem } from "react-native-nitro-player";

export interface DownloadedTrack {
  id: string;
  song: Models.Song;
  filePath: string;
  downloadedAt: number;
  fileSize: number;
  quality: string;
}

export interface DownloadProgress {
  id: string;
  progress: number;
  totalBytes: number;
  downloadedBytes: number;
  status: "pending" | "downloading" | "completed" | "failed" | "paused";
  error?: string;
}

export class DownloadService {
  private isConfigured = false;
  private progressCallbacks: Map<string, (progress: DownloadProgress) => void> = new Map();

  constructor() {
    this.configure();
  }

  private configure() {
    if (!this.isConfigured) {
      DownloadManager.configure({
        maxConcurrentDownloads: 3,
        backgroundDownloadsEnabled: true,
        downloadArtwork: true,
      });
      this.isConfigured = true;
    }
  }

  async getDownloadedTracks(): Promise<DownloadedTrack[]> {
    try {
      const data = await appStorage.getItem(STORAGE_KEYS.DOWNLOADS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("[DownloadService] Failed to get downloads:", error);
      return [];
    }
  }

  private async saveDownloadedTracks(tracks: DownloadedTrack[]): Promise<void> {
    try {
      await appStorage.setItem(STORAGE_KEYS.DOWNLOADS, JSON.stringify(tracks));
    } catch (error) {
      console.error("[DownloadService] Failed to save downloads:", error);
    }
  }

  async isDownloaded(songId: string): Promise<boolean> {
    return DownloadManager.isTrackDownloaded(songId);
  }

  async getDownloadInfo(songId: string): Promise<DownloadedTrack | null> {
    const downloads = await this.getDownloadedTracks();
    return downloads.find((d) => d.id === songId) || null;
  }

  async downloadTrack(
    track: Models.Song,
    onProgress?: (progress: DownloadProgress) => void,
  ): Promise<DownloadedTrack> {
    const songId = track.id;

    if (await this.isDownloaded(songId)) {
      throw new Error("Track already downloaded");
    }

    const progress: DownloadProgress = {
      id: songId,
      progress: 0,
      totalBytes: 0,
      downloadedBytes: 0,
      status: "pending",
    };

    if (onProgress) this.progressCallbacks.set(songId, onProgress);

    try {
      progress.status = "downloading";
      this.notifyProgress(songId, progress);

      const encrypted =
        track.media?.encryptedUrl ??
        (await Song.getById({ songIds: track.id })).songs?.[0]?.media?.encryptedUrl;
      if (!encrypted) throw new Error("No encrypted URL available");

      const urls = await Song.experimental.fetchStreamUrls(encrypted, "edge", true);

      const qualityKey = ((await appStorage.getItem(STORAGE_KEYS.CONTENT_QUALITY)) as string) || "MEDIUM";
      const qualityIndex = AUDIO_QUALITY[qualityKey.toUpperCase() as keyof typeof AUDIO_QUALITY] ?? AUDIO_QUALITY.MEDIUM;

      const streamUrl = urls?.[qualityIndex]?.url;
      if (!streamUrl) throw new Error("No streaming URL available");

      const artwork = track.images?.[2]?.url || track.images?.[1]?.url || "";
      const albumTitle = typeof track.album === "string" ? track.album : track.album?.title || "Unknown Album";
      const artistName = track.artists?.primary?.map((a) => a.name).join(", ") || "Unknown Artist";

      const trackItem: TrackItem = {
        id: songId,
        url: streamUrl,
        title: track.title || "Unknown Track",
        artist: artistName,
        album: albumTitle,
        artwork: artwork || null,
        duration: track.duration || 0,
        extraPayload: JSON.parse(JSON.stringify(track)),
      };

      await DownloadManager.downloadTrack(trackItem);

      const downloadedTrack: DownloadedTrack = {
        id: songId,
        song: track,
        filePath: "nitro-download://" + songId,
        downloadedAt: Date.now(),
        fileSize: 0,
        quality: qualityKey,
      };

      const downloads = await this.getDownloadedTracks();
      downloads.unshift(downloadedTrack);
      await this.saveDownloadedTracks(downloads);

      progress.status = "completed";
      progress.progress = 100;
      this.notifyProgress(songId, progress);
      return downloadedTrack;
    } catch (error) {
      console.error("[DownloadService] Download failed:", error);
      progress.status = "failed";
      progress.error = error instanceof Error ? error.message : "Download failed";
      this.notifyProgress(songId, progress);
      throw error;
    } finally {
      setTimeout(() => {
        this.progressCallbacks.delete(songId);
      }, 1000);
    }
  }

  async deleteDownload(songId: string): Promise<void> {
    const downloads = await this.getDownloadedTracks();
    const download = downloads.find((d) => d.id === songId);
    if (!download) throw new Error("Download not found");

    try {
      await DownloadManager.deleteDownloadedTrack(songId);
      const updated = downloads.filter((d) => d.id !== songId);
      await this.saveDownloadedTracks(updated);
    } catch (error) {
      console.error("[DownloadService] Delete failed:", error);
      throw error;
    }
  }

  async deleteAllDownloads(): Promise<void> {
    const downloads = await this.getDownloadedTracks();
    try {
      for (const download of downloads) {
        try {
          await DownloadManager.deleteDownloadedTrack(download.id);
        } catch (error) {
          console.error("[DownloadService] Failed to delete file:", download.filePath, error);
        }
      }
      await this.saveDownloadedTracks([]);
    } catch (error) {
      console.error("[DownloadService] Delete all failed:", error);
      throw error;
    }
  }

  async getTotalSize(): Promise<number> {
    const info = await DownloadManager.getStorageInfo();
    return info?.totalDownloadedSize || 0;
  }

  getProgress(songId: string): DownloadProgress | null {
    return null;
  }

  private notifyProgress(songId: string, progress: DownloadProgress): void {
    const callback = this.progressCallbacks.get(songId);
    if (callback) callback({ ...progress });
  }

  async cleanupOrphans(): Promise<void> {
    await DownloadManager.syncDownloads();
  }

  async getStats(): Promise<{
    totalDownloads: number;
    totalSize: number;
    averageSize: number;
    byQuality: Record<string, number>;
  }> {
    const downloads = await this.getDownloadedTracks();
    const info = await DownloadManager.getStorageInfo();
    const totalSize = info?.totalDownloadedSize || 0;

    const byQuality: Record<string, number> = {};
    downloads.forEach((d) => {
      byQuality[d.quality] = (byQuality[d.quality] || 0) + 1;
    });

    return {
      totalDownloads: downloads.length,
      totalSize,
      averageSize: downloads.length > 0 ? totalSize / downloads.length : 0,
      byQuality,
    };
  }

  async saveToDownloads(fileUri: string): Promise<void> {
    throw new Error("Not implemented for nitro downloads");
  }

  async exportTracks(songIds: string[]): Promise<void> {
    console.warn("Exporting nitro downloads is currently disabled");
  }
}

export const downloadService = new DownloadService();
