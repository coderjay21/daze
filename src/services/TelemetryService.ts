import { appStorage } from "@/stores/storage";
import * as Application from "expo-application";
import * as Device from "expo-device";

// Step 1 se copy kiya hua URL yahan paste karein
const GOOGLE_SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzirFESZ-qPIy_N-R5MsHkYLOu-FGcRfAI3wdtkPMXhqc0P-V2rM-XyGkK3BIqcePPj/exec";

const DEVICE_ID_KEY = "daze_unique_device_id";

export async function syncDeviceTelemetry() {
  try {
    // 1. Get or create persistent unique device ID
    let deviceId = await appStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      const androidId = Application.getAndroidId();
      deviceId =
        androidId ||
        `daze_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await appStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    // 2. City & Country lookup (Free Geolocation)
    let city = "Unknown";
    let country = "Unknown";
    try {
      const geoRes = await fetch("https://ipapi.co/json/");
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        city = geoData.city || "Unknown";
        country = geoData.country_name || "Unknown";
      }
    } catch (_) {}

    // 3. Prepare payload
    const payload = {
      device_id: deviceId,
      device_model: `${Device.manufacturer || ""} ${Device.modelName || ""}`.trim() || "Unknown Device",
      os_version: `Android ${Device.osVersion || ""}`,
      app_version: Application.nativeApplicationVersion || "1.0.9",
      city,
      country,
    };

    // 4. Send background POST request to Google Sheet
    await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // Silent fail so app never crashes if offline
  }
}
