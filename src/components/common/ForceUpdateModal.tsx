import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  BackHandler,
} from "react-native";
import Constants from "expo-constants";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Apne remote config / GitHub raw JSON endpoint ka URL yahan do
const REMOTE_VERSION_URL = "https://raw.githubusercontent.com/coderjay21/daze/main/version.json";

interface RemoteVersionData {
  latestVersion: string;
  minSupportedVersion: string;
  downloadUrl: string;
  releaseNotes?: string;
}

export function ForceUpdateModal() {
  const [updateRequired, setUpdateRequired] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");

  const currentVersion = Constants.expoConfig?.version || "1.0.0";

  useEffect(() => {
    async function checkVersion() {
      try {
        const res = await fetch(`${REMOTE_VERSION_URL}?t=${Date.now()}`);
        if (!res.ok) return;

        const data: RemoteVersionData = await res.json();
        
        // Simple semantic version compare
        if (isVersionOutdated(currentVersion, data.minSupportedVersion)) {
          setDownloadUrl(data.downloadUrl);
          setReleaseNotes(data.releaseNotes || "Performance enhancements & new features.");
          setUpdateRequired(true);
        }
      } catch (err) {
        console.warn("[ForceUpdate] Version check error:", err);
      }
    }

    void checkVersion();
  }, [currentVersion]);

  // Android hardware back button disable for force update
  useEffect(() => {
    if (!updateRequired) return;
    const backAction = () => true; // Prevent going back / closing app modal
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [updateRequired]);

  const handleUpdate = () => {
    if (downloadUrl) {
      void Linking.openURL(downloadUrl);
    }
  };

  if (!updateRequired) return null;

  return (
    <Modal visible={updateRequired} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="rocket-launch" size={32} color="#1DB954" />
          </View>

          <Text style={styles.title}>Update Required</Text>
          <Text style={styles.subtitle}>
            A new version of Daze is available. Please update to continue listening.
          </Text>

          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>What's New:</Text>
            <Text style={styles.notesBody}>{releaseNotes}</Text>
          </View>

          <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
            <Text style={styles.updateButtonText}>Update Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function isVersionOutdated(current: string, required: string): boolean {
  const cParts = current.split(".").map(Number);
  const rParts = required.split(".").map(Number);

  for (let i = 0; i < Math.max(cParts.length, rParts.length); i++) {
    const c = cParts[i] || 0;
    const r = rParts[i] || 0;
    if (c < r) return true;
    if (c > r) return false;
  }
  return false;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.88)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#181818",
    width: "100%",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#282828",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(29, 185, 84, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  notesBox: {
    width: "100%",
    backgroundColor: "#202020",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#cbd5e1",
    marginBottom: 4,
  },
  notesBody: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 16,
  },
  updateButton: {
    backgroundColor: "#1DB954",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
  },
  updateButtonText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 15,
  },
});
