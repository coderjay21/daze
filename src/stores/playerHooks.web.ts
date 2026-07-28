import { usePlayerStore } from "./playerStore";

export const usePlaybackStatusHook = () => usePlayerStore((state) => state.status);
export const useCurrentSongHook = () => usePlayerStore((state) => state.currentSong);
export const useProgressHook = () => usePlayerStore((state) => state.progress);
export const useDurationHook = () => usePlayerStore((state) => state.duration);
export const useUpcomingTracksHook = () => usePlayerStore((state) => state.upcomingTracks);
