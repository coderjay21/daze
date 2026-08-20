import React from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
} from "react-native";
import { Text, IconButton } from "react-native-paper";

interface SupportDazeModalProps {
  visible: boolean;
  onClose: () => void;
}

// UPI Details (Change if needed)
const UPI_ID = "jayagarwal.code@okicici";
const PAYEE_NAME = "Daze - Live in music";
const NOTE = "Server Upkeep & Support Daze";

export default function SupportDazeModal({
  visible,
  onClose,
}: SupportDazeModalProps) {
  const handlePayViaUPI = async (amount: number) => {
    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(
      PAYEE_NAME
    )}&tn=${encodeURIComponent(NOTE)}&am=${amount}&cu=INR`;

    const canOpen = await Linking.canOpenURL(upiUrl);
    if (canOpen) {
      await Linking.openURL(upiUrl);
    } else {
      // Fallback intent
      await Linking.openURL(`upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}`);
    }
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    `upi://pay?pa=${UPI_ID}&pn=${PAYEE_NAME}&cu=INR`
  )}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text variant="titleMedium" style={styles.headerTitle}>
              Support Daze 💚
            </Text>
            <IconButton
              icon="close"
              size={20}
              iconColor="#b3b3b3"
              onPress={onClose}
            />
          </View>

          <Text variant="bodyMedium" style={styles.desc}>
            Daze is free & ad-free. Help us keep the servers alive and running beyond 31st August!
          </Text>

          {/* QR Code */}
          <View style={styles.qrContainer}>
            <Image
              source={{ uri: qrImageUrl }}
              style={styles.qrImage}
              resizeMode="contain"
            />
            <Text style={styles.upiIdText}>UPI ID: {UPI_ID}</Text>
          </View>

          {/* Direct UPI Quick Pay Buttons */}
          <Text style={styles.subText}>Quick Pay with any UPI App:</Text>
          <View style={styles.buttonRow}>
            {[29, 49, 99].map((amt) => (
              <TouchableOpacity
                key={amt}
                style={styles.amtBtn}
                onPress={() => handlePayViaUPI(amt)}
              >
                <Text style={styles.amtText}>₹{amt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.directPayBtn}
            onPress={() => handlePayViaUPI(50)}
          >
            <Text style={styles.directPayText}>Pay via GPay / PhonePe / Paytm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#18181b",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 340,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
  desc: {
    color: "#a1a1aa",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  qrContainer: {
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  qrImage: {
    width: 140,
    height: 140,
  },
  upiIdText: {
    color: "#09090b",
    fontWeight: "700",
    fontSize: 12,
    marginTop: 6,
  },
  subText: {
    color: "#71717a",
    fontSize: 12,
    marginBottom: 10,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  amtBtn: {
    flex: 1,
    backgroundColor: "#27272a",
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  amtText: {
    color: "#22c55e",
    fontWeight: "700",
    fontSize: 14,
  },
  directPayBtn: {
    backgroundColor: "#22c55e",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  directPayText: {
    color: "#022c12",
    fontWeight: "700",
    fontSize: 14,
  },
});
