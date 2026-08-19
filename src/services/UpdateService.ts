import { STORAGE_KEYS } from "@/constants";
import { appStorage } from "@/stores/storage";
import { useUpdateStore } from "@/stores/updateStore";
import * as Application from "expo-application";
import * as Device from "expo-device";
import * as IntentLauncher from "expo-intent-launcher";
import { NativeModules, Platform } from "react-native";
import RNFetchBlob from "react-native-blob-util";

const GITHUB_REPO_API = "https://api.github.com/repos/coderjay21/daze/releases/latest";

const ARCH_APK_MAP: Record<string, string> = {
  "arm64-v8a": "app-arm64-v8a-release.apk",
  "armeabi-v7a": "app-armeabi-v7a-release.apk",
  x86: "app-x86-release.apk",
  x86_64: "app-x86_64-release.apk",
};

function isNewerVersion(latest: string, current: string) {
  const l = latest.split(".").map(Number);
  const c = current.split(".").map(Number);

  for (let i = 0; i < Math.max(l.length, c.length); i++) {
    if ((l[i] || 0) > (c[i] || 0)) return true;
    if ((l[i] || 0) < (c[i] || 0)) return false;
  }
  return false;
}

class UpdateService {
  async checkOnLaunch(): Promise<void> {
    if (Platform.OS !== "android") return;

    try {
      const res = await fetch(GITHUB_REPO_API, {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "Daze-App",
        },
      });

      if (!res.ok) return;

      const data = await res.json();
      if (!data.tag_name || !data.assets) return;

      const latestVersion = data.tag_name.replace(/^v/, "");
      const currentVersion = this.getCurrentVersion();
      const arch = this.getDeviceArchitecture();

      const targetApkName = ARCH_APK_MAP[arch] ?? "app-arm64-v8a-release.apk";
      // Agar specific arch APK na mile toh pehla milne wala APK asset use karega
      const apk =
        data.assets.find((a: any) => a.name === targetApkName) ??
        data.assets.find((a: any) => a.name.endsWith(".apk"));

      if (!apk) return;

      const updateAvailable = isNewerVersion(latestVersion, currentVersion);
      if (!updateAvailable) return;

      useUpdateStore.getState().setUpdateAvailable({
        latestVersion,
        apkUrl: apk.browser_download_url,
        releaseName: data.name ?? `Daze v${latestVersion}`,
        releaseUrl: data.html_url,
        forceUpdate: false,
      });
    } catch (e) {
      console.error("Update check failed:", e);
    }
  }

  async startDownloadAndInstall(): Promise<void> {
    if (Platform.OS !== "android") return;

    const hasPermission = await this.checkInstallPermission();
    if (!hasPermission) {
      await this.requestInstallPermission();
      return;
    }

    const apkPath = await this.downloadApk();
    if (apkPath) {
      await this.installApk(apkPath);
    }
  }

  private async checkInstallPermission(): Promise<boolean> {
    return await Device.isSideLoadingEnabledAsync();
  }

  private async requestInstallPermission(): Promise<void> {
    const updateStore = useUpdateStore.getState();
    updateStore.setPrompt("install-permission");
    updateStore.setError(null);
    updateStore.setDownloadState("idle");
    updateStore.openUpdateDialog();
  }

  async openInstallPermissionSettings(): Promise<void> {
    const packageName = Application.applicationId;
    try {
      await IntentLauncher.startActivityAsync(
        "android.settings.MANAGE_UNKNOWN_APP_SOURCES",
        { data: `package:${packageName}` }
      );
    } catch (error) {
      console.error("Settings open failed:", error);
    }
  }

  private async downloadApk(): Promise<string | null> {
    const { apkUrl } = useUpdateStore.getState();
    if (!apkUrl) return null;

    const updateStore = useUpdateStore.getState();
    updateStore.setError(null);
    updateStore.setProgress(0);
    updateStore.setDownloadState("downloading");

    try {
      const { config, fs } = RNFetchBlob;
      const path = `${fs.dirs.DownloadDir}/daze-update.apk`;

      const task = config({
        fileCache: true,
        path,
      }).fetch("GET", apkUrl);

      task.progress((received, total) => {
        const receivedBytes = Number(received);
        const totalBytes = Number(total);
        if (Number.isFinite(totalBytes) && totalBytes > 0) {
          updateStore.setProgress(Math.min(1, receivedBytes / totalBytes));
        }
      });

      const res = await task;
      const apkPath = res.path();

      updateStore.setProgress(1);
      updateStore.setDownloadState("installing");
      await appStorage.setItem(STORAGE_KEYS.UPDATE_APK_URI, apkPath);

      return apkPath;
    } catch (err) {
      console.error("Update failed:", err);
      updateStore.setDownloadState("download-failed");
      updateStore.setError("Could not download update.");
      updateStore.setPrompt("none");
      updateStore.openUpdateDialog();
      return null;
    }
  }

  private async installApk(apkPath: string): Promise<void> {
    try {
      await RNFetchBlob.android.actionViewIntent(
        apkPath,
        "application/vnd.android.package-archive"
      );
      useUpdateStore.getState().completeFlow();
    } catch (err) {
      console.error("Install failed:", err);
      await this.requestInstallPermission();
    }
  }

  getCurrentVersion(): string {
    return (
      Application.nativeApplicationVersion ??
      Application.nativeBuildVersion ??
      "1.0.0"
    );
  }

  getDeviceArchitecture(): string {
    const platformConstants = Platform.constants as
      | { SupportedAbis?: string[] }
      | undefined;
    const nativeSupportedAbis = (
      NativeModules.PlatformConstants as
      | { SupportedAbis?: string[] }
      | undefined
    )?.SupportedAbis;

    const supportedAbis =
      platformConstants?.SupportedAbis ?? nativeSupportedAbis ?? [];

    return supportedAbis[0] ?? "arm64-v8a";
  }
}

export const updateService = new UpdateService();
