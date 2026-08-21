import { offlineHubService } from "@/services/OfflineHubService";
import { useOfflineHubStore } from "@/stores/offlineHubStore";
import { appStorage } from "@/stores/storage";
import { Extras, Song } from "@saavn-labs/sdk";

interface TasteNode {
  artistWeights: Record<string, number>; // e.g. { "Arijit Singh": 14, "Pritam": 8 }
  languageWeights: Record<string, number>; // e.g. { "hindi": 20, "punjabi": 5 }
  recentTrackIds: string[];
}

const TASTE_MATRIX_KEY = "daze_dynamic_taste_matrix";

class DynamicTasteEngineService {
  private tasteMatrix: TasteNode = {
    artistWeights: {},
    languageWeights: {},
    recentTrackIds: [],
  };

  constructor() {
    void this.loadMatrix();
  }

  private async loadMatrix() {
    try {
      const stored = await appStorage.getItem(TASTE_MATRIX_KEY);
      if (stored) {
        this.tasteMatrix = JSON.parse(stored);
      }
    } catch (_) {}
  }

  private async saveMatrix() {
    try {
      await appStorage.setItem(TASTE_MATRIX_KEY, JSON.stringify(this.tasteMatrix));
    } catch (_) {}
  }

  // 1. Dynamic Weight Adjustment based on real interaction
  async recordInteraction(
    song: {
      id: string;
      title: string;
      artists?: { primary?: { name: string }[] };
      language?: string;
    },
    weight: number // +3 for full play, +5 for repeat/like, -2 for skip
  ) {
    if (!song) return;

    // Update Artist Affinity
    song.artists?.primary?.forEach((artist) => {
      const name = artist.name.trim();
      this.tasteMatrix.artistWeights[name] = (this.tasteMatrix.artistWeights[name] || 0) + weight;
      if (this.tasteMatrix.artistWeights[name] < 0) this.tasteMatrix.artistWeights[name] = 0;
    });

    // Update Language Affinity
    if (song.language) {
      const lang = song.language.toLowerCase();
      this.tasteMatrix.languageWeights[lang] = (this.tasteMatrix.languageWeights[lang] || 0) + weight;
    }

    // Keep sliding window of last 20 tracks
    this.tasteMatrix.recentTrackIds = [
      song.id,
      ...this.tasteMatrix.recentTrackIds.filter((id) => id !== song.id),
    ].slice(0, 20);

    await this.saveMatrix();
  }

  // 2. Active Play Handler (Triggered from PlayerService)
  async onSongPlayed(track: {
    id: string;
    title: string;
    artist: string;
    artwork: string;
    downloadUrl?: string;
  }) {
    if (!track.id) return;

    // Positive reinforcement for playing
    await this.recordInteraction(
      {
        id: track.id,
        title: track.title,
        artists: { primary: [{ name: track.artist }] },
      },
      3
    );

    // Fetch dynamic recommendations using Saavn Station Algorithm
    void this.prefetchDynamicVaultTracks(track.id);
  }

  // 3. Dynamic Multi-Seed Prefetcher (No hardcoding)
  private async prefetchDynamicVaultTracks(seedSongId: string) {
    try {
      // Create algorithmic radio station from active track
      const { stationId } = await Extras.createEntityStation({ songIds: [seedSongId] });
      const { songs } = await Song.getByStationId({ stationId, count: 5 });

      if (!songs || songs.length === 0) return;

      const store = useOfflineHubStore.getState();

      for (const item of songs.slice(0, 2)) {
        const isAlreadyInHub = store.cachedTracks.some((t) => t.id === item.id);
        if (isAlreadyInHub) continue;

        const downloadUrl =
          item.media?.mp4Url?.find((u: any) => u.quality === "320kbps")?.url ||
          item.media?.mp4Url?.[0]?.url ||
          item.media?.url;

        const artwork = item.images?.[2]?.url || item.images?.[1]?.url || "";
        const primaryArtist = item.artists?.primary?.[0]?.name || "Unknown";

        if (downloadUrl) {
          await offlineHubService.downloadTrackToHub({
            id: item.id,
            title: item.title,
            artist: primaryArtist,
            artwork,
            downloadUrl,
            mood: "chill", // Default tag; categorized dynamically by artist clustering
          });
        }
      }
    } catch (err) {
      // Silent catch background network drops
    }
  }

  // Get Top User Affinity Artists for UI Insights
  getTopAffinityArtists(limit = 5): string[] {
    return Object.entries(this.tasteMatrix.artistWeights)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([artist]) => artist);
  }
}

export const tasteEngineService = new DynamicTasteEngineService();
