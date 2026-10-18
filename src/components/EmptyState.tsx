import type { ReactNode } from 'react';
import { EmptyBox } from '../icons';

export default function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-blob border-2 border-dashed border-ink/10 px-6 py-10 text-center">
      <EmptyBox />
      <h3 className="text-lg font-black">{title}</h3>
      {children}
    </div>
  );
}
