import { OfflineHubService } from "./OfflineHubService";
import { useOfflineHubStore } from "@/stores/offlineHubStore";
import { Extras, Song, Models } from "@saavn-labs/sdk";

export type InferredMood = "sad" | "romantic" | "chill";

export class TasteEngineService {
  /**
   * 🧠 1. Real-time AI Mood & Vibe Detector
   * Analyzes song keywords, artist styles, and time of day
   */
  static detectMood(title: string = "", artist: string = ""): InferredMood {
    const text = `${title} ${artist}`.toLowerCase();
    const currentHour = new Date().getHours();

    // Keywords Dictionaries
    const romanticKeywords = [
      "pyaar", "ishq", "mohabbat", "dil", "humsafar", "romantic", "love", "saware",
      "deewana", "sanam", "jaan", "tum", "terey", "shreya", "arijit", "armaan", "darshan"
    ];
    const sadKeywords = [
      "dard", "bewafa", "judaai", "dhoka", "rona", "khali", "adhuri", "tanha", "yaad",
      "rula", "tuta", "chale aana", "faasle", "alvida", "sad", "broken", "tears"
    ];
    const chillKeywords = [
      "lofi", "acoustic", "sunset", "peace", "chill", "coffee", "breeze", "raaste",
      "safar", "musafir", "baarish", "sukoon", "prateek", "jasleen", "anuv"
    ];

    // Score based matching
    const isRomantic = romanticKeywords.some((k) => text.includes(k));
    const isSad = sadKeywords.some((k) => text.includes(k));
    const isChill = chillKeywords.some((k) => text.includes(k));

    if (isSad) return "sad";
    if (isRomantic) return "romantic";
    if (isChill) return "chill";

    // 🕒 Time-of-Day Fallback if keywords don't trigger
    if (currentHour >= 23 || currentHour < 5) {
      return "sad"; // Late night heart-touching / melancholic vibe
    } else if (currentHour >= 5 && currentHour < 12) {
      return "chill"; // Peaceful morning vibe
    } else if (currentHour >= 18 && currentHour < 23) {
      return "romantic"; // Evening vibe
    }

    return "chill";
  }

  /**
   * ⚡ 2. Main Trigger when song is played
   */
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
        const detectedMood = TasteEngineService.detectMood(track.title, track.artist);
        const alreadyCached = (store.cachedTracks || []).some((t) => t?.id === track.id);

        if (!alreadyCached) {
          let downloadLink = "";

          // 1. Direct HTTP link check
          if (track.downloadUrl?.startsWith("http")) {
            downloadLink = track.downloadUrl;
          }

          // 2. High-res stream URL resolver
          if (!downloadLink) {
            try {
              const { songs } = await Song.getById({ songIds: track.id });
              const encrypted = songs?.[0]?.media?.encryptedUrl;

              if (encrypted) {
                const urls = await Song.experimental.fetchStreamUrls(encrypted, "edge", true);
                if (Array.isArray(urls) && urls.length > 0) {
                  const validUrls = urls.filter((u) => u?.url && u.url.startsWith("http"));
                  downloadLink = validUrls[validUrls.length - 1]?.url || "";
                }
              }
            } catch (err) {
              console.warn("[TasteEngine] Stream resolve error for:", track.title, err);
            }
          }

          // 3. Cache current track with detected mood
          if (downloadLink?.startsWith("http")) {
            console.log(`[TasteEngine] Caching: "${track.title}" -> Mood: [${detectedMood}]`);
            await OfflineHubService.downloadTrackToHub({
              id: track.id,
              title: track.title,
              artist: track.artist,
              artwork: track.artwork,
              downloadUrl: downloadLink,
              mood: detectedMood,
            });
          }
        }

        // 4. Autonomous Relatable Engine (Predict next 3 tracks)
        void TasteEngineService.fetchAndCacheRelatableTracks(track.id, detectedMood);
      } catch (e) {
        console.error("[TasteEngine] Pipeline execution error:", e);
      }
    })();
  }

  /**
   * 🔮 3. Deep-Station Relatable Pre-Caching
   */
  private static async fetchAndCacheRelatableTracks(seedSongId: string, currentMood: InferredMood) {
    try {
      const { stationId } = await Extras.createEntityStation({ songIds: [seedSongId] });
      // Fetch 4 relatable tracks
      const { songs } = await Song.getByStationId({ stationId, count: 4 });

      if (!songs || songs.length === 0) return;

      const store = useOfflineHubStore.getState();

      for (const item of songs) {
        if (item.id === seedSongId) continue;
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
            console.warn("[TasteEngine] Relatable stream error:", item.id, err);
          }
        }

        if (realDownloadUrl?.startsWith("http")) {
          const itemArtist = item.artists?.primary?.[0]?.name || "Unknown";
          // Detect mood per relatable track individually
          const itemMood = TasteEngineService.detectMood(item.title, itemArtist);

          console.log(`[TasteEngine] Auto-vaulting relatable: "${item.title}" [${itemMood}]`);
          await OfflineHubService.downloadTrackToHub({
            id: item.id,
            title: item.title || "Unknown",
            artist: itemArtist,
            artwork: item.images?.[2]?.url || item.images?.[1]?.url || "",
            downloadUrl: realDownloadUrl,
            mood: itemMood || currentMood,
          });
        }
      }
    } catch (err) {
      console.warn("[TasteEngine] Relatable radio fetch warning:", err);
    }
  }
}
