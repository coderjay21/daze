import { OfflineHubService } from "./OfflineHubService";
import { useOfflineHubStore } from "@/stores/offlineHubStore";
import { Extras, Song } from "@saavn-labs/sdk";

/* ============================================================
   TYPES
   ============================================================ */

export type InferredMood =
  | "sad"
  | "romantic"
  | "chill"
  | "energetic"
  | "happy"
  | "melancholic"
  | "unknown";

type ActionType = "play" | "complete" | "skip" | "like" | "replay";

interface Track {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  downloadUrl?: string;
  album?: string;
  language?: string;
  genre?: string[];
  duration?: number;
}

interface TrackProfile {
  id: string;
  title: string;
  artist: string;
  mood: InferredMood;
  artistKey: string;
  titleTokens: string[];
}

interface Interaction {
  trackId: string;
  action: ActionType;
  timestamp: number;
  completionRatio?: number;
  replayCount?: number;
}

interface Candidate {
  track: Track;
  score: number;
  reasons: string[];
}

interface ArtistAffinity {
  score: number;
  plays: number;
  skips: number;
}

interface SessionState {
  seedTrackId?: string;
  recentTracks: string[];
  skippedTracks: Set<string>;
  queuedTracks: Set<string>;
  recentArtists: string[];
  moodWeights: Partial<Record<InferredMood, number>>;
  lastUpdated: number;
}

/* ============================================================
   CONFIG
   ============================================================ */

const CONFIG = {
  CANDIDATE_COUNT: 40,
  QUEUE_SIZE: 10,
  AUTO_VAULT_TOP_CANDIDATES: 3,
  MAX_ARTIST_REPEAT: 2,
  MIN_TRACK_DISTANCE: 6,
  EXPLORATION_WEIGHT: 0.035,
  HISTORY_HALF_LIFE_HOURS: 72,
  SKIP_PENALTY: 0.9,
  COMPLETE_REWARD: 0.38,
  REPLAY_REWARD: 0.55,
  LIKE_REWARD: 1.0,
};

/* ============================================================
   IN-MEMORY USER MODEL
   ============================================================ */

export class TasteEngineService {
  private static interactions: Interaction[] = [];
  private static artistAffinity = new Map<string, ArtistAffinity>();
  private static profiles = new Map<string, TrackProfile>();

  private static session: SessionState = {
    recentTracks: [],
    skippedTracks: new Set(),
    queuedTracks: new Set(),
    recentArtists: [],
    moodWeights: {},
    lastUpdated: Date.now(),
  };

  /* ==========================================================
     TEXT NORMALIZATION
     ========================================================== */

  private static normalize(value = ""): string {
    return value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private static artistKey(artist = ""): string {
    return this.normalize(artist)
      .split(",")[0]
      .split("&")[0]
      .trim();
  }

  /* ==========================================================
     MOOD DETECTION
     ========================================================== */

  static detectMood(title = "", artist = ""): InferredMood {
    const text = this.normalize(`${title} ${artist}`);

    const rules: Array<{ mood: InferredMood; keywords: string[] }> = [
      {
        mood: "romantic",
        keywords: [
          "pyaar", "pyar", "ishq", "mohabbat", "sanam", "jaan", "humsafar",
          "love", "romantic", "dil", "tera", "teri", "tum", "saware",
          "raabta", "kesariya", "dekha tenu", "tu hi", "tum ho"
        ],
      },
      {
        mood: "sad",
        keywords: [
          "dard", "bewafa", "judaai", "dhoka", "tanha", "adhuri", "rona",
          "rula", "tuta", "toota", "faasle", "alvida", "broken", "tears",
          "heartbreak", "bekhayali", "karachi", "choo lo", "phir bhi tumko"
        ],
      },
      {
        mood: "energetic",
        keywords: ["party", "dance", "dj", "bass", "beat", "club", "energy", "power"],
      },
      {
        mood: "happy",
        keywords: ["happy", "smile", "khushi", "khush", "mast", "masti", "celebrate"],
      },
      {
        mood: "melancholic",
        keywords: ["yaad", "memories", "nostalgia", "baarish", "rain", "shaam", "raat"],
      },
    ];

    for (const rule of rules) {
      if (rule.keywords.some((word) => text.includes(word))) {
        return rule.mood;
      }
    }

    return "chill";
  }

  /* ==========================================================
     PROFILE BUILDER
     ========================================================== */

  private static createProfile(track: Track): TrackProfile {
    const profile: TrackProfile = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      mood: this.detectMood(track.title, track.artist),
      artistKey: this.artistKey(track.artist),
      titleTokens: this.normalize(track.title).split(" ").filter(Boolean),
    };

    this.profiles.set(track.id, profile);
    return profile;
  }

  /* ==========================================================
     LEARNING ENGINE
     ========================================================== */

  static recordInteraction(track: Track, action: ActionType, completionRatio = 0) {
    if (!track?.id) return;

    const now = Date.now();
    const interaction: Interaction = {
      trackId: track.id,
      action,
      completionRatio,
      timestamp: now,
    };

    this.interactions.push(interaction);

    if (this.interactions.length > 1000) {
      this.interactions = this.interactions.slice(-1000);
    }

    const profile = this.profiles.get(track.id) ?? this.createProfile(track);

    this.updateArtistAffinity(profile.artistKey, action, completionRatio);
    this.updateSession(profile, action);

    if (action === "skip") {
      this.session.skippedTracks.add(track.id);
    }

    if (action === "replay") {
      this.updateTrackSignal(track.id);
    }

    if (action === "like") {
      this.updateTrackSignal(track.id);
    }

    if (action === "complete" && completionRatio >= 0.8) {
      this.updateTrackSignal(track.id);
    }

    this.session.lastUpdated = now;
  }

  /* ==========================================================
     ARTIST AFFINITY
     ========================================================== */

  private static updateArtistAffinity(
    artist: string,
    action: ActionType,
    completionRatio: number
  ) {
    const current = this.artistAffinity.get(artist) ?? {
      score: 0,
      plays: 0,
      skips: 0,
    };

    if (action === "play") {
      current.plays += 1;
      current.score += 0.08;
    }
    if (action === "complete") {
      current.score += 0.2 * Math.min(1, completionRatio);
    }
    if (action === "like") {
      current.score += 0.8;
    }
    if (action === "replay") {
      current.score += 0.65;
    }
    if (action === "skip") {
      current.skips += 1;
      current.score -= 0.75;
    }

    current.score = Math.max(-2, Math.min(5, current.score));
    this.artistAffinity.set(artist, current);
  }

  /* ==========================================================
     TRACK SIGNAL & SESSION LEARNING
     ========================================================== */

  private static updateTrackSignal(trackId: string) {
    this.session.recentTracks.unshift(trackId);
    this.session.recentTracks = this.session.recentTracks.slice(0, 30);
  }

  private static updateSession(profile: TrackProfile, action: ActionType) {
    const mood = profile.mood;
    const current = this.session.moodWeights[mood] ?? 0;
    let delta = 0;

    switch (action) {
      case "play": delta = 0.05; break;
      case "complete": delta = 0.2; break;
      case "like": delta = 0.5; break;
      case "replay": delta = 0.45; break;
      case "skip": delta = -0.45; break;
    }

    this.session.moodWeights[mood] = Math.max(-2, Math.min(3, current + delta));
    this.session.recentArtists.unshift(profile.artistKey);
    this.session.recentArtists = this.session.recentArtists.slice(0, 20);
  }

  private static decay(timestamp: number): number {
    const ageHours = (Date.now() - timestamp) / (1000 * 60 * 60);
    return Math.pow(0.5, ageHours / CONFIG.HISTORY_HALF_LIFE_HOURS);
  }

  private static getTrackAffinity(trackId: string): number {
    let score = 0;
    for (const interaction of this.interactions) {
      if (interaction.trackId !== trackId) continue;
      const decay = this.decay(interaction.timestamp);

      switch (interaction.action) {
        case "play": score += 0.05 * decay; break;
        case "complete": score += CONFIG.COMPLETE_REWARD * (interaction.completionRatio ?? 1) * decay; break;
        case "like": score += CONFIG.LIKE_REWARD * decay; break;
        case "replay": score += CONFIG.REPLAY_REWARD * decay; break;
        case "skip": score -= CONFIG.SKIP_PENALTY * decay; break;
      }
    }
    return score;
  }

  private static getMoodAffinity(mood: InferredMood): number {
    return this.session.moodWeights[mood] ?? 0;
  }

  private static getArtistAffinity(artist: string): number {
    const key = this.artistKey(artist);
    return this.artistAffinity.get(key)?.score ?? 0;
  }

  private static similarity(seed: TrackProfile, candidate: TrackProfile): number {
    let score = 0;
    if (seed.artistKey === candidate.artistKey) score += 0.55;
    if (seed.mood === candidate.mood) score += 0.2;

    const seedTokens = new Set(seed.titleTokens);
    const sharedTokens = candidate.titleTokens.filter((token) => seedTokens.has(token));
    if (sharedTokens.length > 0) {
      score += Math.min(0.12, sharedTokens.length * 0.04);
    }
    return Math.min(1, score);
  }

  private static scoreCandidate(seed: TrackProfile, candidate: Track): Candidate {
    const profile = this.profiles.get(candidate.id) ?? this.createProfile(candidate);
    const reasons: string[] = [];
    let score = 0;

    const sim = this.similarity(seed, profile);
    score += sim * 3.0;
    if (sim > 0.45) reasons.push("similar to current track");

    const artistAffinity = this.getArtistAffinity(candidate.artist);
    score += artistAffinity * 0.55;
    if (artistAffinity > 0.5) reasons.push("favorite artist");

    const trackAffinity = this.getTrackAffinity(candidate.id);
    score += trackAffinity * 1.8;
    if (trackAffinity > 0.3) reasons.push("user liked this before");

    const moodAffinity = this.getMoodAffinity(profile.mood);
    score += moodAffinity * 1.4;
    if (moodAffinity > 0.5) reasons.push("matches current session");

    const recentArtistIndex = this.session.recentArtists.indexOf(profile.artistKey);
    if (recentArtistIndex >= 0) {
      score -= Math.max(0, 0.45 - recentArtistIndex * 0.04);
      reasons.push("recent artist penalty");
    }

    const recentTrackIndex = this.session.recentTracks.indexOf(candidate.id);
    if (recentTrackIndex >= 0) {
      score -= 3;
      reasons.push("recently played");
    }

    if (this.session.skippedTracks.has(candidate.id)) {
      score -= 10;
      reasons.push("skipped this session");
    }

    score += Math.random() * CONFIG.EXPLORATION_WEIGHT;

    return { track: candidate, score, reasons };
  }

  private static diversify(candidates: Candidate[]): Candidate[] {
    const result: Candidate[] = [];
    const artistCounts = new Map<string, number>();
    const remaining = [...candidates];

    while (remaining.length > 0 && result.length < CONFIG.QUEUE_SIZE) {
      let bestIndex = -1;
      let bestScore = -Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        const artist = this.artistKey(candidate.track.artist);
        const count = artistCounts.get(artist) ?? 0;

        if (count >= CONFIG.MAX_ARTIST_REPEAT) continue;

        let adjustedScore = candidate.score;
        if (count === 1) adjustedScore -= 0.15;
        if (
          result.length >= 2 &&
          this.artistKey(result[result.length - 1].track.artist) === artist
        ) {
          adjustedScore -= 0.3;
        }

        if (adjustedScore > bestScore) {
          bestScore = adjustedScore;
          bestIndex = i;
        }
      }

      if (bestIndex === -1) break;

      const selected = remaining.splice(bestIndex, 1)[0];
      result.push(selected);

      const artist = this.artistKey(selected.track.artist);
      artistCounts.set(artist, (artistCounts.get(artist) ?? 0) + 1);
    }

    return result;
  }

  private static async generateCandidates(seedTrack: Track): Promise<Track[]> {
    const candidates: Track[] = [];
    try {
      const { stationId } = await Extras.createEntityStation({
        songIds: [seedTrack.id],
      });

      const { songs } = await Song.getByStationId({
        stationId,
        count: CONFIG.CANDIDATE_COUNT,
      });

      if (Array.isArray(songs)) {
        for (const item of songs) {
          if (!item?.id || item.id === seedTrack.id) continue;
          const artist = item.artists?.primary?.[0]?.name ?? "Unknown";

          candidates.push({
            id: item.id,
            title: item.title ?? "Unknown",
            artist,
            artwork:
              item.images?.[2]?.url ??
              item.images?.[1]?.url ??
              item.images?.[0]?.url ??
              "",
          });
        }
      }
    } catch (error) {
      console.warn("[TasteEngine] Candidate generation failed", error);
    }
    return candidates;
  }

  /* ==========================================================
     PUBLIC: BUILD NEXT QUEUE & AUTO-VAULT
     ========================================================== */

  static async buildNextQueue(seedTrack: Track): Promise<Track[]> {
    if (!seedTrack?.id) return [];

    const seed = this.profiles.get(seedTrack.id) ?? this.createProfile(seedTrack);
    this.session.seedTrackId = seedTrack.id;

    const candidates = await this.generateCandidates(seedTrack);
    if (!candidates.length) return [];

    const scored = candidates
      .map((track) => this.scoreCandidate(seed, track))
      .sort((a, b) => b.score - a.score);

    const finalCandidates = this.diversify(scored);

    for (const candidate of finalCandidates) {
      this.session.queuedTracks.add(candidate.track.id);
    }

    // Auto-Vault top-ranked recommendations in background
    void this.preCacheTopCandidates(finalCandidates.slice(0, CONFIG.AUTO_VAULT_TOP_CANDIDATES));

    return finalCandidates.map((c) => c.track);
  }

  private static async preCacheTopCandidates(candidates: Candidate[]) {
    for (const candidate of candidates) {
      await this.cacheTrack(candidate.track);
    }
  }

  /* ==========================================================
     PLAYBACK LIFECYCLE EVENTS
     ========================================================== */

  static onSongPlayed(track: Track) {
    if (!track?.id) return;
    this.recordInteraction(track, "play");
    void this.cacheTrack(track);
    void this.buildNextQueue(track);
  }

  static onSongCompleted(track: Track, completionRatio = 1) {
    this.recordInteraction(track, "complete", completionRatio);
  }

  static onSongSkipped(track: Track) {
    this.recordInteraction(track, "skip");
    this.session.queuedTracks.delete(track.id);
  }

  static onSongLiked(track: Track) {
    this.recordInteraction(track, "like");
  }

  static onSongReplay(track: Track) {
    this.recordInteraction(track, "replay");
  }

  /* ==========================================================
     OFFLINE AUTO-VAULT CACHE
     ========================================================== */

  private static async cacheTrack(track: Track) {
    try {
      const store = useOfflineHubStore.getState();
      const alreadyCached = (store.cachedTracks ?? []).some((i) => i?.id === track.id);
      if (alreadyCached) return;

      let downloadUrl = track.downloadUrl ?? "";

      if (!downloadUrl.startsWith("http")) {
        const { songs } = await Song.getById({ songIds: track.id });
        const encrypted = songs?.[0]?.media?.encryptedUrl;

        if (encrypted) {
          const urls = await Song.experimental.fetchStreamUrls(encrypted, "edge", true);
          if (Array.isArray(urls)) {
            const valid = urls.filter((url) => url?.url?.startsWith("http"));
            downloadUrl = valid.at(-1)?.url ?? "";
          }
        }
      }

      if (!downloadUrl.startsWith("http")) return;

      await OfflineHubService.downloadTrackToHub({
        id: track.id,
        title: track.title,
        artist: track.artist,
        artwork: track.artwork,
        downloadUrl,
        mood: this.detectMood(track.title, track.artist),
      });
    } catch (error) {
      console.warn("[TasteEngine] Cache failed for", track.title, error);
    }
  }

  /* ==========================================================
     DEBUG / SESSION CONTROLS
     ========================================================== */

  static resetSession() {
    this.session = {
      recentTracks: [],
      skippedTracks: new Set(),
      queuedTracks: new Set(),
      recentArtists: [],
      moodWeights: {},
      lastUpdated: Date.now(),
    };
  }
}
