import { Models } from "@saavn-labs/sdk";
import { useNowPlaying, useActualQueue, useOnPlaybackProgressChange } from "react-native-nitro-player";

export const usePlaybackStatusHook = () => {
  const nowPlaying = useNowPlaying();
  if (nowPlaying.currentState === 'playing') return 'playing';
  if (nowPlaying.currentState === 'paused' || nowPlaying.currentState === 'stopped') return 'paused';
  return 'loading';
};

export const useCurrentSongHook = () => {
  const nowPlaying = useNowPlaying();
  return (nowPlaying.currentTrack?.extraPayload as unknown as Models.Song) || null;
};

export const useProgressHook = () => {
  const { position } = useOnPlaybackProgressChange();
  return position * 1000;
};

export const useDurationHook = () => {
  const nowPlaying = useNowPlaying();
  return nowPlaying.totalDuration * 1000;
};

export const useUpcomingTracksHook = () => {
  const { queue } = useActualQueue();
  const nowPlaying = useNowPlaying();
  const upcoming = queue.slice(nowPlaying.currentIndex + 1);
  return upcoming.map((t) => t.extraPayload as unknown as Models.Song).filter(Boolean);
};
