import React from "react";
import {
  Alert,
  Image,
  Linking,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { IconButton, Text } from "react-native-paper";

interface SupportDazeModalProps {
  visible: boolean;
  onClose: () => void;
}

const UPI_ID = "jayagarwal.code@okicici";
const PAYEE_NAME = "Daze - Live in music";
const NOTE = "Server Upkeep & Support Daze";

export default function SupportDazeModal({
  visible,
  onClose,
}: SupportDazeModalProps) {
  const handlePayViaUPI = async (amount?: number) => {
    let upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(
      PAYEE_NAME,
    )}&cu=INR`;

    if (amount) {
      upiUrl += `&am=${amount}&tn=${encodeURIComponent(NOTE)}`;
    } else {
      upiUrl += `&tn=${encodeURIComponent(NOTE)}`;
    }

    try {
      const canOpen = await Linking.canOpenURL(upiUrl);
      if (canOpen) {
        await Linking.openURL(upiUrl);
      } else {
        // Fallback open attempt
        await Linking.openURL(upiUrl);
      }
    } catch (error) {
      Alert.alert(
        "UPI App Not Found",
        "Could not open UPI app directly. Please scan the QR code above using GPay, PhonePe, or Paytm.",
      );
    }
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    `upi://pay?pa=${UPI_ID}&pn=${PAYEE_NAME}&cu=INR`,
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
            Daze is free & ad-free. Help us keep the streaming servers alive and running beyond 31st August!
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
          <Text style={styles.subText}>Quick Pay with Preset Amount:</Text>
          <View style={styles.buttonRow}>
            {[29, 49, 99].map((amt) => (
              <TouchableOpacity
                key={amt}
                style={styles.amtBtn}
                activeOpacity={0.7}
                onPress={() => handlePayViaUPI(amt)}
              >
                <Text style={styles.amtText}>₹{amt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Amount UPI Direct Button */}
          <TouchableOpacity
            style={styles.directPayBtn}
            activeOpacity={0.8}
            onPress={() => handlePayViaUPI()}
          >
            <Text style={styles.directPayText}>
              Pay Custom via Any UPI App
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#18181b",
    borderRadius: 24,
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
    marginBottom: 6,
  },
  headerTitle: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 18,
  },
  desc: {
    color: "#a1a1aa",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  qrContainer: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 16,
    marginBottom: 14,
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
    marginBottom: 8,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  amtBtn: {
    flex: 1,
    backgroundColor: "#27272a",
    paddingVertical: 10,
    borderRadius: 10,
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
