/**
 * frameProcessor.ts — Core ML Frame Processing Architecture
 *
 * CURRENT PHASE (Phase 1 — Realtime Detection):
 * Face detection is implemented via throttled Camera snapshots + ML Kit.
 * See: src/hooks/useFaceDetection.ts
 * See: src/core/ml/faceDetection.ts
 *
 * FUTURE PHASE (Phase 2 — Frame Processor / TFLite):
 * When integrating TFLite/MediaPipe directly, install:
 *   - react-native-vision-camera-worklets
 *   - react-native-worklets (Software Mansion)
 *
 * Then implement a worklet-based frame processor:
 *
 * ```ts
 * import { useFrameOutput } from 'react-native-vision-camera';
 * import { useAppStore } from '../store/useAppStore';
 *
 * export function useTFLiteFrameProcessor() {
 *   const setDetectedFaces = useAppStore((s) => s.setDetectedFaces);
 *
 *   return useFrameOutput({
 *     pixelFormat: 'rgb',  // LiteRT needs RGB, not YUV
 *     onFrame(frame) {
 *       'worklet';
 *       // 1. Run TFLite inference on frame buffer
 *       // const faces = runTFLiteModel(frame);
 *
 *       // 2. Dispose frame IMMEDIATELY to avoid pipeline stall
 *       frame.dispose();
 *
 *       // 3. Pass results to JS thread (non-blocking)
 *       // runOnJS(setDetectedFaces)(faces);
 *     },
 *   });
 * }
 * ```
 *
 * ARCHITECTURE NOTES:
 * - Keep frame processors as thin as possible (no heavy logic in worklet)
 * - Always dispose() frames immediately after reading pixel data
 * - Use 'yuv' for OpenCV/MediaPipe, 'rgb' for TFLite/LiteRT
 * - Throttle via skipFrames counter inside worklet for performance
 */

// Re-export coordinate mapping utilities for external use
export { mapBoundsToScreen, toDetectedFaceResult, detectFacesFromUri, detectFacesAccurate } from './faceDetection';

