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
    if (!track?.id) return;

    // Immediately execute download asynchronously
    (async () => {
      try {
        const store = useOfflineHubStore.getState();
        const alreadyCached = (store.cachedTracks || []).some((t) => t?.id === track.id);

        if (!alreadyCached) {
          let downloadLink = "";
          
          try {
            const { songs } = await Song.getById({ songIds: track.id });
            const encrypted = songs?.[0]?.media?.encryptedUrl;
            if (encrypted) {
              const urls = await Song.experimental.fetchStreamUrls(encrypted, "edge", true);
              downloadLink = urls[4]?.url || urls[3]?.url || urls[2]?.url || urls[0]?.url || "";
            }
          } catch (_) {}

          if (!downloadLink && track.downloadUrl && track.downloadUrl.startsWith("http")) {
            downloadLink = track.downloadUrl;
          }

          if (downloadLink && downloadLink.startsWith("http")) {
            await OfflineHubService.downloadTrackToHub({
              id: track.id,
              title: track.title,
              artist: track.artist,
              artwork: track.artwork,
              downloadUrl: downloadLink,
              mood: store.activeMood || "sad",
            });
          }
        }

        // Relatable tracks in background
        void TasteEngineService.fetchAndCacheRelatableTracks(track.id);
      } catch (e) {
        console.error("[TasteEngine] Execution error:", e);
      }
    })();
  }

  private static async fetchAndCacheRelatableTracks(seedSongId: string) {
    try {
      const { stationId } = await Extras.createEntityStation({ songIds: [seedSongId] });
      const { songs } = await Song.getByStationId({ stationId, count: 2 });
      if (!songs || songs.length === 0) return;

      const store = useOfflineHubStore.getState();

      for (const item of songs) {
        const alreadyCached = (store.cachedTracks || []).some((t) => t.id === item.id);
        if (alreadyCached) continue;

        const encrypted = item.media?.encryptedUrl;
        if (encrypted) {
          const urls = await Song.experimental.fetchStreamUrls(encrypted, "edge", true);
          const realDownloadUrl = urls[4]?.url || urls[3]?.url || urls[2]?.url || urls[0]?.url;

          if (realDownloadUrl && realDownloadUrl.startsWith("http")) {
            await OfflineHubService.downloadTrackToHub({
              id: item.id,
              title: item.title || "Unknown",
              artist: item.artists?.primary?.[0]?.name || "Unknown",
              artwork: item.images?.[2]?.url || item.images?.[1]?.url || "",
              downloadUrl: realDownloadUrl,
              mood: store.activeMood || "sad",
            });
          }
        }
      }
    } catch (_) {}
  }
}
