# Project Context

## Project Goal
Build an offline-first facial recognition and liveness detection mobile application for Android/iOS using React Native.

## Core Constraints
- React Native CLI ONLY (NOT Expo)
- Android-first development
- Offline-first architecture
- Future: TensorFlow Lite, SQLite
- Lightweight, hackathon-friendly
- TypeScript everywhere

## Setup Instructions
1. `npm install`
2. iOS only: `cd ios && pod install && cd ..`
3. `npm run start` — start Metro
4. `npx react-native run-android`

## Current State
**Phase 3 Complete**: Realtime landmark-based liveness detection pipeline running on Android.
- Camera preview at 30fps, face detection at ~6-8fps
- In VERIFY mode: ML Kit classification enabled (eye open probs + smile prob)
- Challenge-response flow: BLINK → random(TURN_LEFT | TURN_RIGHT | SMILE)
- Animated challenge card with timeout progress bar, step dots, success/fail states
- Retry mechanism (up to 3 attempts before hard fail)
- `newArchEnabled=true` required in `android/gradle.properties`

---

## Full Architecture Overview

### Detection Pipeline
```
Camera (30fps preview) — continuous, uninterrupted
     │
     │  setInterval (125ms ≈ 8fps detection)
     ▼
CameraRef.takeSnapshot() → Nitro Image
     │
image.saveToTemporaryFileAsync('jpg', 40)  ← quality=40 for speed
     │
file:// URI
     │
     ├── [ENROLL / debug mode] detectFacesFromUri()
     │         FaceDetection.detect(FAST_OPTIONS)  ← landmarkMode:none, classify:none
     │
     └── [VERIFY mode] detectFacesWithLiveness()
               FaceDetection.detect(LIVENESS_OPTIONS)  ← classify:all, landmark:none
               │
               ├── DetectedFaceResult[]  → Zustand detectedFaces → FaceBoundingBox overlay
               └── LivenessFrame { leftEyeOpenProb, rightEyeOpenProb, smilingProb, rotationY/X/Z }
                         → Zustand livenessFrameBuffer (max 15 frames rolling)
                                   │
                              useLiveness hook  ← reacts to buffer changes
                                   │
                         Challenge state machine
                         (idle→waiting→stable→challenge→pass/fail→verified)
                                   │
                              Zustand livenessState
                                   │
                              LivenessOverlay (animated UI)
```

### Coordinate Mapping
- ML Kit pixel coords → screen view coords via linear scale
- Front camera X-axis mirrored in `mapBoundsToScreen()`

### Liveness Heuristics
| Heuristic | Data Source | Algorithm |
|-----------|-------------|-----------|
| Blink | `leftEyeOpenProb` / `rightEyeOpenProb` | Both eyes < 0.3 then > 0.6, within 600ms |
| Head Turn | `rotationY` | Absolute yaw deviates > 8° from baseline for 1+ frames |
| Smile | `smilingProb` | > 0.72 for 3+ consecutive frames |
| Face Stable | `rotationY` | ≥2 frontal frames (|yaw| < 20°) for baseline |

### Challenge State Machine
```
idle → waiting_for_face → face_stable (1.2s settle) → challenge_active
    challenge_active → [gesture detected] → challenge_passed
        if more challenges: → next challenge_active
        if all done: → verified ✓
    challenge_active → [timeout 6s] → retrying (1.5s cooldown, max 3 retries)
        → challenge_active (new sequence)
    retrying [max exceeded] → failed
```

### Zustand Anti-Pattern (IMPORTANT — React 19 + Zustand v5)
- NEVER return objects from selectors: `useAppStore(s => ({ a: s.a }))` → infinite loop
- ALWAYS use scalar selectors: `const a = useAppStore(s => s.a)`

---

## Folder Structure (Phase 3)
```
src/
├── types/index.ts                          — all shared types incl. liveness
├── core/
│   ├── store/useAppStore.ts                — face detection + liveness state slices
│   ├── ml/
│   │   ├── faceDetection.ts               — fast detection (ENROLL/debug)
│   │   └── livenessDetection.ts           — liveness detection (VERIFY mode)
│   └── liveness/
│       ├── livenessHeuristics.ts          — pure blink/headturn/smile detectors
│       └── challengeManager.ts            — challenge sequence + evaluation
├── hooks/
│   ├── useCameraSetup.ts                  — permission + device selection
│   ├── useFaceDetection.ts                — throttled snapshot loop (fast/liveness mode)
│   └── useLiveness.ts                     — challenge state machine
├── components/camera/
│   ├── FaceBoundingBox.tsx                — animated corner brackets
│   ├── CameraOverlay.tsx                  — status, boxes, liveness overlay
│   └── LivenessOverlay.tsx                — challenge card, progress, success/fail
└── screens/
    └── CameraScreen.tsx                   — orchestrates all hooks and overlays
```

---

## Dependencies
- `react-native-vision-camera: ^5.0.10` — camera preview + snapshot
- `@react-native-ml-kit/face-detection: ^2.0.1` — face detection + classification

**No new dependencies added in Phase 3.**

---

## Architecture Decisions (Phase 3)
- **Zero new deps** — ML Kit `classificationMode:'all'` already provides eye/smile probs
- **Liveness mode flag** — single `livenessMode` prop on `useFaceDetection` switches config
- **Rolling buffer** — 15-frame Zustand buffer, heuristics are pure functions on this slice
- **State machine in hook** — `useLiveness` reacts to buffer updates via `useEffect`, no polling
- **Separate `Animated.View` for opacity vs layout** — avoids native driver conflict (see Phase 2 fix)

---

## Performance Characteristics
- Preview: 30fps (unaffected)
- Detection: ~6-8 detections/sec
- Liveness overhead: +10-20ms/frame for `classificationMode:'all'` (acceptable)
- Frame buffer: O(1) memory (max 15 frames, rolling)
- Heuristics: O(15) per frame — negligible

---

## Known Issues / Limitations
- `takeSnapshot()` on some devices may not expose optional classification — defaulted to 1.0
- ML Kit yaw baseline requires ≥2 frontal frames; challenge may delay on profile faces
- Temp files accumulate (no cleanup — acceptable for hackathon)
- Blink heuristic requires both eyes visible — sunglasses / side profiles will not pass
- Single-face liveness only (first detected face used for heuristics)

---

## Pending Tasks
- Phase 4: Face alignment (crop + normalize face ROI)
- Phase 5: Embedding (FaceNet / MobileFaceNet via TFLite)
- Phase 6: Cosine similarity + SQLite user store
- Cleanup: Temp file deletion for snapshots
- Improvement: Visual landmark dots overlay (contour mode) for premium UX

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

## Phase 4 Update: End-to-End System Integration Note
- **Current Embeddings**: Face embeddings are currently **mocked** inside `src/core/ml/embeddingAdapter.ts` using liveness heuristics and bounding box coordinates to generate a 128-d vector.
- **Offline ML System**: The `offline-face-auth` folder contains a standalone PyTorch implementation (MobileFaceNet) which is currently **disconnected**. Neither the frontend nor the backend invokes it. 
- **Physical Device Networking**: To run on a physical Android device, the frontend `BACKEND_URL` in `src/config/env.ts` has been updated to `http://localhost:8080`. The connection to the host machine's backend is bridged securely using `adb reverse tcp:8080 tcp:8080`.

## Repository Analysis Completed
- **Status**: Full repository reverse-engineering completed successfully.
- **Documentation Location**: `CODEBASE_KNOWLEDGE_BASE.md`
- **Major Findings**: The frontend and backend are tightly integrated using HTTP APIs, but the actual Face Embedding ML System (`offline-face-auth`) is completely disconnected. The frontend currently relies on a math-based *mock* embedding generator.
- **Integration Readiness Assessment**: The repository is structurally sound but lacks a TFLite execution environment on the frontend. The `mobilefacenet.pt` PyTorch model must be converted to `.tflite` to bridge the final integration gap.

## UI/UX Redesign: NHAI Field Operations System
- **Theme Architecture**: Transformed into a "Government-grade" aesthetic (Datalake 3.0), prioritizing high contrast, professional typography, and strict color palettes (NHAI Primary `#005BAC`, Success `#0F9D58`, etc.).
- **Reusable Components Created**: 
  - `Badges.tsx` (StatusBadge, OfflineStatusBadge)
  - `MetricCard.tsx` (For operational dashboards)
  - `ConfidenceBar.tsx` (Visual progress bar for match confidence)
  - `SuccessOverlay.tsx` (Full-screen completion report for verification steps)
- **UX Improvements**:
  - Replaced native iOS/Android alerts with integrated UI overlays.
  - Guided steps added to the Enrollment flow.
  - "Authentication Pipeline" visual checklists added to Verification screens.
  - Camera overlays changed from playful rounded corners to strict "industrial" crosshairs and tracking brackets.
  - Home screen replaced with a System Status Dashboard.
- **Design Decisions**: Eliminated border-radii on buttons and switched to uppercase typography to mimic field terminals/hardware. Preserved absolutely all underlying React state, Vision Camera hooks, ML Kit inference, and backend SQLite logic.
