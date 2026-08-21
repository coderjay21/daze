import * as FileSystem from "expo-file-system";
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
    mood?: any;
  }): Promise<boolean> {
    try {
      if (!song?.downloadUrl || !song?.id) return false;

      // 1. Force directory check
      await OfflineHubService.initDirectory();
      const store = useOfflineHubStore.getState();
      const targetFile = `${HUB_DIR}${song.id}.m4a`;

      // 2. Clear old space if needed
      await OfflineHubService.ensureSpaceForNewTrack(10 * 1024 * 1024);

      // 3. Check if file already downloaded but missing in UI
      const existingFile = await FileSystem.getInfoAsync(targetFile);
      if (existingFile.exists) {
        await FileSystem.deleteAsync(targetFile, { idempotent: true }); // Delete corrupted file if any
      }

      // 4. Download smoothly
      const downloadRes = await FileSystem.downloadAsync(song.downloadUrl, targetFile);
      const fileInfo = await FileSystem.getInfoAsync(downloadRes.uri);

      if (fileInfo.exists) {
        const newTrack: HubTrack = {
          id: song.id,
          title: song.title || "Unknown",
          artist: song.artist || "Unknown",
          artwork: song.artwork || "",
          localUri: downloadRes.uri,
          fileSizeBytes: fileInfo.size || 8 * 1024 * 1024,
          mood: song.mood || "sad",
          addedAt: Date.now(),
          playCount: 0,
          isPinned: false,
        };
        
        // Update state directly
        store.addTrackToHub(newTrack);
        return true;
      }
      return false;
    } catch (error) {
      console.error("[HubService] Download Failed:", error);
      return false;
    }
  }

  static async ensureSpaceForNewTrack(requiredBytes: number) {
    try {
      const store = useOfflineHubStore.getState();
      const maxBytes = (store.maxQuotaMB || 500) * 1024 * 1024;
      let currentBytes = store.getTotalUsedBytes ? store.getTotalUsedBytes() : 0;

      if (currentBytes + requiredBytes <= maxBytes) return;

      const tracks = store.cachedTracks || [];
      const evictable = [...tracks]
        .filter((t) => !t?.isPinned)
        .sort((a, b) => (a?.playCount || 0) - (b?.playCount || 0) || (a?.addedAt || 0) - (b?.addedAt || 0));

      for (const track of evictable) {
        if (currentBytes + requiredBytes <= maxBytes) break;
        try {
          if (track?.localUri) {
            await FileSystem.deleteAsync(track.localUri, { idempotent: true });
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
      if (track && track.localUri) {
        await FileSystem.deleteAsync(track.localUri, { idempotent: true });
      }
      store.removeTrackFromHub(id);
    } catch (_) {}
  }
}
