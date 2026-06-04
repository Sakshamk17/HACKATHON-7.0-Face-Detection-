
// // backend/db/schema.ts
// import { getDB } from './sqlite';

// export const initDB = (): void => {
//   const db = getDB();

//   db.exec(`
//     CREATE TABLE IF NOT EXISTS users (
//       id TEXT PRIMARY KEY,
//       name TEXT NOT NULL,
//       created_at TEXT NOT NULL
//     );
//   `);

//   db.exec(`
//     CREATE TABLE IF NOT EXISTS embeddings (
//       user_id TEXT NOT NULL,
//       embedding TEXT NOT NULL,
//       encrypted INTEGER NOT NULL DEFAULT 1
//     );
//   `);

//   db.exec(`
//     CREATE TABLE IF NOT EXISTS auth_events (
//       id TEXT PRIMARY KEY,
//       user_id TEXT NOT NULL,
//       confidence REAL NOT NULL,
//       liveness_passed INTEGER NOT NULL,
//       device_id TEXT NOT NULL,
//       timestamp TEXT NOT NULL,
//       synced INTEGER NOT NULL DEFAULT 0
//     );
//   `);

//   db.exec(`
//     CREATE TABLE IF NOT EXISTS sync_queue (
//       id TEXT PRIMARY KEY,
//       payload TEXT NOT NULL,
//       status TEXT NOT NULL DEFAULT 'pending',
//       created_at TEXT NOT NULL
//     );
//   `);

//   console.log('[DB] Schema initialized ✅');
// };

// mobile/backend/db/schema.ts
import { getDB } from './sqlite';

export const initDB = (): void => {
  const db = getDB();

  db.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS embeddings (
      user_id TEXT NOT NULL,
      embedding TEXT NOT NULL,
      encrypted INTEGER NOT NULL DEFAULT 1
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS auth_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      confidence REAL NOT NULL,
      liveness_passed INTEGER NOT NULL,
      device_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    );
  `);

  console.log('[DB] Schema initialized ✅');
};