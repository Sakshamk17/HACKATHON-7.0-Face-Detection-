# RUNBOOK

## Architecture Discovered
- **Frontend**: A React Native CLI application structured with an offline-first focus. It heavily relies on `react-native-vision-camera` and `@react-native-ml-kit/face-detection` to perform liveness detection and coordinate mapping. 
- **Backend**: A lightweight Python HTTP server (`backend/server.py`) with no external PyPI dependencies, leveraging a local SQLite database to store user embeddings and authentication logs.
- **ML System (`offline-face-auth`)**: A standalone set of PyTorch scripts centered around MobileFaceNet. Currently, this component is **disconnected** from the application pipeline. Instead, the frontend generates "mock" embeddings via a deterministic wave function (`src/core/ml/embeddingAdapter.ts`) using signals like face bounding box dimensions and liveness probabilities.

## Fixes Applied
- Altered `frontend/src/config/env.ts` to point `BACKEND_URL` to `http://localhost:8080`. Previously, it was pointing to `http://10.0.2.2:8080`, which works for an Android emulator but is unreachable from a physical Android device connecting over USB/ADB.
- Bound device ports `8080` (Backend API) and `8081` (Metro Bundler) to the host machine utilizing `adb reverse`.

## Setup & Run Process

To run the project completely end-to-end on your physically connected Android device, execute the following steps in sequence in separate terminal windows.

### Step 1: Establish Port Forwarding
This allows your Android phone to securely reach your laptop's localhost.
```bash
adb reverse tcp:8080 tcp:8080
adb reverse tcp:8081 tcp:8081
```

### Step 2: Start the Backend Server
From the root of the repository, start the Python server. This handles the `/enroll` and `/verify` endpoints.
```bash
python3 backend/server.py
```
*(You should see `[backend] Listening on http://0.0.0.0:8080`)*

### Step 3: Start the Metro Bundler
In a new terminal window, navigate to the frontend directory and start Metro.
```bash
cd frontend
npm run start
```

### Step 4: Build and Install the App
In another new terminal window, navigate to the frontend directory and build the app for Android.
```bash
cd frontend
npm run android
```
*(This command will compile the React Native app, install the APK onto your device, and launch it).*

## Troubleshooting Notes
- **Metro Connection Refused/App Freezes on Load**: Ensure `adb reverse tcp:8081 tcp:8081` was successfully executed. The physical device must be able to pull JS bundles from the host.
- **Network Error / Backend Timeout**: Ensure `adb reverse tcp:8080 tcp:8080` was executed and that `backend/server.py` is running on the host. 
- **App Closes/Crashes on Start**: Ensure your device is unlocked. Check if `newArchEnabled=true` inside `android/gradle.properties` is supported by your device (it should be, but it's a known RN consideration). Use `adb logcat | grep ReactNative` to debug crashes.
