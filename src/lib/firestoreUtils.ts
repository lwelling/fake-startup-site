import {
  collection,
  getDocs,
  limit,
  query,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { db } from './firebase';

export function getDb(): Firestore {
  if (!db) {
    throw new Error('Firebase is not configured. Please provide the required environment variables.');
  }
  return db;
}

export async function chunkedDelete(collectionPath: string, batchSize = 250): Promise<void> {
  const database = getDb();
  const segments = collectionPath.split('/').filter(Boolean);
  if (!segments.length) return;
  const colRef = collection(database, ...segments);

  // Loop until collection empty
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const snapshot = await getDocs(query(colRef, limit(batchSize)));
    if (snapshot.empty) {
      break;
    }
    const batch = writeBatch(database);
    snapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  }
}
