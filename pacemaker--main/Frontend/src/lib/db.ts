// IndexedDB Helpers for Permanent Local Storage
const DB_NAME = 'LMS_Videos_DB';
const STORE_NAME = 'videos';

const isBrowser = typeof window !== 'undefined';

export const openDB = (): Promise<IDBDatabase> => {
  if (!isBrowser) return Promise.reject(new Error('IndexedDB is not available on the server.'));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveVideoToDB = async (id: string, blob: Blob): Promise<void> => {
  if (!isBrowser) return;
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(blob, id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getVideoFromDB = async (id: string): Promise<Blob | null> => {
  if (!isBrowser) return null;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const deleteVideoFromDB = async (id: string): Promise<void> => {
  if (!isBrowser) return;
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};
