/**
 * livenessDetection.ts
 *
 * ML Kit detection wrapper with liveness data extraction.
 *
 * This module adds classificationMode: 'all' to get eye-open probabilities
 * and smiling probability from ML Kit — zero additional dependencies.
 *
 * The LIVENESS config is slightly heavier than FAST (~10-20ms extra per frame)
 * but is still suitable for the 8fps throttled pipeline.
 */

import FaceDetection from '@react-native-ml-kit/face-detection';
import type { Face } from '@react-native-ml-kit/face-detection';
import type { LivenessFrame, DetectedFaceResult, FaceBounds, ImageSize } from '../../types';
import { mapBoundsToScreen } from './faceDetection';

// ─── Liveness Detection Config ─────────────────────────────────────────────────

/**
 * Liveness-mode detection options.
 * - performanceMode: 'fast' to stay within the 8fps budget
 * - classificationMode: 'all' → gives leftEyeOpenProbability, rightEyeOpenProbability, smilingProbability
 * - landmarkMode: 'none' → not needed; we use rotation angles for head-turn
 * - contourMode: 'none' → heavy, not needed for heuristics
 */
export const LIVENESS_DETECTION_OPTIONS = {
  performanceMode: 'fast' as const,
  landmarkMode: 'none' as const,
  contourMode: 'none' as const,
  classificationMode: 'all' as const,
  minFaceSize: 0.15,
};

// ─── Conversion ───────────────────────────────────────────────────────────────

/**
 * Converts an ML Kit Face result to a LivenessFrame.
 * All optional classification values are defaulted to 1.0 (open/neutral)
 * when the classifier hasn't fired (e.g. profile view, occluded).
 */
export function toLivenessFrame(face: Face): LivenessFrame {
  return {
    timestamp: Date.now(),
    leftEyeOpenProb: face.leftEyeOpenProbability ?? 1.0,
    rightEyeOpenProb: face.rightEyeOpenProbability ?? 1.0,
    smilingProb: face.smilingProbability ?? 0.0,
    rotationX: face.rotationX,
    rotationY: face.rotationY,
    rotationZ: face.rotationZ,
  };
}

/**
 * Converts a ML Kit Face to our DetectedFaceResult (for bounding box rendering).
 * Identical to toDetectedFaceResult in faceDetection.ts but lives here to
 * avoid circular imports.
 */
function toFaceResult(
  face: Face,
  imageSize: ImageSize,
  viewSize: ImageSize,
): DetectedFaceResult {
  const imageBounds: FaceBounds = {
    x: face.frame.left,
    y: face.frame.top,
    width: face.frame.width,
    height: face.frame.height,
  };
  return {
    screenBounds: mapBoundsToScreen(imageBounds, imageSize, viewSize),
    imageBounds,
    rotationX: face.rotationX,
    rotationY: face.rotationY,
    rotationZ: face.rotationZ,
    trackingId: face.trackingID,
  };
}

// ─── Detection with Liveness ──────────────────────────────────────────────────

export interface LivenessDetectionResult {
  faces: DetectedFaceResult[];
  livenessFrame: LivenessFrame | null;
}

/**
 * Runs face detection in liveness mode.
 * Returns both DetectedFaceResult[] (for bounding box rendering) and
 * a LivenessFrame (for heuristic evaluation).
 *
 * Only the first (primary/most prominent) face is used for liveness data.
 */
export async function detectFacesWithLiveness(
  imageUri: string,
  imageSize: ImageSize,
  viewSize: ImageSize,
): Promise<LivenessDetectionResult> {
  try {
    const rawFaces = await FaceDetection.detect(imageUri, LIVENESS_DETECTION_OPTIONS);

    const faces = rawFaces.map((face) => toFaceResult(face, imageSize, viewSize));
    const livenessFrame = rawFaces.length > 0 ? toLivenessFrame(rawFaces[0]) : null;

    return { faces, livenessFrame };
  } catch (error) {
    if (__DEV__) {
      console.warn('[LivenessDetection] Detection error:', error);
    }
    return { faces: [], livenessFrame: null };
  }
}
