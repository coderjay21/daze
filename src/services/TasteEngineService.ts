import { appStorage } from "@/stores/storage";
import { useOfflineHubStore } from "@/stores/offlineHubStore";
import { OfflineHubService } from "@/services/OfflineHubService";
import { Extras, Song } from "@saavn-labs/sdk";

const TASTE_MATRIX_KEY = "daze_dynamic_taste_matrix";

export class TasteEngineService {
  static async onSongPlayed(track: {
    id: string;
    title: string;
    artist: string;
    artwork: string;
    downloadUrl?: string;
  }) {
    if (!track?.id) return;

    try {
      // 1. Record interaction asynchronously
      setTimeout(async () => {
        try {
          const raw = await appStorage.getItem(TASTE_MATRIX_KEY);
          const matrix = raw ? JSON.parse(raw) : { artistWeights: {}, recentTrackIds: [] };

          if (track.artist) {
            matrix.artistWeights[track.artist] = (matrix.artistWeights[track.artist] || 0) + 3;
          }

          matrix.recentTrackIds = [track.id, ...(matrix.recentTrackIds || []).filter((id: string) => id !== track.id)].slice(0, 20);
          await appStorage.setItem(TASTE_MATRIX_KEY, JSON.stringify(matrix));
        } catch (_) {}
      }, 0);

      // 2. Cache current track if online url available
      if (track.downloadUrl && !track.downloadUrl.startsWith("file://") && !track.downloadUrl.startsWith("nitro-download://")) {
        const store = useOfflineHubStore.getState();
        const already = (store.cachedTracks || []).some((t) => t.id === track.id);
        if (!already) {
          void OfflineHubService.downloadTrackToHub({
            id: track.id,
            title: track.title,
            artist: track.artist,
            artwork: track.artwork,
            downloadUrl: track.downloadUrl,
            mood: store.activeMood || "sad",
          });
        }
      }

      // 3. Prefetch related recommendations safely
      setTimeout(() => {
        void this.prefetchRelated(track.id);
      }, 2000);
    } catch (_) {}
  }

  private static async prefetchRelated(seedSongId: string) {
    try {
      const { stationId } = await Extras.createEntityStation({ songIds: [seedSongId] });
      const { songs } = await Song.getByStationId({ stationId, count: 4 });
      if (!songs || songs.length === 0) return;

      const store = useOfflineHubStore.getState();

      for (const item of songs.slice(0, 2)) {
        const already = (store.cachedTracks || []).some((t) => t.id === item.id);
        if (already) continue;

        const downloadUrl =
          item.media?.mp4Url?.find((u: any) => u.quality === "320kbps")?.url ||
          item.media?.mp4Url?.[0]?.url ||
          item.media?.url;

        if (downloadUrl) {
          await OfflineHubService.downloadTrackToHub({
            id: item.id,
            title: item.title,
            artist: item.artists?.primary?.[0]?.name || "Unknown",
            artwork: item.images?.[2]?.url || item.images?.[1]?.url || "",
            downloadUrl,
            mood: store.activeMood || "sad",
          });
        }
      }
    } catch (_) {}
  }
}
