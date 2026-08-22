import { historyService } from "./HistoryService";
import { Extras, Song, Models } from "@saavn-labs/sdk";

export interface PersonalizedFeedSection {
  title: string;
  subtitle?: string;
  songs: Models.Song[];
}

export class HomeFeedService {
  static async getPersonalizedFeed(): Promise<PersonalizedFeedSection[]> {
    const sections: PersonalizedFeedSection[] = [];

    try {
      const history = await historyService.getHistory();

      if (!history || history.length === 0) {
        // Fallback to generic curated / trending for new users
        return this.getDefaultTrendingFeed();
      }

      // 1. "Jump Back In" (Recently Played)
      const recentSongs = history.slice(0, 8).map((h) => h.song);
      if (recentSongs.length > 0) {
        sections.push({
          title: "Jump Back In",
          subtitle: "Based on your recent listening",
          songs: recentSongs,
        });
      }

      // 2. Extract Top Artists
      const artistCounts: Record<string, { count: number; artistId?: string; name: string }> = {};
      for (const entry of history) {
        const primaryArtist = entry.song.artists?.primary?.[0];
        if (primaryArtist?.name) {
          const name = primaryArtist.name;
          if (!artistCounts[name]) {
            artistCounts[name] = { count: 0, artistId: primaryArtist.id, name };
          }
          artistCounts[name].count += 1;
        }
      }

      const topArtists = Object.values(artistCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 2);

      // 3. "More Like [Top Song]" (Station based recommendation)
      const lastPlayedSong = history[0]?.song;
      if (lastPlayedSong?.id) {
        try {
          const { stationId } = await Extras.createEntityStation({
            songIds: [lastPlayedSong.id],
          });
          const { songs: recSongs } = await Song.getByStationId({ stationId, count: 10 });
          
          const filteredRecs = recSongs.filter((s) => s.id !== lastPlayedSong.id);
          if (filteredRecs.length > 0) {
            sections.push({
              title: `More Like ${lastPlayedSong.title}`,
              subtitle: "Recommended for you",
              songs: filteredRecs,
            });
          }
        } catch (e) {
          console.warn("[HomeFeedService] Station rec error:", e);
        }
      }

      // 4. "Focus on [Top Artist]"
      if (topArtists.length > 0 && topArtists[0]) {
        const topArtistName = topArtists[0].name;
        try {
          const searchRes = await Song.search({ query: topArtistName, page: 1, limit: 10 });
          if (searchRes.songs && searchRes.songs.length > 0) {
            sections.push({
              title: `Best of ${topArtistName}`,
              subtitle: `Because you love ${topArtistName}`,
              songs: searchRes.songs,
            });
          }
        } catch (e) {
          console.warn("[HomeFeedService] Artist search error:", e);
        }
      }

      return sections.length > 0 ? sections : this.getDefaultTrendingFeed();
    } catch (error) {
      console.error("[HomeFeedService] Error generating feed:", error);
      return this.getDefaultTrendingFeed();
    }
  }

  private static async getDefaultTrendingFeed(): Promise<PersonalizedFeedSection[]> {
    try {
      const searchRes = await Song.search({ query: "Trending Hindi", page: 1, limit: 12 });
      return [
        {
          title: "Trending Now",
          subtitle: "Top charts today",
          songs: searchRes.songs || [],
        },
      ];
    } catch {
      return [];
    }
  }
}
