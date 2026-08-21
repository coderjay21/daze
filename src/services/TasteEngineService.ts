import { OfflineHubService } from "./OfflineHubService";
import { useOfflineHubStore } from "@/stores/offlineHubStore";
import { Extras, Song } from "@saavn-labs/sdk";

export class TasteEngineService {
  static onSongPlayed(track: {
    id: string;
    title: string;
    artist: string;
    artwork: string;
    downloadUrl?: string;
  }) {
    try {
      if (!track?.id) return;

      // Background pipeline
      setTimeout(async () => {
        try {
          const store = useOfflineHubStore.getState();
          const alreadyCached = (store.cachedTracks || []).some(
            (t) => t?.id === track.id
          );

          // 1. Current Song ko Sahi (Real) URL se download karna
          if (!alreadyCached) {
            // Player wale stream URL ki jagah direct MP4 URL nikalna
            const { songs } = await Song.getById({ songIds: track.id });
            const songData = songs?.[0];
            
            if (songData) {
              const realDownloadUrl =
                songData.media?.mp4Url?.find((u: any) => u.quality === "320kbps")?.url ||
                songData.media?.mp4Url?.[0]?.url ||
                songData.media?.url;

              if (realDownloadUrl) {
                await OfflineHubService.downloadTrackToHub({
                  id: track.id,
                  title: track.title,
                  artist: track.artist,
                  artwork: track.artwork,
                  downloadUrl: realDownloadUrl,
                  mood: store.activeMood || "sad",
                });
              }
            }
          }

          // 2. Relatable Gaane dhoondhna
          await TasteEngineService.fetchAndCacheRelatableTracks(track.id);
        } catch (error) {
          console.error("TasteEngine background process failed:", error);
        }
      }, 1000);
    } catch (_) {}
  }

  private static async fetchAndCacheRelatableTracks(seedSongId: string) {
    try {
      const { stationId } = await Extras.createEntityStation({ songIds: [seedSongId] });
      const { songs } = await Song.getByStationId({ stationId, count: 3 });

      if (!songs || songs.length === 0) return;

      const store = useOfflineHubStore.getState();

      for (const item of songs) {
        const alreadyCached = (store.cachedTracks || []).some((t) => t.id === item.id);
        if (alreadyCached) continue;

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
