/**
 * challengeManager.ts
 *
 * Challenge generation, sequencing, and evaluation for liveness verification.
 *
 * Design:
 * - Challenges are picked pseudo-randomly but never repeat back-to-back
 * - HEAD_TURN direction (left vs right) is randomised per session
 * - Evaluation is pure: takes a frame buffer, returns whether gesture was done
 * - Instructions are human-readable and match what the gesture actually looks like
 */

import type { ChallengeType, LivenessFrame } from '../../types';
import {
  detectBlink,
  detectHeadTurn,
  detectSmile,
} from './livenessHeuristics';

// ─── Challenge Config ─────────────────────────────────────────────────────────

/** How many challenges the user must pass to be considered live */
export const TOTAL_CHALLENGES = 2;

/** Timeout per challenge in milliseconds */
export const CHALLENGE_TIMEOUT_MS = 6000;

/** Cooldown before re-issuing a challenge after failure */
export const RETRY_COOLDOWN_MS = 1500;

/** Settling time (ms) to wait for stable face before first challenge */
export const FACE_STABLE_DELAY_MS = 1200;

// ─── Challenge Pool ───────────────────────────────────────────────────────────

const ALL_CHALLENGES: ChallengeType[] = ['BLINK', 'TURN_HEAD', 'SMILE'];

/**
 * Human-readable instructions shown to the user.
 */
export const CHALLENGE_INSTRUCTIONS: Record<ChallengeType, string> = {
  BLINK: 'Blink your eyes',
  TURN_HEAD: 'Slowly turn your head sideways',
  SMILE: 'Give us a smile 😊',
};

/**
 * Emoji icon for each challenge type.
 */
export const CHALLENGE_ICONS: Record<ChallengeType, string> = {
  BLINK: '👁️',
  TURN_HEAD: '↔️',
  SMILE: '😊',
};

// ─── Challenge Sequence Generation ───────────────────────────────────────────

/**
 * Generates a sequence of N non-repeating challenges.
 * Always starts with BLINK (most reliable), then adds a head turn or smile.
 */
export function generateChallengeSequence(count: number = TOTAL_CHALLENGES): ChallengeType[] {
  const sequence: ChallengeType[] = ['BLINK'];

  // Randomly pick TURN_LEFT, TURN_RIGHT, or SMILE for subsequent challenges
  const remaining = ALL_CHALLENGES.filter((c) => c !== 'BLINK');
  shuffleInPlace(remaining);

  for (let i = 1; i < count; i++) {
    const pick = remaining[(i - 1) % remaining.length];
    sequence.push(pick);
  }

  return sequence;
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ─── Challenge Evaluation ─────────────────────────────────────────────────────

/**
 * Evaluates whether the given challenge has been completed
 * based on the current rolling frame buffer.
 *
 * @param challenge - The challenge type to evaluate
 * @param frames - Recent liveness frame buffer
 * @returns true if the gesture was detected
 */
export function evaluateChallenge(
  challenge: ChallengeType,
  frames: LivenessFrame[],
): boolean {
  switch (challenge) {
    case 'BLINK':
      return detectBlink(frames);
    case 'TURN_HEAD':
      return detectHeadTurn(frames);
    case 'SMILE':
      return detectSmile(frames);
    default:
      return false;
  }
}
