import { Song, Models } from "@saavn-labs/sdk";

export class ReelAudioService {
  /**
   * 🔍 Extract clean song query from Instagram Reel / Post
   */
  static async resolveSongFromInstagram(rawInput: string): Promise<Models.Song | null> {
    try {
      if (!rawInput) return null;

      // Extract raw link from share text
      const urlMatch = rawInput.match(/https?:\/\/(?:www\.)?instagram\.com\/(?:reel|p|share\/reel)\/([a-zA-Z0-9_-]+)/);
      let queryTitle = "";

      if (urlMatch) {
        const cleanUrl = urlMatch[0].split("?")[0];

        try {
          // Method 1: Fetch HTML and parse OpenGraph Meta Title
          const response = await fetch(cleanUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          });

          if (response.ok) {
            const html = await response.text();

            // Extract og:title or description
            const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i);
            const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);

            const rawMeta = ogTitleMatch?.[1] || ogDescMatch?.[1] || "";
            if (rawMeta) {
              // Instagram format: "Username on Instagram: 'Song Title / Caption'"
              const parts = rawMeta.split(":");
              queryTitle = parts.length > 1 ? parts.slice(1).join(" ") : rawMeta;
            }
          }
        } catch (e) {
          console.warn("[ReelAudioService] Direct fetch warning:", e);
        }

        // Method 2: oEmbed Fallback
        if (!queryTitle) {
          try {
            const oembedRes = await fetch(
              `https://api.instagram.com/oembed/?url=${encodeURIComponent(cleanUrl)}`
            );
            if (oembedRes.ok) {
              const data = await oembedRes.json();
              if (data?.title) queryTitle = data.title;
            }
          } catch (e) {
            console.warn("[ReelAudioService] oEmbed fallback failed:", e);
          }
        }
      } else {
        // Plain text share without standard URL
        queryTitle = rawInput.replace(/https?:\/\/\S+/g, "").trim();
      }

      // Cleanup captions, hashtags, quotes
      const cleanedQuery = queryTitle
        .replace(/#\w+/g, "")
        .replace(/[\"\'\“\”\’]/g, " ")
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (!cleanedQuery || cleanedQuery.length < 2) {
        return null;
      }

      // 🎵 Search in JioSaavn
      const searchRes = await Song.search({
        query: cleanedQuery.slice(0, 35),
        page: 1,
        limit: 5,
      });

      if (searchRes?.songs && searchRes.songs.length > 0) {
        return searchRes.songs[0];
      }

      return null;
    } catch (err) {
      console.error("[ReelAudioService] Error resolving:", err);
      return null;
    }
  }
}
