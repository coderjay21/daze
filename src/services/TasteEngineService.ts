import { offlineHubService } from "@/services/OfflineHubService";
import { useOfflineHubStore } from "@/stores/offlineHubStore";

type MoodType = "sad" | "romantic" | "chill" | "upbeat";

const SAD_KEYWORDS = [
  "sad", "dard", "judaai", "alone", "broken", "channa", "bewafa", "alvida", 
  "tujhe kitna", "judai", "heartbreak", "phir le aya", "kabira", "khairiyat",
  "hamari adhuri", "mana dil", "tu jaane na", "roye", "ae dil"
];

const ROMANTIC_KEYWORDS = [
  "love", "ishq", "pyaar", "mohabbat", "raabta", "tum hi ho", "kesariya", 
  "apna bana le", "dil diyan", "subhanallah", "humsafar", "romantic", 
  "tere vaaste", "sun saathiya", "mast magan", "pehle bhi main"
];

const CHILL_KEYWORDS = [
  "lofi", "chill", "acoustic", "slowed", "reverb", "sukoon", "chai", 
  "kahani suno", "night", "breeze", "peace", "waqt"
];

class TasteEngineService {
  // 1. Detect track mood based on title & artist name
  detectMood(title: string, artist: string): MoodType {
    const text = `${title} ${artist}`.toLowerCase();

    if (SAD_KEYWORDS.some((kw) => text.includes(kw))) return "sad";
    if (ROMANTIC_KEYWORDS.some((kw) => text.includes(kw))) return "romantic";
    if (CHILL_KEYWORDS.some((kw) => text.includes(kw))) return "chill";
    
    return "upbeat";
  }

  // 2. Process listening event & trigger background Hub caching
  async onSongPlayed(track: {
    id: string;
    title: string;
    artist: string;
    artwork: string;
    downloadUrl?: string;
  }) {
    if (!track.downloadUrl) return;

    const mood = this.detectMood(track.title, track.artist);
    const store = useOfflineHubStore.getState();

    // Update active mood state
    store.setActiveMood(mood);

    // Auto-cache current played track into Hub if not already present
    const isAlreadyCached = store.cachedTracks.some((t) => t.id === track.id);
    if (!isAlreadyCached) {
      void offlineHubService.downloadTrackToHub({
        id: track.id,
        title: track.title,
        artist: track.artist,
        artwork: track.artwork,
        downloadUrl: track.downloadUrl,
        mood,
      });
    }

    // Proactively fetch & pre-cache 2 similar recommendations
    void this.prefetchSimilarMoodTracks(track.id, mood);
  }

  // 3. Background Prefetcher for related mood tracks
  private async prefetchSimilarMoodTracks(songId: string, mood: MoodType) {
    try {
      const res = await fetch(
        `https://daze.jayagarwal.online/saavn/api/songs/${songId}/suggestions?limit=3`
      );
      if (!res.ok) return;

      const data = await res.json();
      const suggestions = data?.data || data?.results || [];

      for (const item of suggestions.slice(0, 2)) {
        const store = useOfflineHubStore.getState();
        const alreadyInHub = store.cachedTracks.some((t) => t.id === item.id);
        
        // Best quality download URL extraction
        const downloadUrl =
          item.downloadUrl?.find((u: any) => u.quality === "320kbps")?.link ||
          item.downloadUrl?.[0]?.link ||
          item.url;

        if (!alreadyInHub && downloadUrl) {
          const artwork =
            item.image?.find((img: any) => img.quality === "500x500")?.link ||
            item.image?.[0]?.link ||
            "";

          await offlineHubService.downloadTrackToHub({
            id: item.id,
            title: item.name || item.title,
            artist: item.primaryArtists || item.artist || "Unknown",
            artwork,
            downloadUrl,
            mood,
          });
        }
      }
    } catch (err) {
      // Silent catch background prefetch errors
    }
  }
}

export const tasteEngineService = new TasteEngineService();
