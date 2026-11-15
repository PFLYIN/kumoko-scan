import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ToastViewport from '../components/ui/ToastViewport.jsx';
import { ToastContext } from './contextObjects.js';

const DURACAO_MS = { success: 4000, info: 4000, error: 6500 };

// Notificacoes nao bloqueantes (substituem alert()).
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const nextId = useRef(1);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    (type, message) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev.slice(-4), { id, type, message }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), DURACAO_MS[type] ?? 4000),
      );
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => clearTimeout(t));
  }, []);

  const value = useMemo(
    () => ({
      success: (message) => show('success', message),
      info: (message) => show('info', message),
      // Aceita string ou erro normalizado (ApiError) vindo do http.js.
      error: (errOrMessage) =>
        show('error', typeof errOrMessage === 'string' ? errOrMessage : (errOrMessage?.message ?? 'Algo deu errado.')),
      dismiss,
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
