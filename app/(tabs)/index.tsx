import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { HomeFeedService, PersonalizedFeedSection } from "@/services/HomeFeedService";
import { playerService } from "@/services/PlayerService";
import { Models } from "@saavn-labs/sdk";

interface HomeScreenProps {
  onAlbumPress: (id: string) => void;
  onPlaylistPress: (id: string) => void;
  onSearchFocus: () => void;
  deferInitialLoad?: boolean;
}

export default function HomeScreen({ deferInitialLoad }: HomeScreenProps) {
  const [feedSections, setFeedSections] = useState<PersonalizedFeedSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFeed = async () => {
    try {
      const data = await HomeFeedService.getPersonalizedFeed();
      setFeedSections(data);
    } catch (err) {
      console.error("Home feed fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!deferInitialLoad) {
      void loadFeed();
    }
  }, [deferInitialLoad]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadFeed();
  }, []);

  const handlePlaySong = (song: Models.Song, queue: Models.Song[]) => {
    void playerService.play(song, queue);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#1DB954"
          colors={["#1DB954"]}
        />
      }
    >
      <Text style={styles.headerGreeting}>Made For You</Text>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#1DB954" style={{ marginTop: 40 }} />
      ) : (
        feedSections.map((section, idx) => (
          <View key={`${section.title}-${idx}`} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.subtitle && (
              <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
            )}

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={section.songs}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.songCard}
                  onPress={() => handlePlaySong(item, section.songs)}
                >
                  <Image
                    source={{
                      uri:
                        item.images?.[2]?.url ||
                        item.images?.[1]?.url ||
                        "https://daze.jayagarwal.online/assets/logo.png",
                    }}
                    style={styles.songArtwork}
                  />
                  <Text style={styles.songTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.songArtist} numberOfLines={1}>
                    {item.artists?.primary?.[0]?.name || "Artist"}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 130 },
  headerGreeting: { color: "#fff", fontSize: 24, fontWeight: "800", marginBottom: 20 },
  sectionContainer: { marginBottom: 24 },
  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  sectionSubtitle: { color: "#94a3b8", fontSize: 12, marginTop: 2, marginBottom: 12 },
  songCard: { width: 130, marginRight: 14 },
  songArtwork: { width: 130, height: 130, borderRadius: 8, backgroundColor: "#282828" },
  songTitle: { color: "#fff", fontSize: 13, fontWeight: "600", marginTop: 8 },
  songArtist: { color: "#888", fontSize: 11, marginTop: 2 },
});
