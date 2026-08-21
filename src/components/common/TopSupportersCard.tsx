import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ProgressBar, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Supporter {
  name: string;
  amount: number;
  badge: string;
  message?: string;
}

interface CampaignData {
  current: number;
  goal: number;
  month: string;
  supporters: Supporter[];
}

const DEFAULT_DATA: CampaignData = {
  month: "August 2026",
  current: 150,
  goal: 500,
  supporters: [
    { name: "Chaitanya", amount: 100, badge: "👑 Top Fan", message: "Keep it up bro!" },
    { name: "Aman S.", amount: 30, badge: "⭐ VIP" },
    { name: "Nikhil", amount: 20, badge: "☕ Chai Sponsor" },
  ],
};

interface Props {
  onOpenDonateModal: () => void;
}

export default function TopSupportersCard({ onOpenDonateModal }: Props) {
  const [data, setData] = useState<CampaignData>(DEFAULT_DATA);

  useEffect(() => {
    // Optionally fetch dynamic JSON from GitHub Raw URL if configured
    // fetch("https://raw.githubusercontent.com/.../supporters.json").then(...)
  }, []);

  const progress = Math.min(data.current / data.goal, 1);
  const percentage = Math.round(progress * 100);

  return (
    <View style={styles.card}>
      {/* Header & Goal */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons name="heart-flash" size={20} color="#22c55e" />
          <Text style={styles.title}>Server Goal • {data.month}</Text>
        </View>
        <Text style={styles.amountText}>
          ₹{data.current} <Text style={styles.goalText}>/ ₹{data.goal}</Text>
        </Text>
      </View>

      <ProgressBar
        progress={progress}
        color="#22c55e"
        style={styles.progressBar}
      />

      <View style={styles.progressSubtextRow}>
        <Text style={styles.progressPercent}>{percentage}% funded</Text>
        <Text style={styles.subtleNote}>Keeps Daze 100% Ad-Free</Text>
      </View>

      {/* Wall of Fame List */}
      <View style={styles.supportersList}>
        <Text style={styles.wallTitle}>🏆 Wall of Fame</Text>
        {data.supporters.map((item, idx) => (
          <View key={idx} style={styles.supporterItem}>
            <View style={styles.supporterLeft}>
              <Text style={styles.supporterRank}>#{idx + 1}</Text>
              <Text style={styles.supporterName}>{item.name}</Text>
              <Text style={styles.supporterBadge}>{item.badge}</Text>
            </View>
            <Text style={styles.supporterAmount}>₹{item.amount}</Text>
          </View>
        ))}
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={styles.donateButton}
        onPress={onOpenDonateModal}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="lightning-bolt" size={16} color="#031407" />
        <Text style={styles.donateButtonText}>Join Wall of Fame (From ₹10)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1e1e1e",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#2e2e2e",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  amountText: {
    color: "#22c55e",
    fontWeight: "800",
    fontSize: 14,
  },
  goalText: {
    color: "#71717a",
    fontWeight: "500",
    fontSize: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#2a2a2a",
  },
  progressSubtextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 14,
  },
  progressPercent: {
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "600",
  },
  subtleNote: {
    color: "#71717a",
    fontSize: 11,
  },
  supportersList: {
    backgroundColor: "#161616",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  wallTitle: {
    color: "#e4e4e7",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  supporterItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  supporterLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  supporterRank: {
    color: "#eab308",
    fontWeight: "800",
    fontSize: 12,
    width: 20,
  },
  supporterName: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 13,
  },
  supporterBadge: {
    fontSize: 10,
    backgroundColor: "#27272a",
    color: "#22c55e",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: "600",
  },
  supporterAmount: {
    color: "#22c55e",
    fontWeight: "700",
    fontSize: 13,
  },
  donateButton: {
    backgroundColor: "#22c55e",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  donateButtonText: {
    color: "#031407",
    fontWeight: "700",
    fontSize: 13,
  },
});
