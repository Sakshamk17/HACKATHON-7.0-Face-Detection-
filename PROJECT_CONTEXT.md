# Project Context

## Project Goal
Build an offline-first facial recognition and liveness detection mobile application for Android/iOS using React Native.

## Core Constraints
- React Native CLI ONLY (NOT Expo)
- Android-first development
- Offline-first architecture
- Future support for:
  - VisionCamera
  - MediaPipe
  - TensorFlow Lite
  - SQLite
- Must remain lightweight and hackathon-friendly
- TypeScript everywhere

## Setup Instructions
1. Clone the repository
2. Run `npm install` to install dependencies
3. (Optional, Mac only) For iOS, run `cd ios && pod install && cd ..`
4. Run `npm run start` to start Metro
5. Run `npx react-native run-android` to launch the Android emulator

## Current State
**Phase 2 Complete**: Realtime face detection pipeline running on Android.
- Camera opens with permission flow
- Face detection runs at ~6-8fps via ML Kit
- Bounding boxes render and track in real-time with animated corner brackets
- Detection status indicator (Scanning / Face Detected / No Face)
- Debug panel toggle showing live FPS
- `newArchEnabled=true` required in `android/gradle.properties` for Nitro codegen

## Architecture Overview

### Detection Pipeline
```
Camera (30fps preview) — continuous, uninterrupted
     │
     │  setInterval (125ms ≈ 8fps detection)
     ▼
CameraRef.takeSnapshot() → Nitro Image
     │
image.saveToTemporaryFileAsync('jpg', 40)  ← quality=40 for fast inference
     │
`file://` URI
     │
FaceDetection.detect(uri, FAST_OPTIONS)  ← @react-native-ml-kit/face-detection
     │
FaceBounds[] (image-space pixels)
     │
mapBoundsToScreen(bounds, imageSize, viewSize)  ← linear scale + mirror X
     │
DetectedFaceResult[] → Zustand store
     │
CameraOverlay re-renders → FaceBoundingBox (animated)
```

### Coordinate Mapping
- ML Kit returns pixel coordinates relative to full-resolution snapshot image
- Snapshot size ≠ screen view size — linear scaling applied
- Front camera is mirrored: X axis flipped (`left = viewWidth - (x + w) * scaleX`)

### Zustand Anti-Pattern (IMPORTANT)
- React 19 + Zustand v5 require selectors to return **stable references**
- Object form `useAppStore(s => ({ a: s.a, b: s.b }))` creates a new object every render → infinite loop
- ✅ Use separate scalar selectors: `const a = useAppStore(s => s.a)`
- ✅ For arrays: Zustand v5 already provides referential stability for unchanged arrays

## Recent Changes (Phase 2 — Face Detection)

### New Files
- `src/core/ml/faceDetection.ts` — ML Kit wrapper with coordinate mapping
- `src/hooks/useFaceDetection.ts` — Orchestration hook (throttled snapshot + detection)
- `src/components/camera/FaceBoundingBox.tsx` — Animated corner-bracket bounding box

### Modified Files
- `src/types/index.ts` — Added `FaceBounds`, `ScreenBounds`, `DetectedFaceResult`, `FaceDetectionStatus`, `ImageSize`
- `src/core/store/useAppStore.ts` — Added face detection state slice
- `src/core/ml/frameProcessor.ts` — Replaced placeholder with architecture docs + re-exports
- `src/components/camera/CameraOverlay.tsx` — Full rebuild: renders boxes, status, debug panel
- `src/screens/CameraScreen.tsx` — Added `cameraRef`, `onLayout`, `useFaceDetection` wiring, debug toggle

## Dependencies Added
- `react-native-vision-camera: ^5.0.10` — Native camera infrastructure (Phase 1)
- `@react-native-ml-kit/face-detection: ^2.0.1` — On-device Google ML Kit face detection (Phase 2)

## Architecture Decisions
- **ML Kit + Snapshot** over frame processor worklets — avoids heavy worklets dependency for hackathon phase
- **Separate Zustand selectors** — React 19 compatibility requirement (no object selectors)
- **125ms interval** — ~8fps detection with guard for overlapping ticks
- **40% JPEG quality** — fast disk write, sufficient for ML Kit inference
- **Front camera X-axis mirror** — snapshots are unmirrored; overlay must mirror manually
- **`React.memo`** on overlay and bounding box — prevents unnecessary re-renders

## Performance Characteristics
- Camera preview: 30fps (unaffected by detection)
- Detection throughput: ~6-8 detections/sec on mid-range Android
- Detection latency: ~80-150ms per frame (snapshot save + ML Kit)
- Per-frame guard: skip tick if previous still running (no queue buildup)
- FPS rolling average: computed over 10 frames

## Known Issues / Limitations
- `takeSnapshot()` may be unavailable on some devices/OS configs — guarded with `?.`
- Temp files accumulate in `/tmp`; no cleanup implemented (acceptable for hackathon)
- ML Kit first inference is slower (~300ms) as it initializes the model
- `newArchEnabled=true` required in `android/gradle.properties` to prevent Nitro codegen failures

## Pending Tasks
- Phase 3: Face alignment (crop + normalize face region for embedding)
- Phase 4: Embedding generation via TFLite (FaceNet or MobileFaceNet)
- Phase 5: Cosine similarity matching + SQLite user store
- Phase 6: Liveness detection (blink detection, head pose estimation)
- Cleanup: Temp file deletion for ML Kit snapshots
- Cleanup: Migrate frame processing to worklets when TFLite is added
