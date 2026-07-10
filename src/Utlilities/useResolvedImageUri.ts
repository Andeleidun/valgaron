import { useEffect, useState } from 'react';
import { getUploadedAssetIdFromUri, isRemoteImageUri } from '@valgaron/core';
import { readImageAssetBlob } from './imageAssetStorage';

export type ResolvedImageUri = {
  src: string | null;
  state: 'loading' | 'available' | 'missing';
};

export function useResolvedImageUri(uri: string): ResolvedImageUri {
  const [resolved, setResolved] = useState<ResolvedImageUri>(() =>
    isRemoteImageUri(uri)
      ? { src: uri, state: 'available' }
      : { src: null, state: 'loading' }
  );

  useEffect(() => {
    if (isRemoteImageUri(uri)) {
      setResolved({ src: uri, state: 'available' });
      return;
    }
    const assetId = getUploadedAssetIdFromUri(uri);
    if (!assetId) {
      setResolved({ src: null, state: 'missing' });
      return;
    }
    let active = true;
    let objectUrl: string | null = null;
    setResolved({ src: null, state: 'loading' });
    void readImageAssetBlob(assetId).then((blob) => {
      if (!active) return;
      if (!blob || typeof URL === 'undefined') {
        setResolved({ src: null, state: 'missing' });
        return;
      }
      objectUrl = URL.createObjectURL(blob);
      setResolved({ src: objectUrl, state: 'available' });
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [uri]);

  return resolved;
}
