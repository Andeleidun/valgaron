import type { BinaryAsset, BinaryAssetRepository } from '@valgaron/platform';

const IMAGE_ASSET_DATABASE_NAME = 'valgaron.imageAssets.v1';
const IMAGE_ASSET_STORE_NAME = 'assets';
const IMAGE_ASSET_DATABASE_VERSION = 1;

type StoredBinaryAsset = {
  id: string;
  bytes: ArrayBuffer;
  mediaType: string;
};

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = (database: IDBDatabase | null) => {
      if (settled) {
        database?.close();
        return;
      }
      settled = true;
      resolve(database);
    };
    const request = indexedDB.open(
      IMAGE_ASSET_DATABASE_NAME,
      IMAGE_ASSET_DATABASE_VERSION
    );
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(IMAGE_ASSET_STORE_NAME)) {
        database.createObjectStore(IMAGE_ASSET_STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => finish(request.result);
    request.onerror = () => finish(null);
    request.onblocked = () => finish(null);
  });
}

async function runRequest<TResult>(
  mode: IDBTransactionMode,
  createRequest: (store: IDBObjectStore) => IDBRequest<TResult>
): Promise<TResult | null> {
  const database = await openDatabase();
  if (!database) return null;
  return new Promise((resolve) => {
    let result: TResult | null = null;
    let settled = false;
    const finish = (value: TResult | null) => {
      if (settled) return;
      settled = true;
      database.close();
      resolve(value);
    };
    const transaction = database.transaction(IMAGE_ASSET_STORE_NAME, mode);
    const request = createRequest(
      transaction.objectStore(IMAGE_ASSET_STORE_NAME)
    );
    request.onsuccess = () => {
      result = request.result;
    };
    request.onerror = () => {
      result = null;
    };
    transaction.onabort = () => finish(null);
    transaction.onerror = () => finish(null);
    transaction.oncomplete = () => finish(result);
  });
}

export const browserImageAssetRepository: BinaryAssetRepository = {
  async read(assetId) {
    const stored = await runRequest<StoredBinaryAsset | undefined>(
      'readonly',
      (store) => store.get(assetId)
    );
    return stored
      ? {
          bytes: new Uint8Array(stored.bytes.slice(0)),
          mediaType: stored.mediaType,
        }
      : null;
  },
  async write(assetId, asset) {
    const bytes = asset.bytes.slice().buffer;
    const result = await runRequest<IDBValidKey>('readwrite', (store) =>
      store.put({ id: assetId, bytes, mediaType: asset.mediaType })
    );
    return result !== null;
  },
  async remove(assetId) {
    const database = await openDatabase();
    if (!database) return false;
    return new Promise((resolve) => {
      let settled = false;
      const finish = (didRemove: boolean) => {
        if (settled) return;
        settled = true;
        database.close();
        resolve(didRemove);
      };
      const transaction = database.transaction(
        IMAGE_ASSET_STORE_NAME,
        'readwrite'
      );
      transaction.objectStore(IMAGE_ASSET_STORE_NAME).delete(assetId);
      transaction.oncomplete = () => {
        finish(true);
      };
      transaction.onerror = () => finish(false);
      transaction.onabort = () => finish(false);
    });
  },
  async listIds() {
    const result = await runRequest<IDBValidKey[]>('readonly', (store) =>
      store.getAllKeys()
    );
    return (result ?? []).filter(
      (key): key is string => typeof key === 'string'
    );
  },
};

export async function readImageAssetBlob(
  assetId: string
): Promise<Blob | null> {
  const asset = await browserImageAssetRepository.read(assetId);
  if (!asset) return null;
  const bytes = Uint8Array.from(asset.bytes).buffer;
  return new Blob([bytes], { type: asset.mediaType });
}

export async function writeImageAsset(
  assetId: string,
  asset: BinaryAsset
): Promise<boolean> {
  return browserImageAssetRepository.write(assetId, asset);
}
