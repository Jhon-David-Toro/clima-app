/**
 * Minimal IndexedDB key-value store. It works both in the page and in the service worker, which
 * has no access to `localStorage`.
 */

const DB_NAME = 'clima-app';
const STORE_NAME = 'key-value';
const DB_VERSION = 1;

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDB request failed'));
    };
  });
}

function openDatabase(): Promise<IDBDatabase> {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
  return promisify(request);
}

async function withStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDatabase();
  try {
    return await promisify(operation(db.transaction(STORE_NAME, mode).objectStore(STORE_NAME)));
  } finally {
    db.close();
  }
}

/** Reads a value; `parse` validates it because stored data may come from an older version. */
export async function readValue<T>(key: string, parse: (value: unknown) => T): Promise<T> {
  const value: unknown = await withStore('readonly', (store) => store.get(key));
  return parse(value);
}

export async function writeValue(key: string, value: unknown): Promise<void> {
  await withStore('readwrite', (store) => store.put(value, key));
}

export async function deleteValue(key: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(key));
}
