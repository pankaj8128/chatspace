# ChatSpace Mobile

This is the mobile companion app for the ChatSpace platform, built with **React Native** (React Native CLI). It connects to the shared ChatSpace backend via WebSockets to provide real-time group messaging on both Android and iOS devices.

## Features

- **Cross-Platform:** Runs natively on Android and iOS.
- **Real-time Sync:** Socket.io integration keeps messages, typing indicators, and online status in sync with the web clients.
- **Authentication:** Share the same login/signup credentials as the web app (JWT based).
- **Pagination:** Smooth infinite scrolling history with animated activity indicators.
- **Interactive UI:**
  - Modern, responsive, white-themed layout.
  - Interactive top-right dropdown for "Online Users".
  - SafeArea handling for Android notches and iOS dynamic islands.
  - Native loading spinners.

## Prerequisites

- Node.js (v18+)
- Android Studio (for Android emulation/build)
- Xcode (for iOS emulation/build, macOS only)
- A running instance of the **ChatSpace Backend**.

## Local Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Environment

By default, the mobile app attempts to connect to `http://localhost:5000` (for both API and Sockets). 
If you are testing on an Android Emulator, `localhost` points to the emulator itself. To connect to your local machine's backend:
- Open `src/services/api.ts` and `src/services/socket.ts`
- Change `http://localhost:5000` to your computer's local IP address (e.g., `http://192.168.1.X:5000`) or use `http://10.0.2.2:5000` for the Android emulator.

### 3. Run the App

#### Start the Metro Bundler
```bash
npm start
```

#### Run on Android
Open a new terminal window:
```bash
npm run android
```

#### Run on iOS
For macOS users, install pods first:
```bash
cd ios
pod install
cd ..
npm run ios
```

## Creating an APK

You can generate a universal APK to test the app directly on an Android device:
```bash
cd android
./gradlew assembleRelease
```
Your APK will be generated at `android/app/build/outputs/apk/release/app-universal-release.apk`.

## Architecture

The mobile app mirrors the React Web architecture closely, utilizing shared state contexts for rapid development:
- **`AuthContext.tsx`**: Manages JWT tokens using `AsyncStorage`.
- **`ChatContext.tsx`**: Maintains the active Socket.io connection, manages pagination, and holds the real-time arrays of messages and online users.
- **`services/`**: Holds the core API interceptors and socket configurations.
- **`screens/`**: Pure React Native UI components (Auth, Home, Chat).
