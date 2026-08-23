import CompactPlayer from "@/components/player/CompactPlayer";
import FullPlayer from "@/components/player/FullPlayer";
import { ForceUpdateModal } from "@/components/common/ForceUpdateModal";
import { useUIStore } from "@/stores/uiStore";
import { sizes } from "@/utils";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, useLocalSearchParams, router } from "expo-router";
import * as Linking from "expo-linking";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function TabLayout() {
  const { isFullPlayerVisible, setFullPlayerVisible } = useUIStore();
  const { showPlayer } = useLocalSearchParams<{ showPlayer?: string }>();

  useEffect(() => {
    if (showPlayer === "true") {
      setFullPlayerVisible(true);
    }
  }, [showPlayer, setFullPlayerVisible]);

  // 🔗 Incoming Share & Deep Linking Handler (Instagram Reels / Text share)
  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      const url = event.url;
      if (!url) return;

      // Handle Instagram / Social links shared to Daze
      if (
        url.includes("instagram.com/reel/") ||
        url.includes("instagram.com/p/") ||
        url.includes("instagram.com/stories/")
      ) {
        router.push({
          pathname: "/search" as any,
          params: { sharedUrl: url },
        });
      }
    };

    // 1. Listen for intent while app is open/in background
    const sub = Linking.addEventListener("url", handleUrl);

    // 2. Check if app was opened via cold start share intent
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    return () => sub.remove();
  }, []);

  return (
    <View style={styles.root}>
      <Tabs
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: "transparent",
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            height: sizes.tabBarHeight,
          },
          tabBarActiveTintColor: "#ffffff",
          tabBarInactiveTintColor: "#b3b3b3",
          tabBarItemStyle: {
            paddingTop: 16,
          },
          tabBarBackground: () => (
            <LinearGradient
              colors={[
                "rgba(18,18,18,0)",
                "rgba(18,18,18,0.72)",
                "rgba(18,18,18,0.95)",
              ]}
              locations={[0, 0.48, 1]}
              style={[styles.tabBarBackground, { pointerEvents: "none" }]}
            />
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabItem}>
                <MaterialCommunityIcons
                  name={focused ? "home-variant" : "home-variant-outline"}
                  color={color}
                  size={26}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: focused ? "#ffffff" : "#b3b3b3" },
                  ]}
                >
                  Home
                </Text>
              </View>
            ),
            tabBarAccessibilityLabel: "Home",
          }}
        />

        <Tabs.Screen
          name="search"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabItem}>
                <MaterialCommunityIcons
                  name="magnify"
                  color={color}
                  size={26}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: focused ? "#ffffff" : "#b3b3b3" },
                  ]}
                >
                  Search
                </Text>
              </View>
            ),
            tabBarAccessibilityLabel: "Search",
          }}
        />

        <Tabs.Screen
          name="library"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabItem}>
                <MaterialCommunityIcons
                  name="bookshelf"
                  color={color}
                  size={26}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: focused ? "#ffffff" : "#b3b3b3" },
                  ]}
                >
                  Library
                </Text>
              </View>
            ),
            tabBarAccessibilityLabel: "Library",
          }}
        />

        {/* 4th Tab: Offline Hub */}
        <Tabs.Screen
          name="offline-hub"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabItem}>
                <MaterialCommunityIcons
                  name={focused ? "lightning-bolt" : "lightning-bolt-outline"}
                  color={focused ? "#1DB954" : color}
                  size={26}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: focused ? "#1DB954" : "#b3b3b3" },
                  ]}
                >
                  Hub
                </Text>
              </View>
            ),
            tabBarAccessibilityLabel: "Offline Hub",
          }}
        />

        <Tabs.Screen
          name="downloads"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabItem}>
                <MaterialCommunityIcons
                  name="download"
                  color={color}
                  size={26}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: focused ? "#ffffff" : "#b3b3b3" },
                  ]}
                >
                  Downloads
                </Text>
              </View>
            ),
            tabBarAccessibilityLabel: "Downloads",
          }}
        />
      </Tabs>

      <CompactPlayer
        onPress={() => setFullPlayerVisible(true)}
        style={styles.compactPlayerOffset}
      />

      <FullPlayer
        visible={isFullPlayerVisible}
        onClose={() => setFullPlayerVisible(false)}
      />

      {/* Compulsory Force Update Modal */}
      <ForceUpdateModal />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#121212",
  },
  compactPlayerOffset: {
    position: "absolute",
    bottom: sizes.tabBarHeight,
    zIndex: 1000,
    elevation: 10,
  },
  tabBarBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: sizes.tabBarHeight + 60,
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabLabel: {
    fontFamily: "SpotifyMedium",
    fontSize: 11,
    marginTop: 3,
    minWidth: 64,
    textAlign: "center",
  },
});
