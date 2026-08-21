import * as FileSystem from "expo-file-system";
import * as Notifications from "expo-notifications";
import { useOfflineHubStore, HubTrack } from "@/stores/offlineHubStore";

const HUB_DIR = `${FileSystem.documentDirectory}offline_hub/`;

class OfflineHubService {
  async initDirectory() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(HUB_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(HUB_DIR, { intermediates: true });
      }
    } catch (_) {}
  }

  // Safe Notification Dispatcher
  async notifyHubRefreshed(addedCount: number, removedCount: number) {
    try {
      const permission = await Notifications.getPermissionsAsync();
      if (!permission.granted) {
        const req = await Notifications.requestPermissionsAsync();
        if (!req.granted) return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "⚡ Daze Offline Hub Refreshed",
          body: `Added ${addedCount} fresh tracks matching your taste. Removed ${removedCount} older songs to maintain quota.`,
        },
        trigger: null,
      });
    } catch (e) {
      // Silent catch - Prevents app crash
    }
  }

  // Download a single track to Hub
  async downloadTrackToHub(
    song: { id: string; title: string; artist: string; artwork: string; downloadUrl: string; mood: any }
  ): Promise<boolean> {
    try {
      await this.initDirectory();
      const store = useOfflineHubStore.getState();
      const targetFile = `${HUB_DIR}${song.id}.m4a`;

      // Evict space if needed before downloading
      await this.ensureSpaceForNewTrack(10 * 1024 * 1024);

      const downloadRes = await FileSystem.downloadAsync(song.downloadUrl, targetFile);
      const fileInfo = await FileSystem.getInfoAsync(downloadRes.uri);

      const newTrack: HubTrack = {
        id: song.id,
        title: song.title,
        artist: song.artist,
        artwork: song.artwork,
        localUri: downloadRes.uri,
        fileSizeBytes: fileInfo.exists ? fileInfo.size : 8 * 1024 * 1024,
        mood: song.mood || "sad",
        addedAt: Date.now(),
        playCount: 0,
        isPinned: false,
      };

      store.addTrackToHub(newTrack);
      return true;
    } catch (error) {
      return false;
    }
  }

  // FIFO / LRU Auto-Eviction Loop
  async ensureSpaceForNewTrack(requiredBytes: number) {
    try {
      const store = useOfflineHubStore.getState();
      const maxBytes = store.maxQuotaMB * 1024 * 1024;
      let currentBytes = store.getTotalUsedBytes();

      if (currentBytes + requiredBytes <= maxBytes) return;

      const evictable = [...store.cachedTracks]
        .filter((t) => !t.isPinned)
        .sort((a, b) => a.playCount - b.playCount || a.addedAt - b.addedAt);

      let removedCount = 0;

      for (const track of evictable) {
        if (currentBytes + requiredBytes <= maxBytes) break;

        try {
          await FileSystem.deleteAsync(track.localUri, { idempotent: true });
          store.removeTrackFromHub(track.id);
          currentBytes -= track.fileSizeBytes;
          removedCount++;
        } catch (_) {}
      }

      if (removedCount > 0) {
        void this.notifyHubRefreshed(1, removedCount);
      }
    } catch (_) {}
  }

  // Manually Delete Track
  async removeTrack(id: string) {
    try {
      const store = useOfflineHubStore.getState();
      const track = store.cachedTracks.find((t) => t.id === id);
      if (track) {
        try {
          await FileSystem.deleteAsync(track.localUri, { idempotent: true });
        } catch (_) {}
        store.removeTrackFromHub(id);
      }
    } catch (_) {}
  }
}

export const offlineHubService = new OfflineHubService();
