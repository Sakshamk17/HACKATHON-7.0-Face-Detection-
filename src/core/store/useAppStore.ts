import { create } from 'zustand';
import { User, AttendanceRecord, DetectedFaceResult, FaceDetectionStatus } from '../../types';

interface AppState {
  // ── App data ──────────────────────────────────────────────────────────────
  users: User[];
  attendanceRecords: AttendanceRecord[];
  isCameraReady: boolean;
  enrollUser: (user: User) => void;
  recordAttendance: (record: AttendanceRecord) => void;
  setCameraReady: (ready: boolean) => void;

  // ── Face detection state ──────────────────────────────────────────────────
  /** Currently detected faces with screen-mapped bounds */
  detectedFaces: DetectedFaceResult[];
  /** Detection pipeline status */
  detectionStatus: FaceDetectionStatus;
  /** Last detection timestamp (ms) for FPS calculation */
  lastDetectionTime: number;
  /** Rolling detection FPS (updated every N frames) */
  detectionFps: number;

  setDetectedFaces: (faces: DetectedFaceResult[]) => void;
  setDetectionStatus: (status: FaceDetectionStatus) => void;
  updateDetectionTiming: (fps: number) => void;
  resetDetectionState: () => void;
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
}));

