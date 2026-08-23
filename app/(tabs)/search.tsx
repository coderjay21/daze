import React, { useMemo } from "react";
import SearchScreen from "@/screens/Search";
import { router, useLocalSearchParams } from "expo-router";

export default function SearchTab() {
  const params = useLocalSearchParams<{ sharedUrl?: string }>();
  const sharedUrl = useMemo(() => params.sharedUrl, [params.sharedUrl]);

  return (
    <SearchScreen
      onAlbumPress={(id) => router.push(`/album/${id}`)}
      onArtistPress={(id) => router.push(`/artist/${id}`)}
      onPlaylistPress={(id) => router.push(`/playlist/${id}`)}
      sharedUrl={sharedUrl}
    />
  );
}
