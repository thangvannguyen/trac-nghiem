import { useEffect, type ReactNode } from 'react';
import { IconX } from '../icons';

export default function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`animate-pop card max-h-[92vh] w-full overflow-y-auto rounded-b-none p-5 sm:rounded-blob sm:p-6 ${
          wide ? 'sm:max-w-2xl' : 'sm:max-w-md'
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-black">{title}</h2>
          <button className="btn-ghost" onClick={onClose} aria-label="Đóng">
            <IconX />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
