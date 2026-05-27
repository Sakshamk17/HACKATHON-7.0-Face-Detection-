export interface User {
  id: string;
  name: string;
  enrolledAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
}

export type RootStackParamList = {
  Home: undefined;
  Camera: { mode: 'ENROLL' | 'VERIFY' };
  Enrollment: undefined;
  Verification: undefined;
  AttendanceHistory: undefined;
  Settings: undefined;
};

// ─── Face Detection Types ─────────────────────────────────────────────────────

/**
 * Raw bounding box returned by ML Kit, in image-space pixels.
 */
export interface FaceBounds {
  /** X offset from image left in pixels */
  x: number;
  /** Y offset from image top in pixels */
  y: number;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

/**
 * Bounding box mapped to screen/view coordinates, ready for overlay rendering.
 */
export interface ScreenBounds {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Face detection result including screen-mapped bounds and optional metadata.
 */
export interface DetectedFaceResult {
  /** Screen-space bounding box for overlay rendering */
  screenBounds: ScreenBounds;
  /** Raw image-space bounding box from ML Kit */
  imageBounds: FaceBounds;
  /** Head rotation angles (degrees) */
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  /** Unique tracking ID (if available) */
  trackingId?: number;
}

/**
 * Face detection pipeline status.
 */
export type FaceDetectionStatus =
  | 'idle'
  | 'detecting'
  | 'face_detected'
  | 'no_face'
  | 'error';

/**
 * Image dimensions used for coordinate mapping.
 */
export interface ImageSize {
  width: number;
  height: number;
}
