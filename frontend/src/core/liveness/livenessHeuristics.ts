/**
 * livenessHeuristics.ts
 *
 * Pure, stateless heuristic functions for liveness detection.
 * All functions operate on a rolling buffer of LivenessFrames.
 *
 * Design:
 * - All functions are pure (no side effects, no external state)
 * - O(n) on a small fixed-size buffer (max 15 frames)
 * - Safe to call on every detection tick
 * - Each function returns a boolean (gesture detected or not)
 *
 * Heuristic Parameters (tuned for front camera, mid-range Android, 6-8fps):
 * - Blink: Both eyes drop below 0.3, then recover above 0.6
 * - Head turn: Yaw deviates ±18° from estimated baseline
 * - Smile: Smile prob > 0.72 for 3+ consecutive frames
 */

import type { LivenessFrame } from '../../types';

// ─── Thresholds ───────────────────────────────────────────────────────────────

/** Eye probability below this = eyes considered closed */
const BLINK_CLOSE_THRESHOLD = 0.3;
/** Eye probability above this = eyes considered open */
const BLINK_OPEN_THRESHOLD = 0.6;
/** Minimum frames the eyes must be closed to count as a blink */
const BLINK_MIN_CLOSE_FRAMES = 1;
/** Max ms between eye-close and eye-reopen for a valid blink */
const BLINK_MAX_DURATION_MS = 600;

/**
 * Head turn threshold in degrees.
 *
 * ML Kit 'fast' mode caps yaw reporting at much lower values than 'accurate'.
 * Real measured range when turning head visibly: ±8° to ±20°.
 * Set threshold low enough to catch a clear turn, high enough to ignore drift.
 * 8° is safe — frontal noise is typically ±3-4°.
 */
const HEAD_TURN_THRESHOLD_DEG = 8;

/**
 * Minimum number of consecutive frames where yaw exceeds threshold.
 * 1 frame is fine at 8fps — the turn is brief anyway.
 */
const HEAD_TURN_MIN_FRAMES = 1;

/** Smile probability above this = smiling */
const SMILE_THRESHOLD = 0.72;
/** Minimum consecutive frames smiling must be detected */
const SMILE_MIN_FRAMES = 3;

/**
 * Max absolute yaw accepted for a "frontal" baseline candidate.
 * Generous (20°) so we always get a baseline even if user is slightly off-centre.
 */
const FRONTAL_YAW_MAX = 20;

/** How many frontal frames to average for baseline (most recent ones) */
const BASELINE_FRAMES = 5;

// ─── Blink Detection ─────────────────────────────────────────────────────────

/**
 * Detects a blink in the frame buffer.
 *
 * A blink sequence in the buffer looks like:
 *   [open, open, CLOSED, CLOSED?, open, open]
 *
 * We scan for: a sequence of closed-eye frames, followed by open-eye frames,
 * where the total duration is within BLINK_MAX_DURATION_MS.
 */
export function detectBlink(frames: LivenessFrame[]): boolean {
  if (frames.length < 3) return false;

  let closeStart = -1;
  let closeEnd = -1;

  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    const bothClosed =
      f.leftEyeOpenProb < BLINK_CLOSE_THRESHOLD &&
      f.rightEyeOpenProb < BLINK_CLOSE_THRESHOLD;

    if (bothClosed) {
      if (closeStart === -1) closeStart = i;
      closeEnd = i;
    } else if (closeStart !== -1) {
      // Eyes just opened after being closed — potential blink complete
      const closedFrames = closeEnd - closeStart + 1;
      if (closedFrames >= BLINK_MIN_CLOSE_FRAMES) {
        const duration = frames[closeEnd].timestamp - frames[closeStart].timestamp;
        if (duration <= BLINK_MAX_DURATION_MS) {
          // Confirm eyes are actually open now (not just an anomaly)
          const eyesOpen =
            f.leftEyeOpenProb > BLINK_OPEN_THRESHOLD &&
            f.rightEyeOpenProb > BLINK_OPEN_THRESHOLD;
          if (eyesOpen) return true;
        }
      }
      // Reset and keep scanning
      closeStart = -1;
      closeEnd = -1;
    }
  }

  return false;
}

// ─── Head Turn Detection ──────────────────────────────────────────────────────

/**
 * Estimates the frontal yaw baseline from recent frontal-looking frames.
 * Uses the MOST RECENT frontal frames (not oldest) so it adapts if
 * the user repositioned before the challenge started.
 * Returns null if we don't have enough frontal frames yet.
 */
function estimateYawBaseline(frames: LivenessFrame[]): number | null {
  // Take the most recent frames that qualify as frontal
  const frontalFrames = [...frames]
    .reverse()
    .filter((f) => Math.abs(f.rotationY) < FRONTAL_YAW_MAX)
    .slice(0, BASELINE_FRAMES);

  if (frontalFrames.length < 2) return null;
  return frontalFrames.reduce((sum, f) => sum + f.rotationY, 0) / frontalFrames.length;
}

/**
 * Detects a sustained head turn in EITHER direction.
 *
 * We use absolute deviation from the baseline. This makes the heuristic
 * completely immune to front-camera mirroring quirks on different Android devices
 * (where positive vs negative yaw is sometimes flipped by the OEM driver).
 * As long as the user physically turns their head, it passes.
 */
export function detectHeadTurn(frames: LivenessFrame[]): boolean {
  if (frames.length < HEAD_TURN_MIN_FRAMES + 1) return false;

  const baseline = estimateYawBaseline(frames);
  if (baseline === null) return false;

  // Check the most recent N frames
  const recentFrames = frames.slice(-Math.max(HEAD_TURN_MIN_FRAMES + 1, 3));
  const turned = recentFrames.filter(
    (f) => Math.abs(f.rotationY - baseline) > HEAD_TURN_THRESHOLD_DEG,
  );
  return turned.length >= HEAD_TURN_MIN_FRAMES;
}

// ─── Smile Detection ─────────────────────────────────────────────────────────

/**
 * Detects a sustained smile in the most recent frames.
 */
export function detectSmile(frames: LivenessFrame[]): boolean {
  if (frames.length < SMILE_MIN_FRAMES) return false;

  const recent = frames.slice(-SMILE_MIN_FRAMES);
  return recent.every((f) => f.smilingProb > SMILE_THRESHOLD);
}

// ─── Baseline Stability Check ─────────────────────────────────────────────────

/**
 * Returns true when we have enough frontal frames to establish a reliable
 * yaw baseline. Used to determine when to start issuing challenges.
 */
export function isFaceStable(frames: LivenessFrame[]): boolean {
  const baseline = estimateYawBaseline(frames);
  return baseline !== null;
}

/**
 * Returns the average yaw from the buffer for debug display.
 */
export function getAverageYaw(frames: LivenessFrame[]): number {
  if (frames.length === 0) return 0;
  return frames.reduce((s, f) => s + f.rotationY, 0) / frames.length;
}
