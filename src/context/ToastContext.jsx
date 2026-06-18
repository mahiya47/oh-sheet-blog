import { createContext, useCallback, useContext, useState } from 'react';

/* Lightweight toasts. These replace the wall of alert()/confirm() calls in
   the original (e.g. "Reposted!", "Settings saved!", "Sign in first!"),
   which blocked the UI and felt unfinished. */

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, variant = 'default') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((list) => [...list, { id, message, variant }]);
    setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-wrap" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.variant}`} role="status">
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
