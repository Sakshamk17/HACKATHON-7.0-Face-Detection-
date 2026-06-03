/**
 * faceDetection.ts
 *
 * Thin wrapper around @react-native-ml-kit/face-detection.
 *
 * Design decisions:
 * - Stateless: no singleton detector — MLKit manages its own internal state.
 * - Uses 'fast' performance mode for realtime use. Switch to 'accurate' for
 *   enrollment-quality detection in future phases.
 * - Landmarks disabled by default (performance). Enable for liveness phase.
 * - Classification disabled by default. Enable for eye-open checks in liveness.
 *
 * Future extensibility:
 * - detectFacesAccurate() variant for enrollment with contour + landmark mode
 * - detectFacesWithLiveness() for liveness validation pipeline
 */

import FaceDetection from '@react-native-ml-kit/face-detection';
import type { Face } from '@react-native-ml-kit/face-detection';
import type { DetectedFaceResult, FaceBounds, ImageSize, ScreenBounds } from '../../types';

// ─── Detection Configuration ──────────────────────────────────────────────────

/**
 * Fast mode config: used for realtime preview detection (8fps throttled).
 * Prioritizes speed over accuracy.
 */
const FAST_DETECTION_OPTIONS = {
  performanceMode: 'fast' as const,
  landmarkMode: 'none' as const,
  contourMode: 'none' as const,
  classificationMode: 'none' as const,
  minFaceSize: 0.15, // Ignore tiny faces — optimised for selfie camera
};

/**
 * Accurate mode config: for enrollment captures (one-shot, not realtime).
 * Future use: embed generation, liveness validation.
 */
export const ACCURATE_DETECTION_OPTIONS = {
  performanceMode: 'accurate' as const,
  landmarkMode: 'all' as const,
  contourMode: 'none' as const,
  classificationMode: 'all' as const,
  minFaceSize: 0.1,
};

// ─── Coordinate Mapping ───────────────────────────────────────────────────────

/**
 * Maps a face bounding box from image-space (ML Kit output) to screen-space
 * (view layout coordinates) for rendering the overlay.
 *
 * ML Kit returns pixel coordinates relative to the full image dimensions.
 * The camera snapshot may be a different size than the preview view on screen.
 * This function applies a linear scale + offset mapping.
 *
 * @param imageBounds - Raw bounding box from ML Kit in image pixels
 * @param imageSize - Full resolution of the snapshot image (width x height)
 * @param viewSize - Screen dimensions of the camera preview view
 */
export function mapBoundsToScreen(
  imageBounds: FaceBounds,
  imageSize: ImageSize,
  viewSize: ImageSize,
): ScreenBounds {
  const scaleX = viewSize.width / imageSize.width;
  const scaleY = viewSize.height / imageSize.height;

  // Front camera images are mirrored — mirror the X axis for the overlay
  const mirroredLeft = viewSize.width - (imageBounds.x + imageBounds.width) * scaleX;

  return {
    top: imageBounds.y * scaleY,
    left: mirroredLeft,
    width: imageBounds.width * scaleX,
    height: imageBounds.height * scaleY,
  };
}

/**
 * Converts a ML Kit `Face` result into our internal `DetectedFaceResult` type
 * with pre-mapped screen bounds ready for overlay rendering.
 */
export function toDetectedFaceResult(
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

// ─── Detection Functions ──────────────────────────────────────────────────────

/**
 * Runs fast face detection on a given image URI.
 *
 * @param imageUri - A `file://` URI to the image (e.g. from saveToTemporaryFileAsync)
 * @param imageSize - Dimensions of the image (for coordinate mapping)
 * @param viewSize - Dimensions of the camera preview view on screen
 * @returns Array of detected faces with screen-mapped bounds, or empty array if none.
 */
export async function detectFacesFromUri(
  imageUri: string,
  imageSize: ImageSize,
  viewSize: ImageSize,
): Promise<DetectedFaceResult[]> {
  try {
    const rawFaces = await FaceDetection.detect(imageUri, FAST_DETECTION_OPTIONS);
    return rawFaces.map((face) => toDetectedFaceResult(face, imageSize, viewSize));
  } catch (error) {
    // Silently fail for individual frames — log in debug mode only
    if (__DEV__) {
      console.warn('[FaceDetection] Detection error:', error);
    }
    return [];
  }
}

/**
 * Accurate face detection — intended for enrollment captures, not realtime.
 * Future hook: useFaceEnrollment will call this.
 */
export async function detectFacesAccurate(
  imageUri: string,
  imageSize: ImageSize,
  viewSize: ImageSize,
): Promise<DetectedFaceResult[]> {
  const rawFaces = await FaceDetection.detect(imageUri, ACCURATE_DETECTION_OPTIONS);
  return rawFaces.map((face) => toDetectedFaceResult(face, imageSize, viewSize));
}
