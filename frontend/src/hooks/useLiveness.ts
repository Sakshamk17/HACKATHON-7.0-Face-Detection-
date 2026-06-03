/**
 * useLiveness.ts
 *
 * Liveness verification orchestration hook.
 *
 * CRITICAL ARCHITECTURE NOTE:
 * All Zustand store ACTIONS are accessed via useAppStore.getState() inside callbacks,
 * NOT via useAppStore(s => s.action) hooks.
 *
 * Why: Zustand action selectors return new function references on every render in
 * React 19 + Zustand v5. Adding them to useCallback/useEffect deps causes:
 *   action selector → new ref → useCallback re-creates → useEffect fires →
 *   setLivenessState → re-render → action selector → new ref → ...
 *   = Maximum update depth exceeded
 *
 * Fix: Only subscribe to STATE VALUES via hooks. Access ACTIONS via getState().
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../core/store/useAppStore';
import {
  generateChallengeSequence,
  evaluateChallenge,
  CHALLENGE_TIMEOUT_MS,
  FACE_STABLE_DELAY_MS,
  TOTAL_CHALLENGES,
  CHALLENGE_INSTRUCTIONS,
} from '../core/liveness/challengeManager';
import { isFaceStable } from '../core/liveness/livenessHeuristics';
import type { ChallengeType, LivenessState } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseLivenessProps {
  isActive: boolean;
  onVerified?: () => void;
  onFailed?: () => void;
  maxRetries?: number;
}

export interface UseLivenessResult {
  livenessState: LivenessState;
  resetLiveness: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLiveness({
  isActive,
  onVerified,
  onFailed,
  maxRetries = 3,
}: UseLivenessProps): UseLivenessResult {

  // ── STATE subscriptions (values only — these are safe) ────────────────────
  const livenessFrameBuffer = useAppStore((s) => s.livenessFrameBuffer);
  const detectedFaces = useAppStore((s) => s.detectedFaces);
  const livenessState = useAppStore((s) => s.livenessState);

  // ── All internal machine state in refs — NEVER trigger re-renders ─────────
  const statusRef = useRef<LivenessState['status']>('idle');
  const challengeSequenceRef = useRef<ChallengeType[]>([]);
  const challengeIndexRef = useRef(0);
  const challengeStartTimeRef = useRef(0);
  const retryCountRef = useRef(0);
  const faceFirstSeenRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep callback refs stable — update silently without causing re-renders
  const onVerifiedRef = useRef(onVerified);
  const onFailedRef = useRef(onFailed);
  useEffect(() => { onVerifiedRef.current = onVerified; }, [onVerified]);
  useEffect(() => { onFailedRef.current = onFailed; }, [onFailed]);

  // ── Stable store updater — empty deps, never recreated ───────────────────
  // Always calls getState() at call time — no stale ref possible
  const updateLiveness = useCallback((partial: Partial<LivenessState>) => {
    useAppStore.getState().setLivenessState(partial);
  }, []);

  // ── Stable challenge starter ──────────────────────────────────────────────
  const startNextChallenge = useCallback((index: number, sequence: ChallengeType[]) => {
    const challenge = sequence[index];
    challengeStartTimeRef.current = Date.now();
    statusRef.current = 'challenge_active';
    updateLiveness({
      status: 'challenge_active',
      currentChallenge: challenge,
      challengeProgress: 0,
      challengeIndex: index,
      totalChallenges: TOTAL_CHALLENGES,
      instruction: CHALLENGE_INSTRUCTIONS[challenge],
      timeRemaining: CHALLENGE_TIMEOUT_MS,
    });
  }, [updateLiveness]);

  // ── Verified handler ──────────────────────────────────────────────────────
  const handleVerified = useCallback(() => {
    statusRef.current = 'verified';
    updateLiveness({
      status: 'verified',
      currentChallenge: null,
      challengeProgress: 1,
      instruction: 'Liveness Verified ✓',
      timeRemaining: 0,
    });
    onVerifiedRef.current?.();
  }, [updateLiveness]);

  // ── Failed/retry handler ──────────────────────────────────────────────────
  const handleFailed = useCallback((canRetry: boolean) => {
    if (canRetry) {
      statusRef.current = 'retrying';
      useAppStore.getState().setLivenessStatus('retrying');
      retryTimerRef.current = setTimeout(() => {
        const sequence = generateChallengeSequence(TOTAL_CHALLENGES);
        challengeSequenceRef.current = sequence;
        challengeIndexRef.current = 0;
        startNextChallenge(0, sequence);
      }, 1500);
    } else {
      statusRef.current = 'failed';
      updateLiveness({
        status: 'failed',
        currentChallenge: null,
        instruction: 'Verification failed. Please try again.',
        timeRemaining: 0,
      });
      onFailedRef.current?.();
    }
  }, [updateLiveness, startNextChallenge]);

  // ── Reset session ─────────────────────────────────────────────────────────
  const resetSession = useCallback(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    statusRef.current = 'idle';
    challengeSequenceRef.current = [];
    challengeIndexRef.current = 0;
    challengeStartTimeRef.current = 0;
    retryCountRef.current = 0;
    faceFirstSeenRef.current = 0;
    useAppStore.getState().resetLiveness();
  }, []);

  // ── Main frame evaluation effect ──────────────────────────────────────────
  //
  // DEPENDENCY RULE:
  // Only include STATE VALUES (livenessFrameBuffer, detectedFaces, isActive, maxRetries).
  // The callbacks (updateLiveness, startNextChallenge, handleVerified, handleFailed)
  // have empty or deeply-stable deps and WON'T change between renders — but even if
  // React saw them as new, adding them here would re-trigger the loop.
  // We intentionally omit them and suppress the lint warning.
  //
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isActive) return;

    const status = statusRef.current;
    const hasFace = detectedFaces.length > 0;
    const buffer = livenessFrameBuffer;

    // ── No face ─────────────────────────────────────────────────────────────
    if (!hasFace) {
      faceFirstSeenRef.current = 0;
      if (status !== 'waiting_for_face') {
        statusRef.current = 'waiting_for_face';
        updateLiveness({
          status: 'waiting_for_face',
          currentChallenge: null,
          instruction: 'Position your face in the frame',
          timeRemaining: 0,
        });
      }
      return;
    }

    // ── Terminal states — no further evaluation ──────────────────────────────
    if (status === 'verified' || status === 'failed' || status === 'retrying') return;

    // ── Face appeared — start settling ───────────────────────────────────────
    if (status === 'idle' || status === 'waiting_for_face') {
      if (faceFirstSeenRef.current === 0) faceFirstSeenRef.current = Date.now();
      statusRef.current = 'face_stable';
      updateLiveness({ status: 'face_stable', instruction: 'Hold still...', challengeProgress: 0 });
      return;
    }

    // ── Settling / baseline ──────────────────────────────────────────────────
    if (status === 'face_stable') {
      const elapsed = Date.now() - faceFirstSeenRef.current;
      const progress = Math.min(elapsed / FACE_STABLE_DELAY_MS, 1);

      if (elapsed < FACE_STABLE_DELAY_MS || !isFaceStable(buffer)) {
        // Update progress bar without changing status — use getState() to avoid loop
        useAppStore.getState().setLivenessState({ challengeProgress: progress });
        return;
      }

      // Ready — issue first challenge
      const sequence = generateChallengeSequence(TOTAL_CHALLENGES);
      challengeSequenceRef.current = sequence;
      challengeIndexRef.current = 0;
      startNextChallenge(0, sequence);
      return;
    }

    // ── Active challenge ─────────────────────────────────────────────────────
    if (status === 'challenge_active') {
      const index = challengeIndexRef.current;
      const sequence = challengeSequenceRef.current;
      const challenge = sequence[index];
      if (!challenge) return;

      const elapsed = Date.now() - challengeStartTimeRef.current;
      const timeRemaining = Math.max(0, CHALLENGE_TIMEOUT_MS - elapsed);
      const progress = Math.min(elapsed / CHALLENGE_TIMEOUT_MS, 1);

      // Update timeout bar — getState() avoids triggering this effect
      useAppStore.getState().setLivenessState({ timeRemaining, challengeProgress: progress });

      if (elapsed >= CHALLENGE_TIMEOUT_MS) {
        retryCountRef.current++;
        handleFailed(retryCountRef.current < maxRetries);
        return;
      }

      if (evaluateChallenge(challenge, buffer)) {
        statusRef.current = 'challenge_passed';
        const nextIndex = index + 1;
        if (nextIndex >= sequence.length) {
          handleVerified();
        } else {
          useAppStore.getState().setLivenessState({
            status: 'challenge_passed',
            challengeProgress: 1,
            instruction: '✓ Done!',
          });
          challengeIndexRef.current = nextIndex;
          setTimeout(() => startNextChallenge(nextIndex, sequence), 600);
        }
      }
    }
  }, [livenessFrameBuffer, detectedFaces, isActive, maxRetries]); // ← STATE ONLY

  // ── Cleanup on deactivate ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) resetSession();
    return () => { if (retryTimerRef.current) clearTimeout(retryTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  return { livenessState, resetLiveness: resetSession };
}
