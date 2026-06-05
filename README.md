# NHAI Field Authentication System (Datalake 3.0)

A secure, offline-first personnel verification system designed for the NHAI Hackathon 7.0.

## Overview
This application provides robust facial recognition, liveness detection, and attendance verification designed specifically for field operations and environments with poor internet connectivity. It focuses heavily on security, trust, and usability under challenging conditions.

## Architecture

The system consists of three distinct components:

1. **Frontend (`/frontend`)**: A React Native CLI application utilizing `@react-native-ml-kit/face-detection` and `react-native-vision-camera`. It handles device-side liveness detection (blinking, smiling, head turns) using a pure, stateless heuristic engine that avoids React infinite render loops.
2. **Backend (`/backend`)**: A zero-dependency Python HTTP API built using the standard library. It processes enrollment and verification requests, and interfaces with a local SQLite database (`faceid.db`) to store identity profiles and attendance logs. Cosine similarity operations are performed here.
3. **ML Pipeline (`/offline-face-auth`)**: A standalone PyTorch system containing the MobileFaceNet model (`mobilefacenet.pt`). **Note**: The frontend currently uses mock mathematical embeddings for proof-of-concept testing. Full integration requires converting the `.pt` model to TFLite for local React Native execution.

## Features

- **Government-Grade UI**: A strict, professional, and accessible UI designed specifically for field personnel (no consumer-app aesthetics).
- **Offline Mode First**: Operates seamlessly without network connectivity. 
- **Liveness Detection**: Highly robust protection against spoofing using rolling-buffer probabilistic heuristics on 15 camera frames.
- **Verification Pipeline**: Strict tracking of Face Detection → Liveness Check → Identity Match.
- **Enterprise Dashboard**: Complete system operational status and pending sync queue visibility.

## Setup Instructions

### Backend
1. Ensure Python 3.x is installed.
2. Run the server:
```bash
cd backend
python3 server.py
```
The server will start on `http://0.0.0.0:8080` (accessible to the physical Android device via USB debugging or network).

### Frontend (Android Device Testing)
Ensure your Android device is connected and USB debugging is enabled.

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Forward the backend port so the physical device can access localhost:
```bash
adb reverse tcp:8080 tcp:8080
```

3. Start Metro bundler:
```bash
npm run start
```

4. Build and deploy to Android:
```bash
npm run android
```

## Documentation
For an exhaustive, fully-mapped teardown of the codebase, refer to the included [CODEBASE_KNOWLEDGE_BASE.md](CODEBASE_KNOWLEDGE_BASE.md).
