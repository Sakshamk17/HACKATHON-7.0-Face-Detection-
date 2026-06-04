
// import { getDB } from '../sqlite';
// import { randomUUID } from 'crypto';

// export const enqueueSync = (payload: object): void => {
//   const db = getDB();
//   db.prepare(
//     `INSERT INTO sync_queue (id, payload, status, created_at) VALUES (?, ?, 'pending', ?)`
//   ).run(
//     randomUUID(),
//     JSON.stringify(payload),
//     new Date().toISOString()
//   );
// };

// export const getPendingSyncs = (): any[] => {
//   const db = getDB();
//   return db.prepare(`SELECT * FROM sync_queue WHERE status = 'pending'`).all();
// };

// export const markQueueItemDone = (id: string): void => {
//   const db = getDB();
//   db.prepare(`UPDATE sync_queue SET status = 'done' WHERE id = ?`).run(id);
// };

// export const purgeDoneItems = (): void => {
//   const db = getDB();
//   db.prepare(`DELETE FROM sync_queue WHERE status = 'done'`).run();
// };

// mobile/backend/db/repositories/syncQueueRepo.ts
import { getDB } from '../sqlite';
import { randomUUID } from 'expo-crypto';

export const enqueueSync = (payload: object): void => {
  const db = getDB();
  db.runSync(
    `INSERT INTO sync_queue (id, payload, status, created_at) VALUES (?, ?, 'pending', ?)`,
    randomUUID(), JSON.stringify(payload), new Date().toISOString()
  );
};

export const getPendingSyncs = (): any[] => {
  const db = getDB();
  return db.getAllSync(`SELECT * FROM sync_queue WHERE status = 'pending'`);
};

export const markQueueItemDone = (id: string): void => {
  const db = getDB();
  db.runSync(`UPDATE sync_queue SET status = 'done' WHERE id = ?`, id);
};

export const purgeDoneItems = (): void => {
  const db = getDB();
  db.runSync(`DELETE FROM sync_queue WHERE status = 'done'`);
};