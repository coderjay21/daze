import {
  useCurrentSong,
  useDominantColor,
  useDuration,
  usePlaybackStatus,
  usePlayerActions,
  useProgress,
  useSetDominantColor,
} from "@/stores/playerStore";
import { createColorGradient, extractAndUpdateColor } from "@/utils";
import LoadingHeartbeat from "./LoadingHeartBeat";

import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Text } from "react-native-paper";

interface CompactPlayerProps {
  onPress: () => void;
  style?: ViewStyle;
}

const CompactPlayer: React.FC<CompactPlayerProps> = ({ onPress, style }) => {
  const currentSong = useCurrentSong();
  const status = usePlaybackStatus();
  const progress = useProgress();
  const duration = useDuration();
  const { togglePlayPause, next } = usePlayerActions();
  const dominantColor = useDominantColor();
  const setDominantColor = useSetDominantColor();

  useEffect(() => {
    if (currentSong?.images?.[0]?.url) {
      extractAndUpdateColor(currentSong.images[0].url, setDominantColor);
    }
  }, [currentSong?.id, setDominantColor]);

  if (!currentSong) return null;

  const progressPercent = duration > 0 ? progress / duration : 0;
  const gradient = createColorGradient(dominantColor);

  const dynamicPosition: ViewStyle = {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  };

  return (
    <View style={[styles.positioner, style, dynamicPosition]}>
      <View style={styles.container}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <TouchableOpacity
            onPress={onPress}
            style={styles.content}
            activeOpacity={0.9}
          >
            <View style={styles.leftContent}>
              <View style={styles.artworkContainer}>
                <Image
                  source={{ uri: currentSong.images?.[1]?.url }}
                  style={styles.artwork}
                  resizeMode="cover"
                />
              </View>

              <View style={styles.textContainer}>
                <Text
                  variant="bodyMedium"
                  numberOfLines={1}
                  style={styles.title}
                >
                  {currentSong.title}
                </Text>
                <Text
                  variant="bodySmall"
                  numberOfLines={1}
                  style={styles.subtitle}
                >
                  {currentSong.subtitle}
                </Text>
              </View>
            </View>

            <View style={styles.controls}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                style={styles.playButton}
                activeOpacity={0.8}
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <LoadingHeartbeat color="#ffffff" size={28} />
                ) : (
                  <MaterialIcons
                    name={status === "playing" ? "pause" : "play-arrow"}
                    size={28}
                    color="#ffffff"
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  next();
                }}
                style={styles.nextButton}
                activeOpacity={0.8}
                disabled={status === "loading"}
              >
                <MaterialIcons name="skip-next" size={34} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent * 100}%` },
              ]}
            />
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  positioner: {
    zIndex: 1000,
  },
  container: {
    width: "96%",
    maxWidth: 560,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  gradient: {
    borderRadius: 12,
  },
  progressBarContainer: {
    height: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  progressBarFill: {
    height: 2,
    backgroundColor: "#fff",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 55,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  artworkContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  artwork: {
    width: 42,
    height: 42,
    borderRadius: 5,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },
  title: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
    marginBottom: 1,
  },
  subtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    lineHeight: 14,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  playButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  nextButton: {
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
});

export default CompactPlayer;
