# 🧥 DormDrobe

**DormDrobe** is a smart capsule wardrobe and luggage tracking mobile app designed specifically for college students, dormers, and frequent travelers who split their clothing between **Home** and **Dorm**.

Never wonder *"Did I leave that hoodie at home or in my dorm?"* again.

---

## ✨ Features

- **🏠 Multi-Location Wardrobe Tracking**: Instantly see what clothes are currently at your **Batangas Dorm**, at **Calamba Home**, or **In-Transit Bag**, with synced global user location.
- **📱 Interactive Garment Sheet**: Tap any piece in your closet to open a spring-driven bottom sheet with 1-tap status cycling (`Clean`, `Worn`, `In Laundry`, `Drying`, `Misplaced`), 1-tap location transfer, wear history, inline notes, and edit/delete.
- **🧺 Full Laundry Triage**: Seamless botanical lifecycle (`Worn → Laundry → Drying → Clean`) with optimistic state updates and Sonner-style instant **Undo** toasts.
- **🧳 Commuter Luggage & Smart Packing**: 1-Tap **"Unpack Transit Bag"** arrival banner, pack clean clothes or dirty laundry to bring home for weekend wash, plus a **3-Day Weekend Packing Formula** shortcut.
- **✨ Fit Studio & Live Lookbook**: Roll the kinetic dice in the multi-row outfit mixer, record **"Wear Today"** rotation logs, and bookmark curated outfits to your **Lookbook** with real-time piece availability badges (*"Ready at Dorm"* vs *"Piece in Laundry"*).
- **📸 Visual Wardrobe Catalog**: Camera capture and gallery upload with automatic non-AI background removal and tactile color swatch selectors.
- **⚡ Offline-First with Cloud Sync**: Fully functional offline via `@react-native-async-storage/async-storage`, with optional cloud database synchronization using **Supabase** (`clothing_items`, `saved_outfits`, `wear_history`).

---

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (SDK 58)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Navigation**: [React Navigation](https://reactnavigation.org/) (Bottom Tabs & Native Stack)
- **Local Storage**: AsyncStorage
- **Cloud Backend**: [Supabase](https://supabase.com/) (PostgreSQL & Auth)
- **Media**: Expo Image Picker

---

## 🚀 Getting Started

### 1. Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended) and the [Expo Go](https://expo.dev/go) app on your mobile device (iOS or Android).

### 2. Clone the Repository

```bash
git clone https://github.com/samuelordialeseya/DormDrobe.git
cd DormDrobe
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment (Optional)

DormDrobe works out of the box with offline local storage and mock data. To connect your Supabase backend:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in your project URL and anonymous key:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 5. Run the App

Start the Expo development server:

```bash
npm start
```

- Scan the QR code with **Expo Go** (Android) or the **Camera app** (iOS).
- Press `a` to launch in the Android Emulator.
- Press `i` to launch in the iOS Simulator.
- Press `w` to run in the web browser.

---

## 📂 Project Structure

```text
dormdrobe/
├── src/
│   ├── components/      # Reusable UI components (buttons, cards, badges)
│   ├── config/          # Supabase client setup
│   ├── context/         # Wardrobe state management & persistence
│   ├── navigation/      # Bottom tab & stack navigators
│   ├── screens/         # Closet, Fit Generator, Batch Actions, Add Item, Settings
│   ├── types/           # TypeScript definitions
│   └── utils/           # Mock data and helpers
├── assets/              # App icons, splash screens, and images
├── App.tsx              # Root component & providers
├── app.json             # Expo application configuration
└── package.json         # Project dependencies & scripts
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
