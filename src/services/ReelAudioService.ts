import { Song, Models } from "@saavn-labs/sdk";

export class ReelAudioService {
  /**
   * 🔍 Extract Song Title from Instagram URL using HTML Meta tags
   */
  static async resolveSongFromInstagram(rawInput: string): Promise<Models.Song | null> {
    try {
      if (!rawInput) return null;

      // Extract raw link from share text
      const urlMatch = rawInput.match(/https?:\/\/(?:www\.)?instagram\.com\/(?:reel|p)\/([a-zA-Z0-9_-]+)/);
      let queryTitle = "";

      if (urlMatch) {
        const reelUrl = urlMatch[0];
        try {
          // Fetch open graph data from public endpoint
          const res = await fetch(`https://api.instagram.com/oembed/?url=${encodeURIComponent(reelUrl)}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.title) {
              queryTitle = data.title;
            }
          }
        } catch (e) {
          console.warn("[ReelAudioService] oEmbed fetch failed:", e);
        }
      } else {
        // Direct text without URL
        queryTitle = rawInput.replace(/https?:\/\/\S+/g, "").trim();
      }

      if (!queryTitle || queryTitle.length < 2) {
        return null;
      }

      // Clean hashtags and emojis from caption
      const sanitized = queryTitle
        .replace(/#\w+/g, "")
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (!sanitized) return null;

      const searchRes = await Song.search({
        query: sanitized.slice(0, 40),
        page: 1,
        limit: 5,
      });

      if (searchRes?.songs && searchRes.songs.length > 0) {
        return searchRes.songs[0];
      }

      return null;
    } catch (err) {
      console.error("[ReelAudioService] Resolve error:", err);
      return null;
    }
  }
}
