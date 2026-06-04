
// import { getDB } from '../sqlite';
// import { randomUUID } from 'crypto';

// export const logAuthEvent = (
//   userId: string,
//   confidence: number,
//   livenessPassed: boolean,
//   deviceId: string
// ): void => {
//   const db = getDB();
//   db.prepare(
//     `INSERT INTO auth_events 
//       (id, user_id, confidence, liveness_passed, device_id, timestamp, synced)
//      VALUES (?, ?, ?, ?, ?, ?, 0)`
//   ).run(
//     randomUUID(),
//     userId,
//     confidence,
//     livenessPassed ? 1 : 0,
//     deviceId,
//     new Date().toISOString()
//   );
// };

// export const getUnsyncedEvents = (): any[] => {
//   const db = getDB();
//   return db.prepare(`SELECT * FROM auth_events WHERE synced = 0`).all();
// };

// export const markEventSynced = (id: string): void => {
//   const db = getDB();
//   db.prepare(`UPDATE auth_events SET synced = 1 WHERE id = ?`).run(id);
// };

// export const deleteSyncedEvents = (): void => {
//   const db = getDB();
//   db.prepare(`DELETE FROM auth_events WHERE synced = 1`).run();
// };

// mobile/backend/db/repositories/authEventRepo.ts
import { getDB } from '../sqlite';
import { randomUUID } from 'expo-crypto';

export const logAuthEvent = (
  userId: string,
  confidence: number,
  livenessPassed: boolean,
  deviceId: string
): void => {
  const db = getDB();
  db.runSync(
    `INSERT INTO auth_events 
      (id, user_id, confidence, liveness_passed, device_id, timestamp, synced)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    randomUUID(), userId, confidence,
    livenessPassed ? 1 : 0, deviceId,
    new Date().toISOString()
  );
};

export const getUnsyncedEvents = (): any[] => {
  const db = getDB();
  return db.getAllSync(`SELECT * FROM auth_events WHERE synced = 0`);
};

export const markEventSynced = (id: string): void => {
  const db = getDB();
  db.runSync(`UPDATE auth_events SET synced = 1 WHERE id = ?`, id);
};

export const deleteSyncedEvents = (): void => {
  const db = getDB();
  db.runSync(`DELETE FROM auth_events WHERE synced = 1`);
};