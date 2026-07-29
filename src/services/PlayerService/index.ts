import { AUDIO_QUALITY, STORAGE_KEYS } from "@/constants";
import { appStorage } from "@/stores/storage";
import { RepeatMode } from "@/types";
import { Extras, Models, Song } from "@saavn-labs/sdk";
import type { TrackItem } from "react-native-nitro-player";
import { PlayerQueue, TrackPlayer } from "react-native-nitro-player";
import { historyService } from "../HistoryService";

export interface PlayerState {
  status: "playing" | "paused" | "loading";
  currentSong: Models.Song | null;
  upcomingTracks: Models.Song[];
  progress: number;
  duration: number;
  repeatMode: RepeatMode;
}

export type StateUpdater = (updates: Partial<PlayerState>) => void;

export interface IPlayerService {
  play(song: Models.Song, providedQueue?: Models.Song[]): Promise<void>;
  resume(): Promise<void>;
  pause(): Promise<void>;
  togglePlayPause(): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  seekTo(positionMs: number): Promise<void>;
  setRepeatMode(mode: RepeatMode): Promise<void>;
  stop(): Promise<void>;
  addToQueue(song: Models.Song): Promise<void>;
  addNextInQueue(song: Models.Song): Promise<void>;
  restoreLastPlayedTrack(currentSong: Models.Song | null, progress: number): Promise<void>;
}

export class PlayerService implements IPlayerService {
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await TrackPlayer.configure({
      androidAutoEnabled: true,
      showInNotification: true,
      androidNotificationIcon: "ic_notification",
      lookaheadCount: 5,
    });

    this.setupEventListeners();
    this.isInitialized = true;
  }

  private setupEventListeners(): void {
    TrackPlayer.onChangeTrack(async (track, reason) => {
      if (!track) return;

      const state = await TrackPlayer.getState();
      const queue = await TrackPlayer.getActualQueue();

      if (state.currentIndex >= queue.length - 2) {
        await this.maybeExtendQueue(track.id);
      }
      
      if (track.extraPayload) {
        try {
          await historyService.addToHistory(track.extraPayload as unknown as Models.Song, 0);
        } catch (error) {
          console.error("[PlayerService] addToHistory error:", error);
        }
      }
    });
  }

  async play(song: Models.Song, providedQueue?: Models.Song[]): Promise<void> {
    try {
      let fullQueue: Models.Song[] = [];
      if (providedQueue?.length) {
        const currentIndex = providedQueue.findIndex(s => s.id === song.id);
        const queueFromCurrent = currentIndex >= 0 ? providedQueue.slice(currentIndex + 1) : providedQueue;
        const seen = new Set<string>();
        const filtered = queueFromCurrent.filter(s => {
          if (!s.id || s.id === song.id) return false;
          if (seen.has(s.id)) return false;
          seen.add(s.id);
          return true;
        });
        fullQueue = [song, ...filtered];
      } else {
        const recs = await this.fetchRecommendations(song.id);
        fullQueue = [song, ...recs.slice(0, 10)];
      }

      const tracks = await Promise.all(fullQueue.map(s => this.prepareTrack(s)));
      const validTracks = tracks.filter((t): t is TrackItem => !!t);

      if (validTracks.length === 0) throw new Error("No valid tracks");

      const playlistId = await PlayerQueue.createPlaylist(
        song.title || "Now Playing",
        "",
        song.images?.[2]?.url || song.images?.[1]?.url || undefined,
      );

      await PlayerQueue.addTracksToPlaylist(playlistId, validTracks);
      await PlayerQueue.loadPlaylist(playlistId);
      await TrackPlayer.playSong(song.id, playlistId);
      await TrackPlayer.play();
    } catch (error) {
      console.error("[Player] Play failed:", error);
    }
  }

  async resume(): Promise<void> {
    await TrackPlayer.play();
  }

  async restoreLastPlayedTrack(currentSong: Models.Song | null, progress: number): Promise<void> {
    if (!currentSong) return;
    try {
      const recs = await this.fetchRecommendations(currentSong.id);
      const fullQueue = [currentSong, ...recs.slice(0, 10)];
      
      const tracks = await Promise.all(fullQueue.map(s => this.prepareTrack(s)));
      const validTracks = tracks.filter((t): t is TrackItem => !!t);

      if (validTracks.length === 0) throw new Error("No valid tracks prepared");

      const playlistId = await PlayerQueue.createPlaylist(
        currentSong.title || "Now Playing",
        "",
        currentSong.images?.[2]?.url || currentSong.images?.[1]?.url || undefined,
      );

      await PlayerQueue.addTracksToPlaylist(playlistId, validTracks);
      await PlayerQueue.loadPlaylist(playlistId);
      await TrackPlayer.playSong(currentSong.id, playlistId);
      
      if (progress > 0) {
        await TrackPlayer.seek(progress / 1000);
      }
      await TrackPlayer.pause();
    } catch (error) {
      console.error("[Player] Restore track failed:", error);
    }
  }

  async pause(): Promise<void> {
    await TrackPlayer.pause();
  }

  async togglePlayPause(): Promise<void> {
    const state = await TrackPlayer.getState();
    if (state.currentState === "playing") {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  }

  async next(): Promise<void> {
    await TrackPlayer.skipToNext();
  }

  async previous(): Promise<void> {
    const state = await TrackPlayer.getState();
    if (state.currentPosition > 3) {
      await TrackPlayer.seek(0);
    } else {
      await TrackPlayer.skipToPrevious();
    }
  }

  async seekTo(positionMs: number): Promise<void> {
    await TrackPlayer.seek(positionMs / 1000);
  }

  async setRepeatMode(mode: RepeatMode): Promise<void> {
    let nitroMode: "off" | "track" | "Playlist" = "off";
    if (mode === "one") nitroMode = "track";
    else if (mode === "all") nitroMode = "Playlist";
    
    await TrackPlayer.setRepeatMode(nitroMode);
  }

  async stop(): Promise<void> {
    const currentPlaylistId = await PlayerQueue.getCurrentPlaylistId();
    if (currentPlaylistId) {
      await PlayerQueue.deletePlaylist(currentPlaylistId);
    }
    await TrackPlayer.pause();
  }

  async addToQueue(song: Models.Song): Promise<void> {
    const track = await this.prepareTrack(song);
    if (track) {
      await TrackPlayer.addToUpNext(track.id);
    }
  }

  async addNextInQueue(song: Models.Song): Promise<void> {
    const track = await this.prepareTrack(song);
    if (track) {
      await TrackPlayer.playNext(track.id);
    }
  }

  public async prepareTrack(song: Models.Song): Promise<TrackItem | null> {
    try {
      let url: string;
      
      const encrypted = song.media?.encryptedUrl || (await Song.getById({ songIds: song.id })).songs[0]?.media?.encryptedUrl;
      if (!encrypted) throw new Error("No encrypted URL");

      const urls = await Song.experimental.fetchStreamUrls(encrypted, "edge", true);

      const quality = (await appStorage.getItem(STORAGE_KEYS.CONTENT_QUALITY)) || "medium";
      const idx = AUDIO_QUALITY[quality.toUpperCase() as keyof typeof AUDIO_QUALITY] || AUDIO_QUALITY.MEDIUM;

      const streamUrl = urls[idx]?.url;
      if (!streamUrl) throw new Error("No streaming URL");
      url = streamUrl;

      const artist = song.artists?.primary?.map((a) => a.name).join(", ") || "Unknown";
      const album = typeof song.album === "string" ? song.album : song.album?.title || "";
      const artwork = song.images?.[2]?.url || song.images?.[1]?.url || "";

      return {
        id: song.id,
        url,
        title: song.title || "Unknown",
        artist,
        album,
        artwork: artwork || null,
        duration: song.duration || 0,
        extraPayload: JSON.parse(JSON.stringify(song)),
      };
    } catch (error) {
      console.error("[Player] Failed to prepare track:", song.title, error);
      return null;
    }
  }

  private async fetchRecommendations(seedSongId: string): Promise<Models.Song[]> {
    try {
      const { stationId } = await Extras.createEntityStation({ songIds: [seedSongId] });
      const { songs } = await Song.getByStationId({ stationId });
      
      // const songs = await Song.getRecommendations({ songId: seedSongId });

      const history = await historyService.getHistory();
      const playedIds = new Set(history.map((entry) => entry.song.id));
      
      return songs.filter(s => s.id !== seedSongId && !playedIds.has(s.id));
    } catch (error) {
      console.error("[Player] Fetch recommendations failed:", error);
      return [];
    }
  }

  private async maybeExtendQueue(seedSongId: string): Promise<boolean> {
    try {
      const recs = await this.fetchRecommendations(seedSongId);
      if (recs.length === 0) return false;

      const tracks = await Promise.all(recs.slice(0, 10).map(s => this.prepareTrack(s)));
      const validTracks = tracks.filter((t): t is TrackItem => !!t);

      if (validTracks.length === 0) return false;

      const currentPlaylistId = await PlayerQueue.getCurrentPlaylistId();
      if (currentPlaylistId) {
        await PlayerQueue.addTracksToPlaylist(currentPlaylistId, validTracks);
      }
      return true;
    } catch (error) {
      console.error("[Player] Extend queue failed:", error);
      return false;
    }
  }
}

export const playerService = new PlayerService();