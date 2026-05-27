// import { getDB } from '../sqlite';

// export const storeEmbedding = async (
//   userId: string,
//   embeddingBase64: string,  // ML team will confirm format
//   isEncrypted: boolean = true
// ): Promise<void> => {
//   const db = await getDB();

//   await db.executeSql(
//     `INSERT INTO embeddings (user_id, embedding, encrypted) VALUES (?, ?, ?)`,
//     [userId, embeddingBase64, isEncrypted ? 1 : 0]
//   );
// };

// export const getEmbeddingForUser = async (
//   userId: string
// ): Promise<string | null> => {
//   const db = await getDB();
//   const [result] = await db.executeSql(
//     `SELECT embedding FROM embeddings WHERE user_id = ? LIMIT 1`,
//     [userId]
//   );

//   if (result.rows.length === 0) return null;
//   return result.rows.item(0).embedding;
// };

import { getDB } from '../sqlite';

export const storeEmbedding = (
  userId: string,
  embeddingBase64: string,
  isEncrypted: boolean = true
): void => {
  const db = getDB();
  db.prepare(
    `INSERT INTO embeddings (user_id, embedding, encrypted) VALUES (?, ?, ?)`
  ).run(userId, embeddingBase64, isEncrypted ? 1 : 0);
};

export const getEmbeddingForUser = (userId: string): string | null => {
  const db = getDB();
  const row = db.prepare(
    `SELECT embedding FROM embeddings WHERE user_id = ? LIMIT 1`
  ).get(userId) as any;
  return row ? row.embedding : null;
};