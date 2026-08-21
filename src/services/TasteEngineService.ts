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

      // 1. Current Song ko Cache karne ka logic (Delay: 1 second)
      if (track.downloadUrl) {
        setTimeout(() => {
          try {
            const store = useOfflineHubStore.getState();
            const alreadyCached = (store.cachedTracks || []).some(
              (t) => t?.id === track.id
            );

            if (!alreadyCached) {
              void OfflineHubService.downloadTrackToHub({
                id: track.id,
                title: track.title,
                artist: track.artist,
                artwork: track.artwork,
                downloadUrl: track.downloadUrl,
                mood: store.activeMood || "sad",
              });
            }
          } catch (_) {}
        }, 1000);
      }

      // 2. SPOTIFY MAGIC: Relatable Gaane dhoondhna (Delay: 3 seconds taaki app hang na ho)
      setTimeout(() => {
        void this.fetchAndCacheRelatableTracks(track.id);
      }, 3000);

    } catch (_) {}
  }

  // 👇 Yeh function bilkul Spotify ke algorithm jaisa kaam karta hai
  private static async fetchAndCacheRelatableTracks(seedSongId: string) {
    try {
      // Saavn Station API automatically same vibe aur artists ke gaane fetch karta hai
      const { stationId } = await Extras.createEntityStation({ songIds: [seedSongId] });
      const { songs } = await Song.getByStationId({ stationId, count: 3 }); // Top 3 matching songs

      if (!songs || songs.length === 0) return;

      const store = useOfflineHubStore.getState();

      for (const item of songs) {
        const alreadyCached = (store.cachedTracks || []).some((t) => t.id === item.id);
        if (alreadyCached) continue;

        // Best quality audio link nikalna
        const downloadUrl =
          item.media?.mp4Url?.find((u: any) => u.quality === "320kbps")?.url ||
          item.media?.mp4Url?.[0]?.url ||
          item.media?.url;

        if (downloadUrl) {
          // Relatable gaane background me Hub me save ho jayenge
          await OfflineHubService.downloadTrackToHub({
            id: item.id,
            title: item.title,
            artist: item.artists?.primary?.[0]?.name || "Unknown",
            artwork: item.images?.[2]?.url || item.images?.[1]?.url || "",
            downloadUrl,
            mood: store.activeMood || "sad", // Jo current mood selected hai wahi tag lag jayega
          });
        }
      }
    } catch (error) {
      // Background me agar network slow ho toh silent fail (app crash nahi hogi)
    }
  }
}
