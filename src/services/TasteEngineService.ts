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

    (async () => {
      try {
        const store = useOfflineHubStore.getState();
        const alreadyCached = (store.cachedTracks || []).some((t) => t?.id === track.id);

        if (!alreadyCached) {
          let downloadLink = "";

          // 1. Check if an HTTP URL is already passed
          if (track.downloadUrl?.startsWith("http")) {
            downloadLink = track.downloadUrl;
          }

          // 2. Fetch direct stream URLs via SDK if needed
          if (!downloadLink) {
            try {
              const { songs } = await Song.getById({ songIds: track.id });
              const encrypted = songs?.[0]?.media?.encryptedUrl;

              if (encrypted) {
                const urls = await Song.experimental.fetchStreamUrls(encrypted, "edge", true);
                if (Array.isArray(urls) && urls.length > 0) {
                  // Filter valid http urls and pick highest available quality
                  const validUrls = urls.filter((u) => u?.url && u.url.startsWith("http"));
                  downloadLink = validUrls[validUrls.length - 1]?.url || "";
                }
              }
            } catch (err) {
              console.warn("[TasteEngine] Failed to resolve stream URL for", track.id, err);
            }
          }

          // 3. Trigger download if valid link found
          if (downloadLink?.startsWith("http")) {
            console.log("[TasteEngine] Caching active track:", track.title);
            await OfflineHubService.downloadTrackToHub({
              id: track.id,
              title: track.title,
              artist: track.artist,
              artwork: track.artwork,
              downloadUrl: downloadLink,
              mood: store.activeMood || "sad",
            });
          } else {
            console.warn("[TasteEngine] No valid download URL for:", track.title, track.id);
          }
        }

        // 4. Always fetch relatable tracks
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

        let realDownloadUrl = "";
        const encrypted = item.media?.encryptedUrl;

        if (encrypted) {
          try {
            const urls = await Song.experimental.fetchStreamUrls(encrypted, "edge", true);
            if (Array.isArray(urls) && urls.length > 0) {
              const validUrls = urls.filter((u) => u?.url && u.url.startsWith("http"));
              realDownloadUrl = validUrls[validUrls.length - 1]?.url || "";
            }
          } catch (err) {
            console.warn("[TasteEngine] Relatable stream resolve error:", item.id, err);
          }
        }

        if (realDownloadUrl?.startsWith("http")) {
          console.log("[TasteEngine] Caching relatable track:", item.title);
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
    } catch (err) {
      console.warn("[TasteEngine] Relatable station fetch error:", err);
    }
  }
}
