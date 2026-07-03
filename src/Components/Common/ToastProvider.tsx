import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Box } from './Box/Box';
import Toast from './Toast';

const defaultDismissLabel = 'Dismiss';

/**
 * Single toast item metadata.
 */
type ToastItem = {
  id: string;
  message: string;
};

/**
 * Toast context value shape.
 */
type ToastContextValue = {
  pushToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Hook for triggering global toast messages.
 */
export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider.');
  }
  return context;
};

type ToastProviderProps = {
  children: React.ReactNode;
  dismissLabel?: string;
};

/**
 * Provides a global toast container for the app shell.
 */
const ToastProvider = ({
  children,
  dismissLabel = defaultDismissLabel,
}: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const pushToast = useCallback((message: string) => {
    const nextId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id: nextId, message }]);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);
  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Box className="vwb-toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            closeLabel={dismissLabel}
            onClose={() => dismissToast(toast.id)}
          />
        ))}
      </Box>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
