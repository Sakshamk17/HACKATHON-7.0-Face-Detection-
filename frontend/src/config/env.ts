export const ENV = {
  APP_NAME: 'OfflineFaceAuth',
  IS_PRODUCTION: false,
  BACKEND_URL: 'http://localhost:8080',
  // Future configurations for TFLite/MediaPipe thresholds
  FACE_MATCH_THRESHOLD: 0.6,
  LIVENESS_THRESHOLD: 0.9,
  // SQLite configuration
  DB_NAME: 'offline_auth.db',
};
