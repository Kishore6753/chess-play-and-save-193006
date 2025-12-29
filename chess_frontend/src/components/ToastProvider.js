import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// PUBLIC_INTERFACE
export function useToasts() {
  /** Hook to push and dismiss toast notifications. */
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToasts must be used within <ToastProvider>');
  return ctx;
}

// PUBLIC_INTERFACE
export default function ToastProvider({ children }) {
  /** Provider for toast notifications across the app. */
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((toast) => {
    const id = makeId();
    const t = {
      id,
      type: toast.type || 'info', // info | success | error
      title: toast.title || (toast.type === 'error' ? 'Oops' : 'Notice'),
      message: toast.message || '',
      timeoutMs: toast.timeoutMs ?? 4500,
    };

    setToasts((prev) => [t, ...prev].slice(0, 4));

    if (t.timeoutMs > 0) {
      window.setTimeout(() => dismiss(id), t.timeoutMs);
    }

    return id;
  }, [dismiss]);

  const api = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toastStack" aria-live="polite" aria-relevant="additions removals">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              'toast',
              t.type === 'success' ? 'toastSuccess' : '',
              t.type === 'error' ? 'toastError' : '',
              t.type === 'info' ? 'toastInfo' : '',
            ].join(' ')}
            role="status"
          >
            <div>
              <p className="toastTitle">{t.title}</p>
              <p className="toastMsg">{t.message}</p>
            </div>
            <button className="toastClose" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
