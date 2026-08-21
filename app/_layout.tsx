import AppUpdateDialog from "@/components/common/AppUpdateDialog";
import GlobalSnackbar from "@/components/common/GlobalSnackbar";
import SupportDazeModal from "@/components/common/SupportDazeModal";
import { playerService, setSevenSongsCallback } from "@/services/PlayerService";
import { syncDeviceTelemetry } from "@/services/TelemetryService";
import { updateService } from "@/services/UpdateService";
import { usePlayerStore } from "@/stores/playerStore";
import { iconFonts } from "@/utils/loadFonts";
import { MaterialIcons } from "@expo/vector-icons";
import { setFetchConfig } from "@saavn-labs/sdk";
import { useFonts } from "expo-font";
import * as Network from "expo-network";
import { Link, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { setStatusBarBackgroundColor, StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Linking,
  Platform,
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  configureFonts,
  MD3DarkTheme,
  PaperProvider,
  Text,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

void SplashScreen.preventAutoHideAsync();

if (Platform.OS === "web") {
  setFetchConfig({
    baseUrl: "https://daze.jayagarwal.online/saavn",
  });
}

// 31st August 2026 midnight shutdown limit
const SHUTDOWN_DATE = new Date("2026-08-31T23:59:59+05:30").getTime();

const fonts = configureFonts({
  config: {
    fontFamily: "SpotifyMedium",
  },
});

const theme = {
  ...MD3DarkTheme,
  fonts,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#1DB954",
    secondary: "#1ed760",
    background: "#121212",
    surface: "#282828",
    surfaceVariant: "#333333",
    onSurface: "#ffffff",
    onSurfaceVariant: "#b3b3b3",
    error: "#cf6679",
    onError: "#000000",
    outline: "#404040",
  },
  roundness: 12,
};

export default function Layout() {
  const [fontsLoaded, fontError] = useFonts({
    SpotifyMedium: require("../assets/fonts/SpotifyMedium.ttf"),
    ...iconFonts,
  });

  const [isOnline, setIsOnline] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const { restoreLastTrack } = usePlayerStore();

  useEffect(() => {
    let isMounted = true;

    const checkConnectivity = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        const connected = Boolean(
          state.isConnected && state.isInternetReachable !== false
        );
        if (isMounted) {
          setIsOnline(connected);
        }
      } catch (e) {
        if (isMounted) setIsOnline(false);
      }
    };

    // 1. Initial network check
    void checkConnectivity();

    // 2. Native network state listener
    const subscription = Network.addNetworkStateListener((state) => {
      const connected = Boolean(
        state.isConnected && state.isInternetReachable !== false
      );
      if (isMounted) {
        setIsOnline(connected);
      }
    });

    // 3. Real-time 3-second heartbeat poll (instant response during playback)
    const interval = setInterval(() => {
      void checkConnectivity();
    }, 3000);

    return () => {
      isMounted = false;
      subscription.remove();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // Check if free quota expired
    if (Date.now() > SHUTDOWN_DATE) {
      setIsExpired(true);
    }

    // Trigger support popup after 7 songs play
    setSevenSongsCallback(() => {
      setSupportModalVisible(true);
    });
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      const text = RNText as typeof RNText & {
        defaultProps?: { style?: unknown };
      };
      text.defaultProps = {
        ...text.defaultProps,
        style: [text.defaultProps?.style, { fontFamily: "SpotifyMedium" }],
      };

      const textInput = RNTextInput as typeof RNTextInput & {
        defaultProps?: { style?: unknown };
      };
      textInput.defaultProps = {
        ...textInput.defaultProps,
        style: [textInput.defaultProps?.style, { fontFamily: "SpotifyMedium" }],
      };
    }
  }, [fontsLoaded]);

  useEffect(() => {
    void playerService.initialize();

    // Trigger telemetry tracking to Google Sheets
    void syncDeviceTelemetry();

    // Check for updates on startup
    const timer = setTimeout(() => {
      void updateService.checkOnLaunch();
    }, 1500);

    setStatusBarBackgroundColor("#121212", false);

    return () => {
      clearTimeout(timer);
      void playerService.stop();
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
      void restoreLastTrack();
    }
  }, [fontsLoaded, fontError, restoreLastTrack]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // 31st August 2026 Quota Expiry Lockout Screen
  if (isExpired) {
    return (
      <PaperProvider theme={theme}>
        <StatusBar backgroundColor="#07090e" style="light" />
        <View style={styles.expiredContainer}>
          <Text style={styles.expiredIcon}>⏳</Text>
          <Text variant="headlineSmall" style={styles.expiredTitle}>
            Server Quota Expired
          </Text>
          <Text variant="bodyMedium" style={styles.expiredDesc}>
            Daze's free server tier concluded on 31st August 2026. Please visit our website to fuel the server and keep Daze permanently running.
          </Text>
          <TouchableOpacity
            style={styles.expiredButton}
            onPress={() => Linking.openURL("https://daze.jayagarwal.online")}
          >
            <Text style={styles.expiredButtonText}>Visit Official Website</Text>
          </TouchableOpacity>
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar backgroundColor="#121212" style="light" />
      <SafeAreaView
        style={styles.root}
        edges={["top", "bottom", "left", "right"]}
      >
        {/* Global Offline Bar */}
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <MaterialIcons name="cloud-off" size={16} color="#ffffff" />
            <Text style={styles.offlineText}>
              You are offline • Listen to downloaded songs
            </Text>
          </View>
        )}

        <Link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@mdi/font/css/materialdesignicons.min.css"
        />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: styles.screenStyle,
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
              contentStyle: styles.screenStyle,
            }}
          />
          <Stack.Screen
            name="song/[id]"
            options={{
              headerShown: false,
              contentStyle: styles.screenStyle,
              gestureEnabled: false,
              animationDuration: 0,
            }}
          />
          <Stack.Screen
            name="album/[id]"
            options={{
              presentation: "modal",
              headerShown: false,
              contentStyle: styles.screenStyle,
            }}
          />
          <Stack.Screen
            name="artist/[id]"
            options={{
              presentation: "modal",
              headerShown: false,
              contentStyle: styles.screenStyle,
            }}
          />
          <Stack.Screen
            name="playlist/[id]"
            options={{
              presentation: "modal",
              headerShown: false,
              contentStyle: styles.screenStyle,
            }}
          />
        </Stack>

        <AppUpdateDialog />
        <GlobalSnackbar />
        <SupportDazeModal
          visible={supportModalVisible}
          onClose={() => setSupportModalVisible(false)}
        />
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#121212",
  },
  screenStyle: {
    backgroundColor: "#121212",
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ef4444",
    paddingVertical: 7,
    paddingHorizontal: 12,
    zIndex: 9999,
  },
  offlineText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  expiredContainer: {
    flex: 1,
    backgroundColor: "#07090e",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  expiredIcon: {
    fontSize: 52,
    marginBottom: 16,
  },
  expiredTitle: {
    color: "#ffffff",
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  expiredDesc: {
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
    maxWidth: 320,
  },
  expiredButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
  },
  expiredButtonText: {
    color: "#031407",
    fontWeight: "700",
    fontSize: 15,
  },
});
