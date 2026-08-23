import { Song, Models } from "@saavn-labs/sdk";

export class ReelAudioService {
  /**
   * 🔍 Extract clean query from Instagram share text or URL
   */
  static parseSharedText(rawText: string): { type: "instagram" | "text"; query: string } {
    if (!rawText) return { type: "text", query: "" };

    // Regex to match Instagram Reel / Post URLs
    const igMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:reel|p|share\/reel)\/([a-zA-Z0-9_-]+)/);

    if (igMatch) {
      return {
        type: "instagram",
        query: igMatch[0],
      };
    }

    // Clean plain text fallback
    const cleanedText = rawText.replace(/https?:\/\/\S+/g, "").trim();
    return {
      type: "text",
      query: cleanedText,
    };
  }

  /**
   * ⚡ Identify Song from Instagram Reel URL or Keywords
   */
  static async resolveSongFromInstagram(urlOrText: string): Promise<Models.Song | null> {
    try {
      const { type, query } = this.parseSharedText(urlOrText);

      let searchQuery = query;

      if (type === "instagram") {
        // Fetch Instagram oEmbed/Graph metadata to get caption/audio keywords
        try {
          const res = await fetch(`https://api.instagram.com/oembed/?url=${encodeURIComponent(query)}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.title) {
              searchQuery = data.title;
            }
          }
        } catch (e) {
          console.warn("[ReelAudioService] oEmbed fallback triggered:", e);
        }
      }

      if (!searchQuery) return null;

      // 🎯 Clean caption tokens (remove hashtags, emojis, extra words)
      const cleanSearchTerm = searchQuery
        .replace(/#\w+/g, "")
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 40);

      // Perform deep search on Saavn catalog
      const searchRes = await Song.search({
        query: cleanSearchTerm,
        page: 1,
        limit: 5,
      });

      if (searchRes?.songs && searchRes.songs.length > 0) {
        return searchRes.songs[0];
      }

      return null;
    } catch (err) {
      console.error("[ReelAudioService] Resolve failed:", err);
      return null;
    }
  }
}
