import CompactPlayer from "@/components/player/CompactPlayer";
import FullPlayer from "@/components/player/FullPlayer";
import { ForceUpdateModal } from "@/components/common/ForceUpdateModal";
import { useUIStore } from "@/stores/uiStore";
import { sizes } from "@/utils";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, useLocalSearchParams, router } from "expo-router";
import * as Linking from "expo-linking";
import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function TabLayout() {
  const { isFullPlayerVisible, setFullPlayerVisible } = useUIStore();
  const { showPlayer } = useLocalSearchParams<{ showPlayer?: string }>();
  const isHandlingShare = useRef(false);

  useEffect(() => {
    if (showPlayer === "true") {
      setFullPlayerVisible(true);
    }
  }, [showPlayer, setFullPlayerVisible]);

  // 🔗 Incoming Share & Deep Linking Handler (Instagram Reels / Text share)
  useEffect(() => {
    const handleIncomingData = (rawUrl: string | null) => {
      if (!rawUrl || isHandlingShare.current) return;

      const decoded = decodeURIComponent(rawUrl);
      const isInstagram =
        decoded.includes("instagram.com") ||
        decoded.includes("/reel/") ||
        decoded.includes("/p/") ||
        decoded.includes("/stories/");

      if (isInstagram || decoded.startsWith("http")) {
        isHandlingShare.current = true;

        // ⏱️ Router initialization buffer taaki tabs mount hone ke baad navigate ho
        setTimeout(() => {
          router.replace({
            pathname: "/search" as any,
            params: { sharedUrl: decoded },
          });

          // Reset flag after transition
          setTimeout(() => {
            isHandlingShare.current = false;
          }, 1500);
        }, 350);
      }
    };

    // 1. App cold start share listener
    Linking.getInitialURL().then((url) => {
      if (url) handleIncomingData(url);
    });

    // 2. App background share listener
    const sub = Linking.addEventListener("url", (event) => {
      if (event?.url) handleIncomingData(event.url);
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
