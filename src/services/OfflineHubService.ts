import * as FileSystem from "expo-file-system";
import * as Notifications from "expo-notifications";
import { useOfflineHubStore, HubTrack } from "@/stores/offlineHubStore";

const HUB_DIR = `${FileSystem.documentDirectory}offline_hub/`;

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

class OfflineHubService {
  async initDirectory() {
    const dirInfo = await FileSystem.getInfoAsync(HUB_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(HUB_DIR, { intermediates: true });
    }
  }

  // 1. Send Local Notification to user
  async notifyHubRefreshed(addedCount: number, removedCount: number) {
    try {
      const permission = await Notifications.getPermissionsAsync();
      if (!permission.granted) {
        await Notifications.requestPermissionsAsync();
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "⚡ Daze Offline Hub Refreshed",
          body: `Added ${addedCount} fresh tracks matching your taste. Removed ${removedCount} older songs to maintain your quota.`,
          data: { screen: "offline-hub" },
        },
        trigger: null, // Send immediately
      });
    } catch (e) {
      // Silent catch if permissions denied
    }
  }

  // 2. Download a single track to Hub
  async downloadTrackToHub(
    song: { id: string; title: string; artist: string; artwork: string; downloadUrl: string; mood: any }
  ): Promise<boolean> {
    await this.initDirectory();
    const store = useOfflineHubStore.getState();
    const targetFile = `${HUB_DIR}${song.id}.m4a`;

    try {
      // Evict space if needed before downloading
      await this.ensureSpaceForNewTrack(10 * 1024 * 1024); // Estimate ~10MB

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
      console.error("[OfflineHub] Download error:", error);
      return false;
    }
  }

  // 3. FIFO / LRU Auto-Eviction Loop (500MB Limit Maintainer)
  async ensureSpaceForNewTrack(requiredBytes: number) {
    const store = useOfflineHubStore.getState();
    const maxBytes = store.maxQuotaMB * 1024 * 1024;
    let currentBytes = store.getTotalUsedBytes();

    if (currentBytes + requiredBytes <= maxBytes) return;

    // Sort unpinned tracks: lowest playCount first, then oldest addedAt
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
      } catch (err) {
        // Ignore file delete errors
      }
    }

    if (removedCount > 0) {
      void this.notifyHubRefreshed(1, removedCount);
    }
  }

  // 4. Manually Delete Track
  async removeTrack(id: string) {
    const store = useOfflineHubStore.getState();
    const track = store.cachedTracks.find((t) => t.id === id);
    if (track) {
      try {
        await FileSystem.deleteAsync(track.localUri, { idempotent: true });
      } catch (_) {}
      store.removeTrackFromHub(id);
    }
  }
}

export const offlineHubService = new OfflineHubService();
