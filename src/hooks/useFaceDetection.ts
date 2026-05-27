/**
 * useFaceDetection.ts
 *
 * Orchestration hook for the realtime face detection pipeline.
 *
 * Strategy: Throttled snapshot capture + ML Kit on-device detection.
 *
 * Flow:
 *   setInterval (DETECTION_INTERVAL_MS)
 *     → cameraRef.takeSnapshot()          — grab current frame as Nitro Image
 *     → image.saveToTemporaryFileAsync()  — write to temp file
 *     → detectFacesFromUri(path)          — ML Kit inference
 *     → coordinate mapping               — image-space → screen-space
 *     → store.setDetectedFaces()         — triggers overlay re-render
 *
 * Performance characteristics:
 * - Preview runs at full 30fps uninterrupted
 * - Detection runs at ~7-8fps (125ms throttle)
 * - Each detection call is ~50-150ms on mid-range Android
 * - Guard: if previous detection is still running, skip the frame
 * - FPS rolling average: updated every 10 frames
 */

import { useEffect, useRef, useCallback } from 'react';
import type { CameraRef } from 'react-native-vision-camera';
import { detectFacesFromUri } from '../core/ml/faceDetection';
import { useAppStore } from '../core/store/useAppStore';
import type { ImageSize } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Target detection interval in ms. 125ms ≈ 8fps detection. */
const DETECTION_INTERVAL_MS = 125;

/** Snapshot quality (0-100). Low quality = faster save + smaller file for ML. */
const SNAPSHOT_QUALITY = 40;

/** Number of frames to average for FPS display. */
const FPS_AVERAGING_FRAMES = 10;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseFaceDetectionProps {
  /** Ref to the Camera component — used for takeSnapshot() */
  cameraRef: React.RefObject<CameraRef>;
  /** Current layout dimensions of the camera preview view on screen */
  viewSize: ImageSize;
  /** Whether detection should be running (e.g. false when screen unfocused) */
  isActive: boolean;
  /** Show debug info in console */
  debug?: boolean;
}

export interface UseFaceDetectionResult {
  /** Whether a detection pass is currently in-flight */
  isDetecting: boolean;
  /** Rolling average detection FPS */
  detectionFps: number;
}

export function useFaceDetection({
  cameraRef,
  viewSize,
  isActive,
  debug = false,
}: UseFaceDetectionProps): UseFaceDetectionResult {
  const setDetectedFaces = useAppStore((s) => s.setDetectedFaces);
  const setDetectionStatus = useAppStore((s) => s.setDetectionStatus);
  const updateDetectionTiming = useAppStore((s) => s.updateDetectionTiming);
  const resetDetectionState = useAppStore((s) => s.resetDetectionState);

  // Guards & timing refs — using refs to avoid stale closure issues
  const isDetectingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameCountRef = useRef(0);
  const fpsFrameTimesRef = useRef<number[]>([]);
  const isActiveRef = useRef(isActive);
  const viewSizeRef = useRef(viewSize);

  // Keep refs in sync with latest props without causing re-renders
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    viewSizeRef.current = viewSize;
  }, [viewSize]);

  // ── Core detection tick ────────────────────────────────────────────────────

  const runDetectionTick = useCallback(async () => {
    // Guard: skip if already running (frame took longer than interval)
    if (isDetectingRef.current) return;
    // Guard: skip if not active
    if (!isActiveRef.current) return;
    // Guard: skip if camera ref not ready
    if (!cameraRef.current) return;
    // Guard: skip if view hasn't been laid out yet
    if (viewSizeRef.current.width === 0 || viewSizeRef.current.height === 0) return;

    isDetectingRef.current = true;
    setDetectionStatus('detecting');

    try {
      // 1. Capture snapshot from camera preview
      const image = await cameraRef.current.takeSnapshot?.();
      if (!image) {
        isDetectingRef.current = false;
        return;
      }

      // 2. Save to temp file for ML Kit (ML Kit needs a file URI)
      const tempPath = await image.saveToTemporaryFileAsync('jpg', SNAPSHOT_QUALITY);
      const imageUri = `file://${tempPath}`;

      // 3. Record image dimensions for coordinate mapping
      const imageSize: ImageSize = {
        width: image.width,
        height: image.height,
      };

      // 4. Run ML Kit face detection
      const faces = await detectFacesFromUri(imageUri, imageSize, viewSizeRef.current);

      // 5. Update store (triggers overlay re-render)
      setDetectedFaces(faces);

      // 6. Update FPS rolling average
      const now = Date.now();
      fpsFrameTimesRef.current.push(now);
      if (fpsFrameTimesRef.current.length > FPS_AVERAGING_FRAMES) {
        fpsFrameTimesRef.current.shift();
      }
      frameCountRef.current++;

      if (fpsFrameTimesRef.current.length >= 2) {
        const oldest = fpsFrameTimesRef.current[0];
        const newest = fpsFrameTimesRef.current[fpsFrameTimesRef.current.length - 1];
        const fps = ((fpsFrameTimesRef.current.length - 1) / ((newest - oldest) / 1000));
        updateDetectionTiming(Math.round(fps * 10) / 10);
      }

      if (debug) {
        console.log(
          `[FaceDetection] ${faces.length} face(s) detected — ` +
            `image: ${imageSize.width}x${imageSize.height}`,
        );
      }
    } catch (error) {
      if (debug) {
        console.warn('[FaceDetection] Tick error:', error);
      }
      setDetectionStatus('error');
    } finally {
      isDetectingRef.current = false;
    }
  }, [cameraRef, setDetectedFaces, setDetectionStatus, updateDetectionTiming, debug]);

  // ── Lifecycle: start / stop interval ──────────────────────────────────────

  useEffect(() => {
    if (!isActive) {
      // Stop detection and clean up state when screen loses focus
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      resetDetectionState();
      return;
    }

    // Start detection loop
    intervalRef.current = setInterval(runDetectionTick, DETECTION_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, runDetectionTick, resetDetectionState]);

  // ── Return debug info ──────────────────────────────────────────────────────

  // Return a primitive scalar to keep useSyncExternalStore snapshot stable
  const detectionFps = useAppStore((state) => state.detectionFps);

  return {
    isDetecting: isDetectingRef.current,
    detectionFps,
  };
}
