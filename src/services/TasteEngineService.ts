import { OfflineHubService } from "./OfflineHubService";
import { useOfflineHubStore } from "@/stores/offlineHubStore";
import { Extras, Song } from "@saavn-labs/sdk";

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
      const store = useOfflineHubStore.getState();
      const alreadyCached = (store.cachedTracks || []).some((t) => t?.id === track.id);

      // 1. Download Current Playing Song
      if (!alreadyCached) {
        let finalUrl = track.downloadUrl;
        
        // Agar normal stream URL nahi mili, toh fetch karo
        if (!finalUrl || finalUrl.startsWith("nitro") || finalUrl.startsWith("file")) {
          const { songs } = await Song.getById({ songIds: track.id });
          const encrypted = songs?.[0]?.media?.encryptedUrl;
          if (encrypted) {
            const urls = await Song.experimental.fetchStreamUrls(encrypted, "edge", true);
            finalUrl = urls[4]?.url || urls[3]?.url || urls[2]?.url || urls[0]?.url;
          }
        }

        if (finalUrl && finalUrl.startsWith("http")) {
          await OfflineHubService.downloadTrackToHub({
            id: track.id,
            title: track.title,
            artist: track.artist,
            artwork: track.artwork,
            downloadUrl: finalUrl,
            mood: store.activeMood || "sad",
          });
        }
      }

      // 2. Spotify-like Relatable Songs (Delayed slightly so it doesn't slow down the app)
      setTimeout(() => {
        TasteEngineService.fetchAndCacheRelatableTracks(track.id).catch(() => {});
      }, 2000);

    } catch (error) {
      console.error("[TasteEngine] Init Failed:", error);
    }
  }

  private static async fetchAndCacheRelatableTracks(seedSongId: string) {
    try {
      const { stationId } = await Extras.createEntityStation({ songIds: [seedSongId] });
      const { songs } = await Song.getByStationId({ stationId, count: 2 }); // Reduced to 2 for speed

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
