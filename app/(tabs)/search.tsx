import SearchScreen from "@/screens/Search";
import { router, useLocalSearchParams } from "expo-router";

export default function SearchTab() {
  const { sharedUrl } = useLocalSearchParams<{ sharedUrl?: string }>();

  return (
    <SearchScreen
      onAlbumPress={(id) => router.push(`/album/${id}`)}
      onArtistPress={(id) => router.push(`/artist/${id}`)}
      onPlaylistPress={(id) => router.push(`/playlist/${id}`)}
      sharedUrl={sharedUrl}
    />
  );
}
