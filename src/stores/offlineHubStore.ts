import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { appStorage } from "./storage";

export interface HubTrack {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  localUri: string;
  fileSizeBytes: number;
  mood: "sad" | "romantic" | "chill" | "upbeat";
  addedAt: number;
  playCount: number;
  isPinned?: boolean;
}

interface OfflineHubState {
  hasConfigured: boolean;
  maxQuotaMB: number;
  cachedTracks: HubTrack[];
  activeMood: "sad" | "romantic" | "chill" | "upbeat";

  setQuota: (mb: number) => void;
  setHasConfigured: (status: boolean) => void;
  setActiveMood: (mood: "sad" | "romantic" | "chill" | "upbeat") => void;
  addTrackToHub: (track: HubTrack) => void;
  removeTrackFromHub: (id: string) => void;
  togglePinTrack: (id: string) => void;
  getTotalUsedBytes: () => number;
}

export const useOfflineHubStore = create<OfflineHubState>()(
  persist(
    (set, get) => ({
      hasConfigured: false,
      maxQuotaMB: 500,
      cachedTracks: [],
      activeMood: "sad",

      setQuota: (mb) => set({ maxQuotaMB: mb }),
      setHasConfigured: (status) => set({ hasConfigured: status }),
      setActiveMood: (mood) => set({ activeMood: mood }),

      addTrackToHub: (track) => {
        const current = (get().cachedTracks || []).filter((t) => t?.id !== track?.id);
        set({ cachedTracks: [track, ...current] });
      },

      removeTrackFromHub: (id) => {
        set({ cachedTracks: (get().cachedTracks || []).filter((t) => t?.id !== id) });
      },

      togglePinTrack: (id) => {
        set({
          cachedTracks: (get().cachedTracks || []).map((t) =>
            t?.id === id ? { ...t, isPinned: !t.isPinned } : t
          ),
        });
      },

      getTotalUsedBytes: () => {
        return (get().cachedTracks || []).reduce(
          (acc, t) => acc + (t?.fileSizeBytes || 0),
          0
        );
      },
    }),
    {
      name: "daze_offline_hub_storage",
      storage: createJSONStorage(() => ({
        getItem: async (name: string) => (await appStorage.getItem(name)) || null,
        setItem: async (name: string, value: string) => {
          await appStorage.setItem(name, value);
        },
        removeItem: async (name: string) => {
          await appStorage.removeItem(name);
        },
      })),
    }
  )
);
