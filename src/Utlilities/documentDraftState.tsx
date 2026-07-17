import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type DocumentDraftRegistration = {
  isDirty: boolean;
  onDiscard: () => void;
  stagedAssetIds: readonly string[];
};

export type DocumentDraftAggregate = {
  dirtyCount: number;
  hasDirtyDraft: boolean;
  stagedAssetIds: readonly string[];
};

export function getDocumentDraftAggregate(
  registrations: Iterable<DocumentDraftRegistration>
): DocumentDraftAggregate {
  const dirtyRegistrations = [...registrations].filter(
    (registration) => registration.isDirty
  );
  return {
    dirtyCount: dirtyRegistrations.length,
    hasDirtyDraft: dirtyRegistrations.length > 0,
    stagedAssetIds: Array.from(
      new Set(
        dirtyRegistrations.flatMap((registration) =>
          registration.stagedAssetIds.filter(Boolean)
        )
      )
    ),
  };
}

export function discardDocumentDraftRegistrations(
  registrations: Iterable<DocumentDraftRegistration>
): void {
  for (const registration of registrations) {
    if (registration.isDirty) {
      registration.onDiscard();
    }
  }
}

export function createDocumentDraftRegistry() {
  const registrations = new Map<string, DocumentDraftRegistration>();
  return {
    discardDirtyDrafts(): void {
      discardDocumentDraftRegistrations(registrations.values());
    },
    getAggregate(): DocumentDraftAggregate {
      return getDocumentDraftAggregate(registrations.values());
    },
    register(
      id: string,
      registration: DocumentDraftRegistration
    ): () => boolean {
      registrations.set(id, registration);
      return () => {
        if (registrations.get(id) !== registration) {
          return false;
        }
        return registrations.delete(id);
      };
    },
  };
}

type DocumentDraftStateContextValue = {
  discardDirtyDrafts: () => void;
  hasDirtyDraft: boolean;
  stagedAssetIds: readonly string[];
  register: (id: string, registration: DocumentDraftRegistration) => () => void;
};

const DocumentDraftStateContext =
  createContext<DocumentDraftStateContextValue | null>(null);

export function DocumentDraftStateProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [registry] = useState(createDocumentDraftRegistry);
  const [version, setVersion] = useState(0);
  const register = useCallback(
    (id: string, registration: DocumentDraftRegistration) => {
      const unregister = registry.register(id, registration);
      setVersion((current) => current + 1);
      return () => {
        if (unregister()) {
          setVersion((current) => current + 1);
        }
      };
    },
    [registry]
  );
  const aggregate = useMemo(() => registry.getAggregate(), [registry, version]);
  const discardDirtyDrafts = useCallback(() => {
    registry.discardDirtyDrafts();
  }, [registry]);
  const value = useMemo<DocumentDraftStateContextValue>(
    () => ({
      discardDirtyDrafts,
      hasDirtyDraft: aggregate.hasDirtyDraft,
      register,
      stagedAssetIds: aggregate.stagedAssetIds,
    }),
    [aggregate, discardDirtyDrafts, register]
  );
  return (
    <DocumentDraftStateContext.Provider value={value}>
      {children}
    </DocumentDraftStateContext.Provider>
  );
}

export function useDocumentDraftState(): Omit<
  DocumentDraftStateContextValue,
  'register'
> {
  const context = useContext(DocumentDraftStateContext);
  if (!context) {
    throw new Error(
      'useDocumentDraftState must be used inside DocumentDraftStateProvider.'
    );
  }
  return context;
}

export function useDocumentDraftRegistration({
  isDirty,
  onDiscard,
  stagedAssetIds = [],
}: {
  isDirty: boolean;
  onDiscard: () => void;
  stagedAssetIds?: readonly string[];
}): void {
  const context = useContext(DocumentDraftStateContext);
  const register = context?.register;
  const id = useId();
  const onDiscardRef = useRef(onDiscard);
  onDiscardRef.current = onDiscard;
  const stagedAssetIdsRef = useRef(stagedAssetIds);
  stagedAssetIdsRef.current = stagedAssetIds;
  const stagedAssetKey = stagedAssetIds.join('\u001f');
  useEffect(() => {
    if (!register) {
      return undefined;
    }
    return register(id, {
      isDirty,
      onDiscard: () => onDiscardRef.current(),
      stagedAssetIds: [...stagedAssetIdsRef.current],
    });
  }, [id, isDirty, register, stagedAssetKey]);
}
