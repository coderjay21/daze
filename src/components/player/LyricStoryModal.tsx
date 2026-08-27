import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as IntentLauncher from "expo-intent-launcher";
import * as FileSystem from "expo-file-system";
import QRCode from "react-native-qrcode-svg";

interface LyricStoryModalProps {
  visible: boolean;
  onClose: () => void;
  songTitle: string;
  artistName: string;
  artworkUrl?: string;
  generatedVisualUrl: string;
  selectedLyrics: string[];
  onRegenerate: () => void;
  isGeneratingArt?: boolean;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.88;
const CARD_HEIGHT = CARD_WIDTH * 1.72; // 9:16 Instagram Story Ratio

export const LyricStoryModal: React.FC<LyricStoryModalProps> = ({
  visible,
  onClose,
  songTitle,
  artistName,
  artworkUrl,
  generatedVisualUrl,
  selectedLyrics,
  onRegenerate,
  isGeneratingArt = false,
}) => {
  const viewShotRef = useRef<any>(null);
  const [sharing, setSharing] = useState(false);

  const handleShareStory = async () => {
    try {
      setSharing(true);
      if (!viewShotRef.current) return;

      const uri = await viewShotRef.current.capture();

      // 📸 Direct Native Instagram Story Intent (Android)
      if (Platform.OS === "android") {
        try {
          const contentUri = await FileSystem.getContentUriAsync(uri);
          await IntentLauncher.startActivityAsync(
            "com.instagram.share.ADD_TO_STORY",
            {
              type: "image/*",
              data: contentUri,
              flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
              extra: {
                interactive_asset_uri: contentUri,
                top_background_color: "#18181b",
                bottom_background_color: "#000000",
              },
            }
          );
          return;
        } catch {
          // Fallback to standard share sheet agar Instagram installed na ho ya direct intent block ho
          await Sharing.shareAsync(uri, {
            mimeType: "image/png",
            dialogTitle: "Share to Instagram Story",
            UTI: "public.png",
          });
          return;
        }
      }

      // iOS fallback
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Share to Instagram Story",
        UTI: "public.png",
      });
    } catch (e) {
      console.warn("Story Share Error:", e);
    } finally {
      setSharing(false);
    }
  };

  const shareTargetUrl = `https://daze.jayagarwal.online/track?title=${encodeURIComponent(
    songTitle
  )}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <MaterialCommunityIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Aesthetic Story Card</Text>
          <TouchableOpacity
            onPress={onRegenerate}
            style={styles.iconBtn}
            disabled={isGeneratingArt}
          >
            {isGeneratingArt ? (
              <ActivityIndicator size="small" color="#4ade80" />
            ) : (
              <MaterialCommunityIcons name="refresh" size={22} color="#4ade80" />
            )}
          </TouchableOpacity>
        </View>

        {/* 📸 Capturable Story Card (9:16 Canvas) */}
        <ViewShot
          ref={viewShotRef}
          options={{ format: "png", quality: 1.0 }}
          style={styles.cardWrapper}
        >
          <LinearGradient
            colors={["#18181b", "#09090b", "#000000"]}
            style={styles.cardGradient}
          >
            {/* Ambient Blurred Background */}
            {artworkUrl && (
              <Image
                source={{ uri: artworkUrl }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                blurRadius={65}
                opacity={0.3}
              />
            )}

            {/* Cinematic Top Badge */}
            <View style={styles.topBadgeRow}>
              <Text style={styles.badgeText}>✦ DAZE CINEMATIC MEMORY ✦</Text>
            </View>

            {/* Dynamic AI Aesthetic Illustration */}
            <View style={styles.visualContainer}>
              <Image
                source={{ uri: generatedVisualUrl || artworkUrl }}
                style={styles.visualImage}
                contentFit="cover"
                transition={400}
              />
              {isGeneratingArt && (
                <View style={styles.visualLoadingOverlay}>
                  <ActivityIndicator color="#4ade80" size="small" />
                  <Text style={styles.loadingText}>Crafting Vibe Art...</Text>
                </View>
              )}
            </View>

            {/* Song Details + Mini Cover */}
            <View style={styles.metaRow}>
              <Image
                source={{ uri: artworkUrl }}
                style={styles.miniCover}
                contentFit="cover"
              />
              <View style={styles.metaTextContainer}>
                <Text style={styles.songTitle} numberOfLines={1}>
                  {songTitle.toUpperCase()}
                </Text>
                <Text style={styles.artistName} numberOfLines={1}>
                  {artistName}
                </Text>
              </View>
            </View>

            {/* Poetic Lyrics Block */}
            <View style={styles.lyricsContainer}>
              <Text style={styles.quoteMark}>“</Text>
              {selectedLyrics.map((line, idx) => (
                <Text key={idx} style={styles.lyricLine}>
                  {line}
                </Text>
              ))}
              <Text style={styles.quoteMarkClose}>”</Text>
            </View>

            {/* Footer with Daze Branding + QR Code */}
            <View style={styles.footerRow}>
              <View style={styles.brandInfo}>
                <View style={styles.brandTitleRow}>
                  <MaterialCommunityIcons name="lightning-bolt" size={15} color="#4ade80" />
                  <Text style={styles.brandName}>DAZE MUSIC</Text>
                </View>
                <Text style={styles.brandSub}>Lossless • Pure Sound</Text>
                <Text style={styles.brandUrl}>daze.jayagarwal.online</Text>
              </View>

              {/* Dynamic QR Code for Scan-to-Listen */}
              <View style={styles.qrWrapper}>
                <QRCode
                  value={shareTargetUrl}
                  size={46}
                  color="#ffffff"
                  backgroundColor="transparent"
                />
                <Text style={styles.qrLabel}>Scan to Play</Text>
              </View>
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
    paddingVertical: 24,
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
    padding: 20,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 28,
  },
  topBadgeRow: {
    alignItems: "center",
  },
  badgeText: {
    color: "#4ade80",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
  },
  visualContainer: {
    width: "100%",
    height: CARD_WIDTH * 0.76,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    position: "relative",
  },
  visualImage: {
    width: "100%",
    height: "100%",
  },
  visualLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: "#4ade80",
    fontSize: 11,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  miniCover: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#27272a",
  },
  metaTextContainer: {
    flex: 1,
  },
  songTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  artistName: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  lyricsContainer: {
    paddingHorizontal: 10,
    marginVertical: 4,
  },
  quoteMark: {
    color: "rgba(74, 222, 128, 0.45)",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 18,
    marginBottom: -6,
  },
  quoteMarkClose: {
    color: "rgba(74, 222, 128, 0.45)",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "right",
    lineHeight: 14,
    marginTop: -6,
  },
  lyricLine: {
    color: "#f4f4f5",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "center",
    fontStyle: "italic",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    paddingTop: 12,
  },
  brandInfo: {
    flex: 1,
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  brandName: {
    color: "#4ade80",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  brandSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  brandUrl: {
    color: "#71717a",
    fontSize: 9,
    fontWeight: "500",
    marginTop: 1,
  },
  qrWrapper: {
    alignItems: "center",
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  qrLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 8,
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: 0.2,
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
  },
  btnShareText: {
    color: "#031407",
    fontWeight: "700",
    fontSize: 15,
  },
});
