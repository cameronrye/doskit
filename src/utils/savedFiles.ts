/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * The files a program saved, kept per app in the browser's IndexedDB: the bundle
 * ci.persist(true) packed, which comes back after the app's archive at its next start.
 * Every call rejects where IndexedDB is unavailable or full, such as in some private
 * windows: callers then run the app without them and say that files can't be kept.
 *
 * jsdom has no IndexedDB, so this module is left out of the unit tests' coverage; the
 * browser tests (e2e/trackers.spec.ts) save, reload and download through it.
 */

export interface SavedFiles {
  /** The bundle: a ZIP archive of the files that differ from the app's archive */
  bytes: Uint8Array;
  /** When it was written, in milliseconds since 1970 */
  savedAt: number;
}

const DATABASE = 'doskit';
const STORE = 'saved-files';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'));
      return;
    }
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB did not open'));
    request.onblocked = () => reject(new Error('IndexedDB is blocked by another tab'));
  });
}

async function transact<T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest | void
): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      const request = work(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve((request?.result ?? undefined) as T);
      transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB failed'));
      transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB aborted'));
    });
  } finally {
    db.close();
  }
}

/** The files saved for an app, or null when there are none */
export async function getSavedFiles(appId: string): Promise<SavedFiles | null> {
  const found = await transact<SavedFiles | undefined>('readonly', (store) => store.get(appId));
  return found && found.bytes instanceof Uint8Array ? found : null;
}

export function putSavedFiles(appId: string, bytes: Uint8Array): Promise<void> {
  const entry: SavedFiles = { bytes: bytes.slice(), savedAt: Date.now() };
  return transact<void>('readwrite', (store) => {
    store.put(entry, appId);
  });
}

export function removeSavedFiles(appId: string): Promise<void> {
  return transact<void>('readwrite', (store) => {
    store.delete(appId);
  });
}
