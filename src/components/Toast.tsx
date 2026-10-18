import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { IconCheck, IconX } from '../icons';

type Kind = 'ok' | 'error';
interface Toast {
  id: number;
  text: string;
  kind: Kind;
}

const ToastContext = createContext<(text: string, kind?: Kind) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((text: string, kind: Kind = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`animate-pop flex items-center gap-2 rounded-2xl px-4 py-2.5 font-bold text-white shadow-soft ${
              t.kind === 'ok' ? 'bg-mint-500' : 'bg-rose-500'
            }`}
          >
            {t.kind === 'ok' ? <IconCheck size={18} /> : <IconX size={18} />}
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
