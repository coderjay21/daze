import HomeScreen from "@/screens/Home";
import { useUIStore } from "@/stores/uiStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeTab() {
  const { showPlayer } = useLocalSearchParams<{ showPlayer?: string }>();
  const isFullPlayerVisible = useUIStore((state) => state.isFullPlayerVisible);
  const [isConnected, setIsConnected] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsConnected(online);
    });

    return () => unsubscribe();
  }, []);

  const shouldDeferLoad = showPlayer === "true" || isFullPlayerVisible;

  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.offlineContainer}>
          <View style={styles.offlineIconBox}>
            <MaterialCommunityIcons name="wifi-off" size={44} color="#ef4444" />
          </View>

          <Text style={styles.offlineTitle}>You are currently offline</Text>
          <Text style={styles.offlineSubtitle}>
            No internet connection. Don't worry, your personalized songs are waiting for you in the Hub!
          </Text>

          <TouchableOpacity
            style={styles.goToHubBtn}
            onPress={() => router.push("/(tabs)/offline-hub" as any)}
          >
            <MaterialCommunityIcons name="lightning-bolt" size={20} color="#000" />
            <Text style={styles.goToHubBtnText}>Go to Offline Hub ⚡</Text>
          </TouchableOpacity>

          <Text style={styles.autoReconnectText}>
            Home feed will automatically reload when you're back online.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <HomeScreen
      onAlbumPress={(id) => router.push(`/album/${id}`)}
      onPlaylistPress={(id) => router.push(`/playlist/${id}`)}
      onSearchFocus={() => router.push("/search")}
      deferInitialLoad={shouldDeferLoad}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  offlineContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    marginBottom: 60,
  },
  offlineIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  offlineTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  offlineSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  goToHubBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1DB954",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginBottom: 16,
  },
  goToHubBtnText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "800",
  },
  autoReconnectText: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
  },
});
