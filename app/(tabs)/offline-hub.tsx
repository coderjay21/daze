import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useOfflineHubStore } from "@/stores/offlineHubStore";
import { OfflineHubService } from "@/services/OfflineHubService";
import { playerService } from "@/services/PlayerService";

const QUOTA_OPTIONS = [250, 500, 1000];

export default function OfflineHubScreen() {
  const hasConfigured = useOfflineHubStore((s) => s.hasConfigured);
  const maxQuotaMB = useOfflineHubStore((s) => s.maxQuotaMB) || 500;
  const cachedTracks = useOfflineHubStore((s) => s.cachedTracks) || [];
  const activeMood = useOfflineHubStore((s) => s.activeMood) || "sad";
  const setQuota = useOfflineHubStore((s) => s.setQuota);
  const setHasConfigured = useOfflineHubStore((s) => s.setHasConfigured);
  const setActiveMood = useOfflineHubStore((s) => s.setActiveMood);
  const togglePinTrack = useOfflineHubStore((s) => s.togglePinTrack);
  const getTotalUsedBytes = useOfflineHubStore((s) => s.getTotalUsedBytes);

  const [settingsModalOpen, setSettingsModalOpen] = useState(!hasConfigured);
  
  // Pull-to-Refresh State
  const [refreshing, setRefreshing] = useState(false);

  const usedBytes = typeof getTotalUsedBytes === "function" ? getTotalUsedBytes() : 0;
  const usedMB = (usedBytes / (1024 * 1024)).toFixed(1);
  const usedPercent = Math.min(100, (Number(usedMB) / maxQuotaMB) * 100);

  const filteredTracks = cachedTracks.filter((t) =>
    activeMood ? t?.mood === activeMood : true
  );

  // Manual Refresh Handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Zustand apne aap list update rakhta hai, but ye manual trigger feel dega
    setTimeout(() => {
      setRefreshing(false);
    }, 1200);
  }, []);

  const handleSelectQuota = (mb: number) => {
    setQuota(mb);
    setHasConfigured(true);
    setSettingsModalOpen(false);
  };

  const playHubTrack = (track: any) => {
    if (!track?.localUri) return;
    void playerService.playTrack({
      id: track.id,
      title: track.title,
      artist: track.artist,
      artwork: track.artwork,
      url: track.localUri,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Offline Hub ⚡</Text>
          <Text style={styles.headerSubtitle}>
            Smart Auto-Vault • {cachedTracks.length} tracks cached
          </Text>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => setSettingsModalOpen(true)}
        >
          <MaterialCommunityIcons name="cog" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.storageCard}>
        <View style={styles.storageRow}>
          <Text style={styles.storageLabel}>Vault Allocation</Text>
          <Text style={styles.storageValue}>
            {usedMB} MB / {maxQuotaMB} MB
          </Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${usedPercent}%` }]} />
        </View>
      </View>

      <View style={styles.moodContainer}>
        {(["sad", "romantic", "chill", "upbeat"] as const).map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.moodChip, activeMood === m && styles.moodChipActive]}
            onPress={() => setActiveMood(m)}
          >
            <Text
              style={[
                styles.moodChipText,
                activeMood === m && styles.moodChipTextActive,
              ]}
            >
              {m === "sad"
                ? "💔 Sad"
                : m === "romantic"
                ? "❤️ Romantic"
                : m === "chill"
                ? "☕ Chill"
                : "⚡ Upbeat"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTracks}
        keyExtractor={(item) => item?.id || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        
        // PULL TO REFRESH LOGIC
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1DB954"
            colors={["#1DB954"]}
          />
        }
        
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="cloud-sync" size={48} color="#404040" />
            <Text style={styles.emptyTitle}>Vault is filling up</Text>
            <Text style={styles.emptyDesc}>
              Listen to songs online. Daze will auto-cache your favorite {activeMood} tracks up to {maxQuotaMB}MB! (Swipe down to refresh)
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.trackRow}
            onPress={() => playHubTrack(item)}
          >
            <Image
              source={{ uri: item.artwork || "https://daze.jayagarwal.online/assets/logo.png" }}
              style={styles.artwork}
            />
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.trackArtist} numberOfLines={1}>
                {item.artist} • {((item.fileSizeBytes || 0) / (1024 * 1024)).toFixed(1)}MB
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => togglePinTrack(item.id)}
              style={styles.actionBtn}
            >
              <MaterialCommunityIcons
                name={item.isPinned ? "pin" : "pin-outline"}
                size={20}
                color={item.isPinned ? "#1DB954" : "#888"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => void OfflineHubService.removeTrack(item.id)}
              style={styles.actionBtn}
            >
              <MaterialCommunityIcons name="close" size={20} color="#888" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      <Modal visible={settingsModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Smart Vault Storage</Text>
            <Text style={styles.modalDesc}>
              Choose how much offline storage Daze can use to auto-save songs based on your taste:
            </Text>

            <View style={styles.quotaRow}>
              {QUOTA_OPTIONS.map((mb) => (
                <TouchableOpacity
                  key={mb}
                  style={[
                    styles.quotaOption,
                    maxQuotaMB === mb && styles.quotaOptionSelected,
                  ]}
                  onPress={() => handleSelectQuota(mb)}
                >
                  <Text
                    style={[
                      styles.quotaText,
                      maxQuotaMB === mb && styles.quotaTextSelected,
                    ]}
                  >
                    {mb >= 1000 ? "1 GB" : `${mb} MB`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {hasConfigured && (
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSettingsModalOpen(false)}
              >
                <Text style={styles.modalCloseText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "800" },
  headerSubtitle: { color: "#94a3b8", fontSize: 13, marginTop: 2 },
  settingsBtn: {
    backgroundColor: "#282828",
    padding: 8,
    borderRadius: 50,
  },
  storageCard: {
    backgroundColor: "#1e1e1e",
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
  },
  storageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  storageLabel: { color: "#b3b3b3", fontSize: 12, fontWeight: "600" },
  storageValue: { color: "#1DB954", fontSize: 12, fontWeight: "700" },
  progressBarBackground: {
    height: 6,
    backgroundColor: "#2e2e2e",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#1DB954",
    borderRadius: 3,
  },
  moodContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  moodChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#1e1e1e",
    borderWidth: 1,
    borderColor: "#333",
  },
  moodChipActive: {
    backgroundColor: "rgba(29, 185, 84, 0.15)",
    borderColor: "#1DB954",
  },
  moodChipText: { color: "#888", fontSize: 12, fontWeight: "600" },
  moodChipTextActive: { color: "#1DB954" },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#181818",
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  artwork: { width: 44, height: 44, borderRadius: 6 },
  trackInfo: { flex: 1, marginLeft: 12 },
  trackTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  trackArtist: { color: "#888", fontSize: 12, marginTop: 2 },
  actionBtn: { padding: 8 },
  emptyState: { alignItems: "center", justifyContent: "center", marginTop: 60 },
  emptyTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 12 },
  emptyDesc: {
    color: "#666",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#1a1a1a",
    width: "100%",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
  },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 6 },
  modalDesc: {
    color: "#999",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  quotaRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  quotaOption: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: "#242424",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  quotaOptionSelected: {
    borderColor: "#1DB954",
    backgroundColor: "rgba(29, 185, 84, 0.15)",
  },
  quotaText: { color: "#fff", fontWeight: "700" },
  quotaTextSelected: { color: "#1DB954" },
  modalCloseBtn: {
    backgroundColor: "#1DB954",
    paddingVertical: 12,
    width: "100%",
    borderRadius: 25,
    alignItems: "center",
  },
  modalCloseText: { color: "#000", fontWeight: "700", fontSize: 14 },
});
