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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useOfflineHubStore } from "@/stores/offlineHubStore";
import { OfflineHubService } from "@/services/OfflineHubService";
import { playerService } from "@/services/PlayerService";
import * as FileSystem from "expo-file-system";

const QUOTA_OPTIONS = [250, 500, 1000];

export default function OfflineHubScreen() {
  const hasConfigured = useOfflineHubStore((s) => s.hasConfigured);
  const maxQuotaMB = useOfflineHubStore((s) => s.maxQuotaMB) || 500;
  const cachedTracks = useOfflineHubStore((s) => s.cachedTracks) || [];
  const activeMood = useOfflineHubStore((s) => s.activeMood) || "all";
  const setQuota = useOfflineHubStore((s) => s.setQuota);
  const setHasConfigured = useOfflineHubStore((s) => s.setHasConfigured);
  const setActiveMood = useOfflineHubStore((s) => s.setActiveMood);
  const togglePinTrack = useOfflineHubStore((s) => s.togglePinTrack);
  const addTrackToHub = useOfflineHubStore((s) => s.addTrackToHub);

  const [settingsModalOpen, setSettingsModalOpen] = useState(!hasConfigured);
  const [refreshing, setRefreshing] = useState(false);
  const [testing, setTesting] = useState(false);

  const usedBytes = cachedTracks.reduce((acc, t) => acc + (Number(t?.fileSizeBytes) || 0), 0);
  const usedMB = (usedBytes / (1024 * 1024)).toFixed(1);
  const usedPercent = Math.min(100, (Number(usedMB) / maxQuotaMB) * 100);

  const filteredTracks = cachedTracks.filter((t) => {
    if (activeMood === "all") return true;
    return t?.mood === activeMood;
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  // 🔍 Direct Diagnostic Test Function
  const runDiagnosticTest = async () => {
    try {
      setTesting(true);
      const testDir = `${FileSystem.documentDirectory}offline_hub/`;
      const dirInfo = await FileSystem.getInfoAsync(testDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(testDir, { intermediates: true });
      }

      // Sample verified test audio URL
      const testAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
      const targetFile = `${testDir}test_track_1.mp3`;

      const res = await FileSystem.downloadAsync(testAudioUrl, targetFile);
      const fileInfo = await FileSystem.getInfoAsync(res.uri);

      if (fileInfo.exists) {
        addTrackToHub({
          id: "test_track_1",
          title: "Test Offline Song",
          artist: "System Diagnostics",
          artwork: "https://daze.jayagarwal.online/assets/logo.png",
          localUri: res.uri,
          fileSizeBytes: fileInfo.size || 4 * 1024 * 1024,
          mood: "sad",
          addedAt: Date.now(),
          playCount: 1,
          isPinned: false,
        });
        Alert.alert("Success! 🎉", "Test song downloaded and added to Hub UI!");
      } else {
        Alert.alert("Error", "File downloaded but not found on disk.");
      }
    } catch (err: any) {
      Alert.alert("Diagnostic Failed", err?.message || String(err));
    } finally {
      setTesting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Offline Hub ⚡</Text>
          <Text style={styles.headerSubtitle}>
            Smart Auto-Vault • {cachedTracks.length} total tracks
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.testBtn}
            onPress={runDiagnosticTest}
            disabled={testing}
          >
            <Text style={styles.testBtnText}>{testing ? "Testing..." : "⚡ Test"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => setSettingsModalOpen(true)}
          >
            <MaterialCommunityIcons name="cog" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
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
        {[
          { key: "all", label: "⚡ All Songs" },
          { key: "sad", label: "💔 Melancholy" },
          { key: "romantic", label: "❤️ Romantic" },
          { key: "chill", label: "☕ Chill" },
        ].map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[styles.moodChip, activeMood === m.key && styles.moodChipActive]}
            onPress={() => setActiveMood(m.key)}
          >
            <Text
              style={[
                styles.moodChipText,
                activeMood === m.key && styles.moodChipTextActive,
              ]}
            >
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTracks}
        keyExtractor={(item, index) => item?.id || index.toString()}
        contentContainerStyle={styles.listContent}
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
            <Text style={styles.emptyTitle}>No songs cached yet</Text>
            <Text style={styles.emptyDesc}>
              Tap the "⚡ Test" button at the top-right to verify caching, or play songs online!
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.trackRow}
            onPress={() =>
              void playerService.playTrack({
                id: item.id,
                title: item.title,
                artist: item.artist,
                artwork: item.artwork,
                url: item.localUri,
              })
            }
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
              Choose how much offline storage Daze can use to auto-save songs:
            </Text>

            <View style={styles.quotaRow}>
              {QUOTA_OPTIONS.map((mb) => (
                <TouchableOpacity
                  key={mb}
                  style={[
                    styles.quotaOption,
                    maxQuotaMB === mb && styles.quotaOptionSelected,
                  ]}
                  onPress={() => {
                    setQuota(mb);
                    setHasConfigured(true);
                    setSettingsModalOpen(false);
                  }}
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
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "800" },
  headerSubtitle: { color: "#94a3b8", fontSize: 13, marginTop: 2 },
  testBtn: {
    backgroundColor: "#1DB954",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  testBtnText: { color: "#000", fontWeight: "700", fontSize: 12 },
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
