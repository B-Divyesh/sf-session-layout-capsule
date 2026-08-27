import type { Layout } from './types';

const DB_NAME = 'session-layout-capsule';
const STORE = 'layouts';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Local storage could not be opened. Check private browsing or storage permissions.'));
  });
}

async function withStore<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = operation(transaction.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('The change could not be saved locally. Try again.'));
    transaction.oncomplete = () => db.close();
  });
}

export const listLayouts = async (): Promise<Layout[]> => {
  const layouts = await withStore<Layout[]>('readonly', (store) => store.getAll());
  return layouts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const saveLayout = (layout: Layout): Promise<IDBValidKey> => withStore('readwrite', (store) => store.put(layout));
export const deleteLayout = (id: string): Promise<undefined> => withStore('readwrite', (store) => store.delete(id));

export async function replaceLayouts(layouts: Layout[]): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    const store = transaction.objectStore(STORE);
    store.clear();
    layouts.forEach((layout) => store.put(layout));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('The imported layouts could not be saved.'));
  });
  db.close();
}
