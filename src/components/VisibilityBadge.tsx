import { IconGlobe, IconLink, IconLock } from '../icons';
import type { Visibility } from '../lib/types';

export const VISIBILITY_INFO: Record<Visibility, { label: string; hint: string; cls: string; Icon: typeof IconLock }> = {
  private: {
    label: 'Riêng tư',
    hint: 'Chỉ bạn và những người được mời qua email',
    cls: 'bg-ink/5 text-ink/60',
    Icon: IconLock,
  },
  link: {
    label: 'Có link',
    hint: 'Ai có link đều xem & học được (không hiện ở Khám phá)',
    cls: 'bg-sky-100 text-sky-500',
    Icon: IconLink,
  },
  public: {
    label: 'Công khai',
    hint: 'Hiện ở trang Khám phá, ai cũng học được',
    cls: 'bg-mint-100 text-mint-500',
    Icon: IconGlobe,
  },
};

export default function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  const v = VISIBILITY_INFO[visibility] ?? VISIBILITY_INFO.private;
  return (
    <span className={`chip ${v.cls}`}>
      <v.Icon size={13} strokeWidth={2.6} /> {v.label}
    </span>
  );
}
