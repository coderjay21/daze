export interface SongVisualTheme {
  category: "devotional" | "romantic" | "sad" | "latenight" | "general";
  artworkUrl: string;
  defaultQuotes: string[];
}

export const getSmartSongTheme = (title: string = "", artist: string = ""): SongVisualTheme => {
  const query = `${title} ${artist}`.toLowerCase();

  // 🔱 1. Devotional / Bhakti / Spiritual
  if (
    query.match(/(shiv|mahadev|bhole|krishna|radha|ram|hanuman|bhajan|aarti|kirtan|shree|hare|govind)/i)
  ) {
    return {
      category: "devotional",
      artworkUrl: "https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=1000&auto=format&fit=crop", // Minimalist divine aura art
      defaultQuotes: [
        "Jahan prem aur shanti hai, wahan Ishwar ka vaas hai.",
        "Har har Mahadev • Sukoon aur Bhakti 🔱",
      ],
    };
  }

  // 💔 2. Sad / Heartbreak / Emotional
  if (
    query.match(/(judaai|tanhaai|bewafa|broken|pain|alone|sad|chhod|dhokha|khoya)/i)
  ) {
    return {
      category: "sad",
      artworkUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1000&auto=format&fit=crop", // Rain / Moody Rooftop
      defaultQuotes: [
        "Kuch baatein unkahi hi reh gayi...",
        "Living in memories at 3 AM 🥀",
      ],
    };
  }

  // 🌙 3. Late Night / Lofi / Sleep
  if (
    query.match(/(lofi|night|drive|sleep|chill|3am|moon|daze|slowed)/i)
  ) {
    return {
      category: "latenight",
      artworkUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1000&auto=format&fit=crop", // Anime bedroom starry night
      defaultQuotes: [
        "Late night drives and unsaid thoughts...",
        "Lost in the frequency of sound 🌌",
      ],
    };
  }

  // 🌸 4. Romantic / Soft Soul (Default for MS Dhoni, Arijit, Jubin, etc.)
  return {
    category: "romantic",
    artworkUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop", // Pastel anime lovers / Sunset
    defaultQuotes: [
      "Tu aata hai seene mein jab jab saansein bharti hoon...",
      "Tere bina jeena saza ho gaya ✦",
    ],
  };
};
