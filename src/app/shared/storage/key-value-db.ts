/**
 * Minimal IndexedDB key-value store. Works both in the page and in the service worker,
 * which has no access to `localStorage`.
 */
import { DB_NAME, DB_VERSION, STORE_NAME } from './key-value-db.constants';

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

/**
 * Reads a value from IndexedDB.
 * `parse` validates it because stored data may come from an older schema version.
 */
export async function readValue<T>(key: string, parse: (value: unknown) => T): Promise<T> {
  const value: unknown = await withStore('readonly', (store) => store.get(key));
  return parse(value);
}

/** Writes `value` to IndexedDB under `key`, replacing any existing entry. */
export async function writeValue(key: string, value: unknown): Promise<void> {
  await withStore('readwrite', (store) => store.put(value, key));
}

/** Removes the entry for `key` from IndexedDB. */
export async function deleteValue(key: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(key));
}
