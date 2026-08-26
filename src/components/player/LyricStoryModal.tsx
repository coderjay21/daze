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
const CARD_WIDTH = width * 0.84;
const CARD_HEIGHT = CARD_WIDTH * 1.55;

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
          <Text style={styles.headerTitle}>Aesthetic Lyric Card</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* 📸 The Capturable Card View (9:16 Ratio) */}
        <ViewShot
          ref={viewShotRef}
          options={{ format: "png", quality: 1.0 }}
          style={styles.cardWrapper}
        >
          <LinearGradient
            colors={["#1e293b", "#0f172a", "#020617"]}
            style={styles.cardGradient}
          >
            {/* Ambient Background Image Blur */}
            {artworkUrl && (
              <Image
                source={{ uri: artworkUrl }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                blurRadius={45}
                opacity={0.35}
              />
            )}

            {/* Song Header Info */}
            <View style={styles.cardHeader}>
              <Image
                source={{ uri: artworkUrl }}
                style={styles.miniArtwork}
                contentFit="cover"
              />
              <View style={styles.songInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {songTitle}
                </Text>
                <Text style={styles.cardArtist} numberOfLines={1}>
                  {artistName}
                </Text>
              </View>
            </View>

            {/* Selected Aesthetic Lyrics */}
            <View style={styles.lyricsBody}>
              <MaterialCommunityIcons
                name="format-quote-open"
                size={28}
                color="rgba(74, 222, 128, 0.4)"
                style={{ marginBottom: 4 }}
              />
              {selectedLyrics.map((line, idx) => (
                <Text key={idx} style={styles.lyricLine}>
                  {line}
                </Text>
              ))}
            </View>

            {/* Daze Branding Footer */}
            <View style={styles.cardFooter}>
              <View style={styles.brandRow}>
                <MaterialCommunityIcons name="lightning-bolt" size={16} color="#4ade80" />
                <Text style={styles.brandText}>DAZE MUSIC</Text>
              </View>
              <Text style={styles.tagline}>Lossless • Pure Sound</Text>
            </View>
          </LinearGradient>
        </ViewShot>

        {/* Action Controls */}
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
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 40,
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
    borderRadius: 24,
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  cardGradient: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 24,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  miniArtwork: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#1e293b",
  },
  songInfo: {
    flex: 1,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  cardArtist: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 2,
  },
  lyricsBody: {
    marginVertical: 16,
  },
  lyricLine: {
    color: "#f8fafc",
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 30,
    letterSpacing: -0.2,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 14,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  brandText: {
    color: "#4ade80",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  tagline: {
    color: "#64748b",
    fontSize: 10,
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
