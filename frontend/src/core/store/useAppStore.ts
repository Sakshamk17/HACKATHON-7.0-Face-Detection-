import { create } from 'zustand';
import {
  User,
  AttendanceRecord,
  DetectedFaceResult,
  FaceDetectionStatus,
  LivenessFrame,
  LivenessState,
  ChallengeType,
  LivenessStatus,
} from '../../types';

// ─── Initial liveness state ───────────────────────────────────────────────────

const INITIAL_LIVENESS: LivenessState = {
  status: 'idle',
  currentChallenge: null,
  challengeProgress: 0,
  challengeIndex: 0,
  totalChallenges: 2,
  instruction: '',
  timeRemaining: 0,
};

interface AppState {
  // ── App data ──────────────────────────────────────────────────────────────
  users: User[];
  attendanceRecords: AttendanceRecord[];
  isCameraReady: boolean;
  enrollUser: (user: User) => void;
  recordAttendance: (record: AttendanceRecord) => void;
  setCameraReady: (ready: boolean) => void;

  // ── Face detection state ──────────────────────────────────────────────────
  detectedFaces: DetectedFaceResult[];
  detectionStatus: FaceDetectionStatus;
  lastDetectionTime: number;
  detectionFps: number;

  setDetectedFaces: (faces: DetectedFaceResult[]) => void;
  setDetectionStatus: (status: FaceDetectionStatus) => void;
  updateDetectionTiming: (fps: number) => void;
  resetDetectionState: () => void;

  // ── Liveness state ────────────────────────────────────────────────────────
  /** Rolling buffer of recent liveness frames (max 15 frames) */
  livenessFrameBuffer: LivenessFrame[];
  /** Current liveness verification state */
  livenessState: LivenessState;

  pushLivenessFrame: (frame: LivenessFrame) => void;
  setLivenessState: (state: Partial<LivenessState>) => void;
  setLivenessStatus: (status: LivenessStatus) => void;
  setCurrentChallenge: (challenge: ChallengeType | null) => void;
  resetLiveness: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // ── App data ──────────────────────────────────────────────────────────────
  users: [],
  attendanceRecords: [],
  isCameraReady: false,
  enrollUser: (user) => set((state) => ({ users: [...state.users, user] })),
  recordAttendance: (record) =>
    set((state) => ({ attendanceRecords: [...state.attendanceRecords, record] })),
  setCameraReady: (ready) => set({ isCameraReady: ready }),

  // ── Face detection state ──────────────────────────────────────────────────
  detectedFaces: [],
  detectionStatus: 'idle',
  lastDetectionTime: 0,
  detectionFps: 0,

  setDetectedFaces: (faces) =>
    set({
      detectedFaces: faces,
      detectionStatus: faces.length > 0 ? 'face_detected' : 'no_face',
      lastDetectionTime: Date.now(),
    }),

  setDetectionStatus: (status) => set({ detectionStatus: status }),
  updateDetectionTiming: (fps) => set({ detectionFps: fps }),
  resetDetectionState: () =>
    set({
      detectedFaces: [],
      detectionStatus: 'idle',
      lastDetectionTime: 0,
      detectionFps: 0,
    }),

  // ── Liveness state ────────────────────────────────────────────────────────
  livenessFrameBuffer: [],
  livenessState: INITIAL_LIVENESS,

  pushLivenessFrame: (frame) =>
    set((state) => {
      const MAX_BUFFER = 15;
      const updated = [...state.livenessFrameBuffer, frame];
      return {
        livenessFrameBuffer: updated.length > MAX_BUFFER
          ? updated.slice(updated.length - MAX_BUFFER)
          : updated,
      };
    }),

  setLivenessState: (partial) =>
    set((state) => ({
      livenessState: { ...state.livenessState, ...partial },
    })),

  setLivenessStatus: (status) =>
    set((state) => ({
      livenessState: { ...state.livenessState, status },
    })),

  setCurrentChallenge: (challenge) =>
    set((state) => ({
      livenessState: { ...state.livenessState, currentChallenge: challenge },
    })),

  resetLiveness: () =>
    set({
      livenessFrameBuffer: [],
      livenessState: INITIAL_LIVENESS,
    }),
}));

