# Daze

### A Modern, High-Performance Music Streaming App

[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat&logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?style=flat&logo=expo&logoColor=white)](https://expo.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Android-3DDC84?style=flat&logo=android&logoColor=white)](https://www.android.com/)

**Experience music streaming reimagined with cutting-edge technology and thoughtful design.**

---

### 📌 Table of Contents

- [⬇ Download](#-download)
- [✨ Features](#-features)
- [🖼 Screenshots](#-screenshots)
- [⚡ Quick Start](#-quick-start)
- [🛠 Troubleshooting](#-troubleshooting)
- [⚖ Legal Notice](#-legal-notice)

---

## ⬇ Download

**Current Version:** `v1.0.0`

Choose the build that matches your device architecture.

| Build Variant   | Device Compatibility             | Download                                                                                                                                                                                                         |
| --------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **arm64-v8a**   | Modern Android devices (2015+)   | [![Download arm64-v8a](https://img.shields.io/badge/Download-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/coderjay21/daze/releases/latest/download/app-arm64-v8a-release.apk)     |
| **armeabi-v7a** | Older Android devices (pre-2015) | [![Download armeabi-v7a](https://img.shields.io/badge/Download-5C6BC0?style=for-the-badge&logo=android&logoColor=white)](https://github.com/coderjay21/daze/releases/latest/download/app-armeabi-v7a-release.apk) |
| **x86_64**      | Emulators and x86-based devices  | [![Download x86_64](https://img.shields.io/badge/Download-0288D1?style=for-the-badge&logo=intel&logoColor=white)](https://github.com/coderjay21/daze/releases/latest/download/app-x86_64-release.apk)             |
| **x86**         | Legacy emulators                 | [![Download x86](https://img.shields.io/badge/Download-607D8B?style=for-the-badge&logo=intel&logoColor=white)](https://github.com/coderjay21/daze/releases/latest/download/app-x86-release.apk)                   |
| **Universal**   | All Devices (All-in-One APK)     | [![Download Universal](https://img.shields.io/badge/Download_Universal-007ACC?style=for-the-badge&logo=android&logoColor=white)](https://github.com/coderjay21/daze/releases/latest)                               |

> **Quick Guide:** Download `arm64-v8a` first. If it installs successfully, you have the most optimized build. If installation fails, try `armeabi-v7a` or use the Universal build.

---

### Why Daze?

- 🏎️ **Powered by `react-native-nitro-player`** – High-performance native playback engine & native queue management
- 🏗️ **Production-Ready Architecture** – Direct native state bindings for minimal latency and zero state duplication
- ⚡ **Blazing Fast** – MMKV storage, native download manager, and fast stream URL resolution
- 🎨 **Beautiful UI/UX** – Dynamic artwork-based theming and smooth micro-animations
- 🔊 **Professional Playback** – Background audio, Android Auto/CarPlay support, gapless playback, and notification controls
- 🧪 **Modern Stack** – React 19, Expo SDK 54, React Native 0.81

---

## ✨ Features

<table>
  <tr>
    <td width="50%">
      
### 🎧 **Audio Experience**
      
- Native engine powered by `react-native-nitro-player`
- Low-latency queue management directly in native layer
- Background audio playback with foreground service
- Android Auto, CarPlay, lock-screen & notification controls
- Gapless playback & native `DownloadManager` support
- Full playback controls (seek, skip, repeat mode)
- Automatic audio focus handling
      
    </td>
    <td width="50%">
      
### 🔍 **Discovery & Search**
      
- Powerful search across songs, albums, artists, playlists
- Voice search with on-device speech recognition
- Curated home feed with personalized content
- Trending charts and new releases
- Genre-based browsing
- Smart recommendations
      
    </td>
  </tr>
  <tr>
    <td width="50%">
      
### 📚 **Library Management**
      
- Favorites and collections
- Listening history tracking
- Offline downloads support
- Custom playlist creation
- Recently played quick access
- Library sync and backup
      
    </td>
    <td width="50%">
      
### 🎨 **UI & Design**
      
- Dynamic color theming from album artwork
- Mini-player with gesture controls
- Immersive full-screen player
- Smooth transitions and animations
- Tablet-optimized layouts
- Dark mode support
- Global snackbar feedback system
      
    </td>
  </tr>
</table>

---

## 📱 Screenshots

### Core Experience

<table>
  <tr>
    <td align="center" width="33%">
      <img src="assets/images/screenshots/home.png" alt="Home Screen" width="250"/>
      <br/>
      <b>Home Feed</b>
      <br/>
      <sub>Trending content and suggestions</sub>
    </td>
    <td align="center" width="33%">
      <img src="assets/images/screenshots/full-player.png" alt="Full Player" width="250"/>
      <br/>
      <b>Full Player</b>
      <br/>
      <sub>Immersive playback experience</sub>
    </td>
    <td align="center" width="33%">
      <img src="assets/images/screenshots/downloads.png" alt="Downloads" width="250"/>
      <br/>
      <b>Downloads</b>
      <br/>
      <sub>Offline content management</sub>
    </td>
  </tr>
</table>

### Search & Discovery

<table>
  <tr>
    <td align="center" width="33%">
      <img src="assets/images/screenshots/search-interface.png" alt="Search" width="250"/>
      <br/>
      <b>Search Interface</b>
      <br/>
      <sub>Full text search over categories</sub>
    </td>
    <td align="center" width="33%">
      <img src="assets/images/screenshots/search-results.png" alt="Search Results" width="250"/>
      <br/>
      <b>Search Results</b>
      <br/>
      <sub>Categorized results with quick filters</sub>
    </td>
    <td align="center" width="33%">
      <img src="assets/images/screenshots/search-voice.png" alt="Voice Search" width="250"/>
      <br/>
      <b>Voice Search</b>
      <br/>
      <sub>On-Device Voice Search</sub>
    </td>
  </tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

| Requirement                 | Version          | Download                                                          |
| --------------------------- | ---------------- | ----------------------------------------------------------------- |
| **Node.js**                 | 20.x or higher   | [nodejs.org](https://nodejs.org/)                                 |
| **Java JDK**                | 17 (recommended) | [Oracle JDK](https://www.oracle.com/java/technologies/downloads/) |
| **Android SDK**             | Latest           | Via Android Studio                                                |
| **Android Device/Emulator** | API 24+          | [Android Studio](https://developer.android.com/studio)            |

> **⚠️ Important Notice**
>
> This project uses native modules and cannot run in **Expo Go**. You must build and run a **development client**.

### Installation

1. **Clone the repository**

```bash
git clone [https://github.com/coderjay21/daze.git](https://github.com/coderjay21/daze.git)
cd daze
