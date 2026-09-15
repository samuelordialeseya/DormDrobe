# 🧥 DormDrobe

**DormDrobe** is a smart capsule wardrobe and luggage tracking mobile app designed specifically for college students, dormers, and frequent travelers who split their clothing between **Home** and **Dorm**.

Never wonder *"Did I leave that hoodie at home or in my dorm?"* again.

---

## ✨ Features

- **🏠 Multi-Location Wardrobe Tracking**: Instantly see what clothes are currently at your **Dorm**, at **Home**, or **In Transit**.
- **🧺 Status & Laundry Tracking**: Keep tabs on what's **Clean**, **Dirty**, or currently at the **Laundromat**.
- **🧳 Luggage & Batch Move**: Pack for weekend trips or semester move-in/move-out with 1-tap batch transfer tools.
- **✨ Fit Generator**: Roll the dice to generate stylish outfits using clean clothes available at your current location.
- **📸 Visual Wardrobe Catalog**: Snap photos of your clothes, tag colors, categories, brands, and personal notes.
- **⚡ Offline-First with Cloud Sync**: Fully functional offline via `@react-native-async-storage/async-storage`, with optional cloud database synchronization using **Supabase**.

---

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (SDK 57)
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
