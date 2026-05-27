
// // backend/db/sqlite.ts
// import Database from 'better-sqlite3';
// import path from 'path';

// let dbInstance: Database.Database | null = null;

// export const getDB = (): Database.Database => {
//   if (dbInstance) return dbInstance;

//   dbInstance = new Database(path.join(__dirname, 'faceid.db'));
//   console.log('[DB] Connected');
//   return dbInstance;
// };


// mobile/backend/db/sqlite.ts
import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDB = (): SQLite.SQLiteDatabase => {
  if (dbInstance) return dbInstance;

  dbInstance = SQLite.openDatabaseSync('faceid.db');
  console.log('[DB] Connected');
  return dbInstance;
};