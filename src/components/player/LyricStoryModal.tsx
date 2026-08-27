import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";

interface LyricStoryModalProps {
  visible: boolean;
  onClose: () => void;
  songTitle: string;
  artistName: string;
  artworkUrl?: string;
  selectedLyrics: string[];
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.88;
const CARD_HEIGHT = CARD_WIDTH * 1.65; // Taller Ghibli poster aspect ratio

export const LyricStoryModal: React.FC<LyricStoryModalProps> = ({
  visible,
  onClose,
  songTitle,
  artistName,
  artworkUrl,
  selectedLyrics,
}) => {
  const viewShotRef = useRef<any>(null);
  const [sharing, setSharing] = useState(false);

  const handleShareStory = async () => {
    try {
      setSharing(true);
      if (viewShotRef.current) {
        const uri = await viewShotRef.current.capture();
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Share to Instagram Story",
          UTI: "public.png",
        });
      }
    } catch (e) {
      console.warn("Story Share Error:", e);
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <MaterialCommunityIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cinematic Ghibli Card</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* 🎨 Ghibli / Pinterest Cinematic Poster Card */}
        <ViewShot
          ref={viewShotRef}
          options={{ format: "png", quality: 1.0 }}
          style={styles.cardWrapper}
        >
          <LinearGradient
            colors={["#1c1917", "#0f172a", "#090d16"]}
            style={styles.cardGradient}
          >
            {/* Atmospheric Background Blur */}
            {artworkUrl && (
              <Image
                source={{ uri: artworkUrl }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                blurRadius={60}
                opacity={0.4}
              />
            )}

            {/* Top Cinematic Badge */}
            <View style={styles.topBadgeRow}>
              <Text style={styles.badgeText}>✦ DAZE CINEMATIC MEMORY ✦</Text>
            </View>

            {/* Big Ghibli Style Artwork Box */}
            <View style={styles.artworkContainer}>
              <Image
                source={{ uri: artworkUrl }}
                style={styles.mainArtwork}
                contentFit="cover"
              />
            </View>

            {/* Song Meta */}
            <View style={styles.metaBox}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {songTitle.toUpperCase()}
              </Text>
              <Text style={styles.cardArtist} numberOfLines={1}>
                {artistName}
              </Text>
            </View>

            {/* Poetic Lyrics (Ghibli Vibe Quotes) */}
            <View style={styles.lyricsBody}>
              <Text style={styles.quoteMark}>“</Text>
              {selectedLyrics.map((line, idx) => (
                <Text key={idx} style={styles.lyricLine}>
                  {line}
                </Text>
              ))}
              <Text style={styles.quoteMarkClose}>”</Text>
            </View>

            {/* Footer Branding */}
            <View style={styles.cardFooter}>
              <View style={styles.brandRow}>
                <MaterialCommunityIcons name="lightning-bolt" size={14} color="#4ade80" />
                <Text style={styles.brandText}>DAZE MUSIC</Text>
              </View>
              <Text style={styles.tagline}>Lossless • daze.jayagarwal.online</Text>
            </View>
          </LinearGradient>
        </ViewShot>

        {/* Share Button */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.btnShare}
            onPress={handleShareStory}
            disabled={sharing}
          >
            {sharing ? (
              <ActivityIndicator color="#031407" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="instagram" size={22} color="#031407" />
                <Text style={styles.btnShareText}>Share to Instagram Story</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 30,
  },
  topBar: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 28,
    overflow: "hidden",
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  cardGradient: {
    flex: 1,
    padding: 22,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 28,
  },
  topBadgeRow: {
    alignItems: "center",
    marginTop: 4,
  },
  badgeText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
  },
  artworkContainer: {
    width: "100%",
    height: CARD_WIDTH * 0.72,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  mainArtwork: {
    width: "100%",
    height: "100%",
  },
  metaBox: {
    alignItems: "center",
    marginTop: 8,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center",
  },
  cardArtist: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },
  lyricsBody: {
    marginVertical: 4,
    paddingHorizontal: 8,
    position: "relative",
  },
  quoteMark: {
    color: "rgba(74, 222, 128, 0.4)",
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 20,
    marginBottom: -10,
  },
  quoteMarkClose: {
    color: "rgba(74, 222, 128, 0.4)",
    fontSize: 32,
    fontWeight: "900",
    textAlign: "right",
    lineHeight: 15,
    marginTop: -10,
  },
  lyricLine: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 26,
    letterSpacing: -0.2,
    textAlign: "center",
    fontStyle: "italic",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    paddingTop: 12,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  brandText: {
    color: "#4ade80",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  tagline: {
    color: "#94a3b8",
    fontSize: 9,
    fontWeight: "600",
  },
  controls: {
    width: "100%",
    paddingHorizontal: 24,
  },
  btnShare: {
    backgroundColor: "#4ade80",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 100,
    shadowColor: "#4ade80",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  btnShareText: {
    color: "#031407",
    fontWeight: "700",
    fontSize: 15,
  },
});
