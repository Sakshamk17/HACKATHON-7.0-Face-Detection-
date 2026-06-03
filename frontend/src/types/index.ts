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

// ─── Liveness Detection Types ─────────────────────────────────────────────────

/**
 * A single frame of liveness data captured from ML Kit.
 * Populated when classificationMode = 'all'.
 */
export interface LivenessFrame {
  /** Timestamp of this frame (ms since epoch) */
  timestamp: number;
  /** Left eye open probability: 0.0 (closed) → 1.0 (open) */
  leftEyeOpenProb: number;
  /** Right eye open probability: 0.0 (closed) → 1.0 (open) */
  rightEyeOpenProb: number;
  /** Smile probability: 0.0 (not smiling) → 1.0 (smiling) */
  smilingProb: number;
  /** Head yaw (left/right rotation) in degrees */
  rotationY: number;
  /** Head pitch (up/down) in degrees */
  rotationX: number;
  /** Head roll (tilt) in degrees */
  rotationZ: number;
}

/**
 * The type of liveness challenge issued to the user.
 */
export type ChallengeType = 'BLINK' | 'TURN_HEAD' | 'SMILE';

/**
 * High-level liveness verification lifecycle status.
 */
export type LivenessStatus =
  | 'idle'              // Not started
  | 'waiting_for_face'  // No face yet
  | 'face_stable'       // Face found, settling (waiting 1s)
  | 'challenge_active'  // Challenge issued, awaiting gesture
  | 'challenge_passed'  // One challenge done, moving to next
  | 'verified'          // All challenges passed — liveness confirmed
  | 'failed'            // Timeout or wrong gesture
  | 'retrying';         // Brief cooldown before re-issuing challenge

/**
 * Full liveness state snapshot exposed by useLiveness hook.
 */
export interface LivenessState {
  status: LivenessStatus;
  /** Currently active challenge, or null if none */
  currentChallenge: ChallengeType | null;
  /** 0–1 progress within current challenge (for UI ring) */
  challengeProgress: number;
  /** Index of which challenge we are on (0-based) */
  challengeIndex: number;
  /** Total number of challenges required */
  totalChallenges: number;
  /** Human-readable instruction for the current challenge */
  instruction: string;
  /** ms remaining before challenge times out */
  timeRemaining: number;
}
