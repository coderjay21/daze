import { historyService } from "./HistoryService";
import { Extras, Song, Models } from "@saavn-labs/sdk";

export interface PersonalizedFeedSection {
  title: string;
  subtitle?: string;
  songs: Models.Song[];
}

const FALLBACK_IMAGE = "https://daze.jayagarwal.online/assets/logo.png";

export class HomeFeedService {
  /**
   * 🧹 Clean HTML Entities like &quot;, &#039;, &amp;
   */
  private static decodeHtml(text: string = ""): string {
    return text
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
  }

  static async getPersonalizedFeed(): Promise<PersonalizedFeedSection[]> {
    const sections: PersonalizedFeedSection[] = [];

    try {
      const history = await historyService.getHistory();

      if (!history || history.length === 0) {
        return this.getDefaultTrendingFeed();
      }

      // 1. "Jump Back In" (Recently Played)
      const recentSongs = history.slice(0, 8).map((h) => ({
        ...h.song,
        title: this.decodeHtml(h.song.title),
      }));

      if (recentSongs.length > 0) {
        sections.push({
          title: "Jump Back In",
          subtitle: "Based on your recent listening",
          songs: recentSongs as Models.Song[],
        });
      }

      // 2. Extract Top Artists
      const artistCounts: Record<string, { count: number; name: string }> = {};
      for (const entry of history) {
        const primaryArtist = entry.song.artists?.primary?.[0];
        if (primaryArtist?.name) {
          const name = primaryArtist.name;
          if (!artistCounts[name]) {
            artistCounts[name] = { count: 0, name };
          }
          artistCounts[name].count += 1;
        }
      }

      const topArtists = Object.values(artistCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 2);

      // 3. "More Like [Top Song]"
      const lastPlayedSong = history[0]?.song;
      if (lastPlayedSong?.id) {
        try {
          const { stationId } = await Extras.createEntityStation({
            songIds: [lastPlayedSong.id],
          });
          const { songs: recSongs } = await Song.getByStationId({ stationId, count: 10 });

          if (Array.isArray(recSongs)) {
            const filteredRecs = recSongs
              .filter((s) => s.id !== lastPlayedSong.id)
              .map((s) => ({
                ...s,
                title: this.decodeHtml(s.title),
              }));

            if (filteredRecs.length > 0) {
              const cleanTitle = this.decodeHtml(lastPlayedSong.title);
              sections.push({
                title: `More Like ${cleanTitle}`,
                subtitle: "Recommended for you",
                songs: filteredRecs as Models.Song[],
              });
            }
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
            const cleanArtistSongs = searchRes.songs.map((s) => ({
              ...s,
              title: this.decodeHtml(s.title),
            }));

            sections.push({
              title: `Best of ${topArtistName}`,
              subtitle: `Because you love ${topArtistName}`,
              songs: cleanArtistSongs as Models.Song[],
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
      const cleanSongs = (searchRes.songs || []).map((s) => ({
        ...s,
        title: this.decodeHtml(s.title),
      }));

      return [
        {
          title: "Trending Now",
          subtitle: "Top charts today",
          songs: cleanSongs as Models.Song[],
        },
      ];
    } catch {
      return [];
    }
  }
}
