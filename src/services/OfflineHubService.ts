import * as FileSystem from "expo-file-system/legacy";
import { useOfflineHubStore, HubTrack } from "@/stores/offlineHubStore";

const HUB_DIR = `${FileSystem.documentDirectory}offline_hub/`;

export class OfflineHubService {
  static async initDirectory() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(HUB_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(HUB_DIR, { intermediates: true });
      }
    } catch (error) {
      console.error("[HubService] Dir Init Error:", error);
    }
  }

  static async downloadTrackToHub(song: {
    id: string;
    title: string;
    artist: string;
    artwork: string;
    downloadUrl: string;
    mood?: string;
  }): Promise<boolean> {
    try {
      if (!song?.downloadUrl?.startsWith("http") || !song?.id) {
        return false;
      }

      await OfflineHubService.initDirectory();
      const store = useOfflineHubStore.getState();
      const targetAudioFile = `${HUB_DIR}${song.id}.m4a`;
      const targetArtworkFile = `${HUB_DIR}${song.id}.jpg`;

      await OfflineHubService.ensureSpaceForNewTrack(12 * 1024 * 1024);

      // 1. Download Audio File
      const downloadRes = await FileSystem.downloadAsync(song.downloadUrl, targetAudioFile);
      const fileInfo = await FileSystem.getInfoAsync(downloadRes.uri);

      if (!fileInfo.exists) return false;

      // 2. Download and Cache Artwork Offline
      let localArtworkUri = song.artwork;
      if (song.artwork && song.artwork.startsWith("http")) {
        try {
          const imgRes = await FileSystem.downloadAsync(song.artwork, targetArtworkFile);
          const imgInfo = await FileSystem.getInfoAsync(imgRes.uri);
          if (imgInfo.exists) {
            localArtworkUri = imgRes.uri;
          }
        } catch (imgErr) {
          console.warn("[HubService] Artwork offline cache error:", imgErr);
        }
      }

      // 3. Save to Store with Local Artwork URI
      const newTrack: HubTrack = {
        id: song.id,
        title: song.title || "Unknown",
        artist: song.artist || "Unknown",
        artwork: localArtworkUri,
        localUri: downloadRes.uri,
        fileSizeBytes: fileInfo.size || 6 * 1024 * 1024,
        mood: song.mood || "sad",
        addedAt: Date.now(),
        playCount: 0,
        isPinned: false,
      };

      store.addTrackToHub(newTrack);
      return true;
    } catch (error) {
      console.error("[HubService] Download failed:", song.title, error);
      return false;
    }
  }

  static async ensureSpaceForNewTrack(requiredBytes: number) {
    try {
      const store = useOfflineHubStore.getState();
      const maxBytes = (store.maxQuotaMB || 500) * 1024 * 1024;
      const cached = store.cachedTracks || [];
      let currentBytes = cached.reduce((acc, t) => acc + (t?.fileSizeBytes || 0), 0);

      if (currentBytes + requiredBytes <= maxBytes) return;

      const evictable = [...cached]
        .filter((t) => !t?.isPinned)
        .sort((a, b) => (a?.playCount || 0) - (b?.playCount || 0) || (a?.addedAt || 0) - (b?.addedAt || 0));

      for (const track of evictable) {
        if (currentBytes + requiredBytes <= maxBytes) break;
        try {
          if (track?.localUri) {
            await FileSystem.deleteAsync(track.localUri, { idempotent: true });
          }
          if (track?.artwork && track.artwork.startsWith("file://")) {
            await FileSystem.deleteAsync(track.artwork, { idempotent: true });
          }
          store.removeTrackFromHub(track.id);
          currentBytes -= track.fileSizeBytes || 0;
        } catch (_) {}
      }
    } catch (_) {}
  }

  static async removeTrack(id: string) {
    try {
      const store = useOfflineHubStore.getState();
      const tracks = store.cachedTracks || [];
      const track = tracks.find((t) => t.id === id);
      if (track?.localUri) {
        await FileSystem.deleteAsync(track.localUri, { idempotent: true });
      }
      if (track?.artwork && track.artwork.startsWith("file://")) {
        await FileSystem.deleteAsync(track.artwork, { idempotent: true });
      }
      store.removeTrackFromHub(id);
    } catch (_) {}
  }
}
