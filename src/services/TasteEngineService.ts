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

      setTimeout(async () => {
        try {
          const store = useOfflineHubStore.getState();
          const alreadyCached = (store.cachedTracks || []).some(
            (t) => t?.id === track.id
          );

          // 1. Asli MP4 Audio fetch karna (Bypass .m3u8 stream)
          if (!alreadyCached) {
            const { songs } = await Song.getById({ songIds: track.id });
            const songData = songs?.[0];
            
            if (songData) {
              const encrypted = songData.media?.encryptedUrl;
              if (encrypted) {
                // Decrypting the real download URLs
                const urls = await Song.experimental.fetchStreamUrls(encrypted, "edge", true);
                
                // Best available direct MP4/M4A quality pick karna (Index 3 or 4)
                const realDownloadUrl = urls[4]?.url || urls[3]?.url || urls[2]?.url || urls[0]?.url;

                if (realDownloadUrl && realDownloadUrl.startsWith("http")) {
                  await OfflineHubService.downloadTrackToHub({
                    id: track.id,
                    title: track.title,
                    artist: track.artist,
                    artwork: track.artwork,
                    downloadUrl: realDownloadUrl, // Now it's a valid file URL
                    mood: store.activeMood || "sad",
                  });
                }
              }
            }
          }

          // 2. Relatable (Spotify-like) Gaane fetch karna
          await TasteEngineService.fetchAndCacheRelatableTracks(track.id);
        } catch (error) {
          console.error("TasteEngine Error:", error);
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
