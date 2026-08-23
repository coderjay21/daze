import { Song, Models } from "@saavn-labs/sdk";

export class ReelAudioService {
  /**
   * 🔍 Extract clean query from Instagram URL or shared string
   */
  static extractCleanKeywords(input: string): string {
    if (!input) return "";

    // Remove tracking query strings (?igsh=..., etc.)
    const cleanUrl = input.split("?")[0].trim();

    // Extract Reel ID / Slug
    const match = cleanUrl.match(/(?:reel|p)\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return match[1];
    }

    return input.replace(/https?:\/\/\S+/g, "").trim();
  }

  /**
   * ⚡ Identify and find song from Saavn catalog
   */
  static async resolveSongFromInstagram(sharedText: string): Promise<Models.Song | null> {
    try {
      // 1. Check if Instagram oEmbed provides Title
      const cleanUrlMatch = sharedText.match(/https?:\/\/(?:www\.)?instagram\.com\/(?:reel|p)\/[a-zA-Z0-9_-]+/);
      let searchTerm = "";

      if (cleanUrlMatch) {
        try {
          const res = await fetch(`https://api.instagram.com/oembed/?url=${encodeURIComponent(cleanUrlMatch[0])}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.title) {
              searchTerm = data.title;
            }
          }
        } catch (e) {
          console.warn("[ReelAudioService] oEmbed fallback:", e);
        }
      }

      if (!searchTerm) {
        searchTerm = this.extractCleanKeywords(sharedText);
      }

      // Sanitize search query
      const sanitized = searchTerm
        .replace(/#\w+/g, "")
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();

      const finalQuery = sanitized.length > 2 ? sanitized : "Trending Hindi";

      const searchRes = await Song.search({
        query: finalQuery.slice(0, 35),
        page: 1,
        limit: 5,
      });

      if (searchRes?.songs && searchRes.songs.length > 0) {
        return searchRes.songs[0];
      }

      return null;
    } catch (err) {
      console.error("[ReelAudioService] Search error:", err);
      return null;
    }
  }
}
