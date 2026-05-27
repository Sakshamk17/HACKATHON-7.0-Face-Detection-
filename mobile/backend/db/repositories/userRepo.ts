// import { getDB } from '../sqlite';

// export const addUser = (id: string, name: string): void => {
//   const db = getDB();
//   db.prepare(
//     `INSERT OR IGNORE INTO users (id, name, created_at) VALUES (?, ?, ?)`
//   ).run(id, name, new Date().toISOString());
//   console.log(`[userRepo] Added user: ${name}`);
// };

// export const getAllUsers = (): any[] => {
//   const db = getDB();
//   return db.prepare(`SELECT * FROM users`).all();
// };

// mobile/backend/db/repositories/userRepo.ts
import { getDB } from '../sqlite';

export const addUser = (id: string, name: string): void => {
  const db = getDB();
  db.runSync(
    `INSERT OR IGNORE INTO users (id, name, created_at) VALUES (?, ?, ?)`,
    id, name, new Date().toISOString()
  );
  console.log(`[userRepo] Added user: ${name}`);
};

export const getAllUsers = (): any[] => {
  const db = getDB();
  return db.getAllSync(`SELECT * FROM users`);
};