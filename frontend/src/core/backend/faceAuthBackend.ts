import { ENV } from '../../config/env';
import type { AttendanceRecord, User } from '../../types';
import {
  addUser,
  createLocalId,
  enqueueSync,
  getAllAuthEvents,
  getAllEmbeddings,
  getAllUsers,
  initLocalDatabase,
  logAuthEvent,
  storeEmbedding,
} from './localDatabase';

export type EnrollmentRequest = {
  name: string;
  embedding: number[];
};

export type EnrollmentImageRequest = {
  name: string;
  imageUri: string;
};

export type EnrollmentResponse = {
  user: User;
  saved: true;
  modelUsed?: boolean;
};

export type VerificationRequest = {
  embedding: number[];
  livenessPassed: boolean;
  deviceId: string;
};

export type VerificationImageRequest = {
  imageUri: string;
  livenessPassed: boolean;
  deviceId: string;
};

export type VerificationResponse = {
  status: AttendanceRecord['status'];
  confidence: number;
  livenessPassed: boolean;
  modelUsed?: boolean;
  user: User | null;
  record: AttendanceRecord;
  message: string;
};

const postJson = async <ResponseBody,>(
  path: '/enroll' | '/verify',
  payload: object,
): Promise<ResponseBody | null> => {
  if (!ENV.BACKEND_URL) return null;

  try {
    const response = await fetch(`${ENV.BACKEND_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) return null;
    return await response.json() as ResponseBody;
  } catch (error) {
    if (__DEV__) {
      console.warn('[FaceAuthBackend] API fallback:', error);
    }
    return null;
  }
};

const imageUriToBase64 = async (imageUri: string): Promise<string> => {
  const response = await fetch(imageUri);
  const blob = await response.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read camera image'));
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Camera image conversion failed'));
        return;
      }

      resolve(result);
    };
    reader.readAsDataURL(blob);
  });
};

const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;

  let dot = 0;
  let aMagnitude = 0;
  let bMagnitude = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    aMagnitude += a[index] * a[index];
    bMagnitude += b[index] * b[index];
  }

  if (aMagnitude === 0 || bMagnitude === 0) return 0;
  return dot / (Math.sqrt(aMagnitude) * Math.sqrt(bMagnitude));
};

const findBestMatch = (embedding: number[]): { user: User; confidence: number } | null => {
  const embeddings = getAllEmbeddings();
  const users = getAllUsers();
  let bestMatch: { user: User; confidence: number } | null = null;

  embeddings.forEach((storedEmbedding) => {
    const user = users.find((item) => item.id === storedEmbedding.userId);
    if (!user) return;

    const confidence = cosineSimilarity(embedding, storedEmbedding.embedding);
    if (!bestMatch || confidence > bestMatch.confidence) {
      bestMatch = { user, confidence };
    }
  });

  return bestMatch;
};

export const enrollFace = async ({
  name,
  embedding,
}: EnrollmentRequest): Promise<EnrollmentResponse> => {
  const apiResponse = await postJson<EnrollmentResponse>('/enroll', { name, embedding });
  if (apiResponse) return apiResponse;

  initLocalDatabase();

  const now = new Date().toISOString();
  const user: User = {
    id: createLocalId('user'),
    name,
    enrolledAt: now,
  };

  addUser(user);
  storeEmbedding(user.id, embedding, true);

  return { user, saved: true };
};

export const enrollFaceFromImage = async ({
  name,
  imageUri,
}: EnrollmentImageRequest): Promise<EnrollmentResponse> => {
  if (!ENV.BACKEND_URL) {
    throw new Error('ML backend URL is not configured');
  }

  const imageBase64 = await imageUriToBase64(imageUri);
  const apiResponse = await postJson<EnrollmentResponse>('/enroll', { name, imageBase64 });
  if (!apiResponse) {
    throw new Error('ML backend enrollment failed');
  }

  return apiResponse;
};

export const verifyFace = async ({
  embedding,
  livenessPassed,
  deviceId,
}: VerificationRequest): Promise<VerificationResponse> => {
  const apiResponse = await postJson<VerificationResponse>('/verify', {
    embedding,
    livenessPassed,
    deviceId,
  });
  if (apiResponse) return apiResponse;

  initLocalDatabase();

  const bestMatch = livenessPassed ? findBestMatch(embedding) : null;
  const threshold = ENV.FACE_MATCH_THRESHOLD;
  const isRecognized = Boolean(bestMatch && bestMatch.confidence >= threshold);
  const user = isRecognized && bestMatch ? bestMatch.user : null;
  const confidence = bestMatch?.confidence ?? 0;
  const timestamp = new Date().toISOString();
  const status: AttendanceRecord['status'] =
    livenessPassed && isRecognized ? 'SUCCESS' : 'FAILED';

  const record: AttendanceRecord = {
    id: createLocalId('auth'),
    userId: user?.id ?? 'UNKNOWN',
    userName: user?.name ?? 'Unknown User',
    timestamp,
    status,
    confidence,
    livenessPassed,
    deviceId,
  };

  logAuthEvent(record);
  enqueueSync({
    userId: record.userId,
    confidence,
    livenessPassed,
    deviceId,
    timestamp,
    status,
  });

  return {
    status,
    confidence,
    livenessPassed,
    user,
    record,
    message: status === 'SUCCESS'
      ? `Verified ${user?.name ?? 'user'}`
      : livenessPassed
        ? 'No matching enrolled face found'
        : 'Liveness verification failed',
  };
};

export const verifyFaceFromImage = async ({
  imageUri,
  livenessPassed,
  deviceId,
}: VerificationImageRequest): Promise<VerificationResponse> => {
  if (!ENV.BACKEND_URL) {
    throw new Error('ML backend URL is not configured');
  }

  const imageBase64 = await imageUriToBase64(imageUri);
  const apiResponse = await postJson<VerificationResponse>('/verify', {
    imageBase64,
    livenessPassed,
    deviceId,
  });
  if (!apiResponse) {
    throw new Error('ML backend verification failed');
  }

  return apiResponse;
};

export const getFaceAuthSnapshot = (): {
  users: User[];
  attendanceRecords: AttendanceRecord[];
} => ({
  users: getAllUsers(),
  attendanceRecords: getAllAuthEvents(),
});
