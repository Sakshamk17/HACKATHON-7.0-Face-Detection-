// What ML team (Team C) sends after recognition
export interface RecognitionOutput {
  userId: string;
  confidence: number;
  livenessPassed: boolean;
}

// What gets queued and sent to AWS
export interface SyncPayload {
  userId: string;
  confidence: number;
  livenessPassed: boolean;
  deviceId: string;
  timestamp: string;
}