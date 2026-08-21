import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  isPinned?: boolean; // Agar user ne khud add kiya ho toh auto-delete nahi hoga
}

interface OfflineHubState {
  hasConfigured: boolean; // First time quota setup flag
  maxQuotaMB: number; // e.g., 250, 500, 1000
  cachedTracks: HubTrack[];
  activeMood: "sad" | "romantic" | "chill" | "upbeat";
  
  // Actions
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

      setQuota: (mb: number) => set({ maxQuotaMB: mb }),
      setHasConfigured: (status: boolean) => set({ hasConfigured: status }),
      setActiveMood: (mood) => set({ activeMood: mood }),

      addTrackToHub: (track) => {
        const current = get().cachedTracks.filter((t) => t.id !== track.id);
        set({ cachedTracks: [track, ...current] });
      },

      removeTrackFromHub: (id) => {
        set({ cachedTracks: get().cachedTracks.filter((t) => t.id !== id) });
      },

      togglePinTrack: (id) => {
        set({
          cachedTracks: get().cachedTracks.map((t) =>
            t.id === id ? { ...t, isPinned: !t.isPinned } : t
          ),
        });
      },

      getTotalUsedBytes: () => {
        return get().cachedTracks.reduce((acc, t) => acc + (t.fileSizeBytes || 0), 0);
      },
    }),
    {
      name: "daze_offline_hub_storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
