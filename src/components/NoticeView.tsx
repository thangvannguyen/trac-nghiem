import { useEffect, useState, type ReactNode } from 'react';
import type { Tone } from '../lib/admin';
import type { NoticeTemplate } from '../lib/notices';
import { IconMegaphone, IconVolume, IconVolumeOff, IconX, Owl } from '../icons';

/* Hiển thị 1 thông báo theo 5 mẫu: Thẻ, Dải mảnh, Ăn mừng, Cửa sổ nổi, Góc màn hình. */

export const TONES: Record<Tone, { label: string; card: string; chip: string; badge: string; glow: string; strong: string; mood: 'happy' | 'wow' }> = {
  info: {
    label: 'Thông tin',
    card: 'border-sky-300/70 bg-gradient-to-br from-sky-100 via-surface to-surface',
    chip: 'bg-sky-500 text-white',
    badge: '#4D9EF5',
    glow: '#9CCBFF',
    strong: 'from-sky-500 to-lilac-500',
    mood: 'happy',
  },
  success: {
    label: 'Tin vui',
    card: 'border-mint-300/70 bg-gradient-to-br from-mint-100 via-surface to-surface',
    chip: 'bg-mint-500 text-white',
    badge: '#3FBF8C',
    glow: '#8FE0BE',
    strong: 'from-mint-500 to-sky-500',
    mood: 'happy',
  },
  warning: {
    label: 'Lưu ý',
    card: 'border-lemon-300 bg-gradient-to-br from-lemon-100 via-surface to-surface',
    chip: 'bg-peach-500 text-white',
    badge: '#FF8A65',
    glow: '#FFE27A',
    strong: 'from-peach-500 to-rose-500',
    mood: 'wow',
  },
};

export interface NoticeViewProps {
  title: string;
  text: string;
  tone: Tone;
  template: NoticeTemplate;
  onClose?: () => void;
  muted?: boolean;
  onToggleMute?: () => void;
  /** Xem trước trong trang Admin: cửa sổ nổi / góc màn hình hiển thị tại chỗ thay vì cố định trên màn hình. */
  preview?: boolean;
}

const Sparkle = ({ x, y, s, c }: { x: number; y: number; s: number; c: string }) => (
  <path
    d={`M${x} ${y - s} L${x + s * 0.3} ${y - s * 0.3} L${x + s} ${y} L${x + s * 0.3} ${y + s * 0.3} L${x} ${y + s} L${x - s * 0.3} ${y + s * 0.3} L${x - s} ${y} L${x - s * 0.3} ${y - s * 0.3} Z`}
    fill={c}
  />
);

const titleOf = (t: string) => t.trim() || 'Thông báo từ Cú Học Bài';

function Controls({ onClose, muted, onToggleMute, light }: Pick<NoticeViewProps, 'onClose' | 'muted' | 'onToggleMute'> & { light?: boolean }) {
  const cls = `rounded-full p-1.5 transition ${light ? 'text-white/80 hover:bg-surface/15 hover:text-white' : 'text-ink/40 hover:bg-ink/5 hover:text-ink'}`;
  if (!onClose && !onToggleMute) return null;
  return (
    <div className="flex shrink-0 items-center">
      {onToggleMute && (
        <button
          className={cls}
          onClick={onToggleMute}
          aria-pressed={muted}
          aria-label={muted ? 'Bật âm thanh thông báo' : 'Tắt âm thanh thông báo'}
          title={muted ? 'Bật âm thanh thông báo' : 'Tắt âm thanh thông báo'}
        >
          {muted ? <IconVolumeOff size={18} /> : <IconVolume size={18} />}
        </button>
      )}
      {onClose && (
        <button className={cls} onClick={onClose} aria-label="Đóng thông báo" title="Đóng thông báo">
          <IconX size={18} />
        </button>
      )}
    </div>
  );
}

/** Nội dung có “Xem thêm” khi dài. */
function Body({ text, color, clamp = 3, className = '' }: { text: string; color: string; clamp?: 1 | 2 | 3; className?: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > (clamp === 1 ? 80 : 180) || text.split('\n').length > clamp;
  const clampCls = clamp === 1 ? 'line-clamp-1' : clamp === 2 ? 'line-clamp-2' : 'line-clamp-3';
  return (
    <>
      <p className={`whitespace-pre-line leading-relaxed ${long && !open ? clampCls : ''} ${className}`}>{text}</p>
      {long && (
        <button className="text-sm font-extrabold underline-offset-2 hover:underline" style={{ color }} onClick={() => setOpen((o) => !o)}>
          {open ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </>
  );
}

function OwlBadge({ tone, size = 52 }: { tone: Tone; size?: number }) {
  const t = TONES[tone];
  return (
    <div className="relative shrink-0">
      <span className="flex items-center justify-center rounded-2xl bg-surface shadow-soft" style={{ width: size + 8, height: size + 8 }}>
        <Owl size={size} mood={t.mood} />
      </span>
      <span
        className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface text-white"
        style={{ background: t.badge }}
      >
        <IconMegaphone size={15} strokeWidth={2.4} />
      </span>
    </div>
  );
}

/* ---------------- 1. Thẻ ---------------- */
function CardView(p: NoticeViewProps) {
  const t = TONES[p.tone] ?? TONES.info;
  return (
    <div role="status" className={`animate-pop relative overflow-hidden rounded-blob border-2 p-4 shadow-soft sm:p-5 ${t.card}`}>
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full opacity-40 blur-2xl" style={{ background: t.glow }} />
      <svg className="pointer-events-none absolute right-20 top-3 hidden sm:block" width="70" height="40" aria-hidden="true">
        <Sparkle x={10} y={12} s={6} c={t.glow} />
        <Sparkle x={45} y={8} s={4} c={t.badge} />
        <Sparkle x={60} y={28} s={5} c={t.glow} />
      </svg>
      <div className="relative flex items-start gap-3 sm:gap-4">
        <OwlBadge tone={p.tone} />
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`chip ${t.chip}`}>{t.label}</span>
            <h3 className="text-base font-black leading-snug sm:text-lg">{titleOf(p.title)}</h3>
          </div>
          <div className="mt-1.5">
            <Body text={p.text} color={t.badge} className="text-[15px] font-semibold text-ink/75" />
          </div>
        </div>
        <div className="-mr-1 -mt-1">
          <Controls {...p} />
        </div>
      </div>
    </div>
  );
}

/* ---------------- 2. Dải mảnh ---------------- */
function BannerView(p: NoticeViewProps) {
  const t = TONES[p.tone] ?? TONES.info;
  const [open, setOpen] = useState(false);
  return (
    <div role="status" className={`animate-pop flex items-center gap-3 rounded-2xl bg-gradient-to-r px-3 py-2 text-white shadow-soft ${t.strong}`}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface/20">
        <IconMegaphone size={17} />
      </span>
      <button
        className={`min-w-0 flex-1 text-left text-sm ${open ? 'whitespace-pre-line' : 'truncate'}`}
        onClick={() => setOpen((o) => !o)}
        title={open ? 'Thu gọn' : 'Xem đầy đủ'}
      >
        <b className="mr-1.5">{titleOf(p.title)}</b>
        <span className="font-semibold text-white/90">{p.text}</span>
      </button>
      <Controls {...p} light />
    </div>
  );
}

/* ---------------- 3. Ăn mừng ---------------- */
const CONFETTI = Array.from({ length: 26 }, (_, i) => ({
  x: (i * 37) % 100,
  y: (i * 53) % 100,
  r: (i * 47) % 180,
  c: ['#FFE27A', '#FFA8BC', '#9CCBFF', '#8FE0BE', '#C5AEFF', '#FFB59A'][i % 6],
  w: 5 + (i % 3) * 2,
}));

function CelebrateView(p: NoticeViewProps) {
  const t = TONES[p.tone] ?? TONES.info;
  return (
    <div role="status" className={`animate-pop relative overflow-hidden rounded-blob bg-gradient-to-br p-5 text-white shadow-soft sm:p-7 ${t.strong}`}>
      <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden="true">
        {CONFETTI.map((c, i) => (
          <rect key={i} x={`${c.x}%`} y={`${c.y}%`} width={c.w} height={c.w * 1.8} rx="1.5" fill={c.c} opacity="0.6" transform={`rotate(${c.r})`} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
        ))}
      </svg>
      <div className="relative flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
        <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-surface shadow-lg">
          <Owl size={84} mood="happy" className="animate-bob" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="chip bg-surface/25 text-white">{t.label}</span>
          <h3 className="mt-1.5 text-2xl font-black leading-tight drop-shadow-sm sm:text-3xl">{titleOf(p.title)}</h3>
          <div className="mt-1.5">
            <Body text={p.text} color="#fff" className="text-base font-bold text-white/95" />
          </div>
        </div>
      </div>
      <div className="absolute right-2 top-2">
        <Controls {...p} light />
      </div>
    </div>
  );
}

/* ---------------- 4. Cửa sổ nổi ---------------- */
function PopupView(p: NoticeViewProps) {
  const t = TONES[p.tone] ?? TONES.info;
  const box = (
    <div role="dialog" aria-modal={!p.preview} className="animate-pop relative w-full max-w-md overflow-hidden rounded-blob bg-surface text-center shadow-2xl">
      <div className={`relative flex justify-center bg-gradient-to-br pb-10 pt-6 ${t.strong}`}>
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <Sparkle x={40} y={30} s={7} c="#ffffff88" />
          <Sparkle x={330} y={40} s={5} c="#ffffffaa" />
          <Sparkle x={290} y={90} s={4} c="#ffffff77" />
        </svg>
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-surface shadow-lg">
          <Owl size={84} mood={t.mood} />
        </span>
        <div className="absolute right-2 top-2">
          <Controls onToggleMute={p.onToggleMute} muted={p.muted} light />
        </div>
      </div>
      <div className="-mt-5 rounded-t-[1.5rem] bg-surface px-6 pb-6 pt-5">
        <span className={`chip ${t.chip}`}>{t.label}</span>
        <h3 className="mt-2 text-xl font-black">{titleOf(p.title)}</h3>
        <div className="mt-2">
          <Body text={p.text} color={t.badge} className="font-semibold text-ink/70" />
        </div>
        {p.onClose && (
          <button className="btn-primary mt-5 w-full" onClick={p.onClose}>
            Đã hiểu
          </button>
        )}
      </div>
    </div>
  );
  if (p.preview) return <div className="flex justify-center rounded-blob bg-ink/30 p-6">{box}</div>;
  return <div className="fixed inset-0 z-[55] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">{box}</div>;
}

/* ---------------- 5. Góc màn hình ---------------- */
function ToastView(p: NoticeViewProps) {
  const t = TONES[p.tone] ?? TONES.info;
  const [shown, setShown] = useState(!!p.preview);
  useEffect(() => {
    const id = window.setTimeout(() => setShown(true), 50);
    return () => window.clearTimeout(id);
  }, []);
  const box = (
    <div
      role="status"
      className={`pointer-events-auto relative w-full overflow-hidden rounded-2xl border-l-[6px] bg-surface p-4 shadow-2xl transition-all duration-500 sm:w-[360px] ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      }`}
      style={{ borderColor: t.badge }}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `${t.glow}66` }}>
          <Owl size={38} mood={t.mood} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-extrabold" style={{ color: t.badge }}>
            {t.label}
          </div>
          <h3 className="font-black leading-snug">{titleOf(p.title)}</h3>
          <div className="mt-0.5">
            <Body text={p.text} color={t.badge} clamp={2} className="text-sm font-semibold text-ink/70" />
          </div>
        </div>
        <div className="-mr-2 -mt-2">
          <Controls {...p} />
        </div>
      </div>
    </div>
  );
  if (p.preview) return <div className="flex justify-end rounded-blob bg-ink/[0.04] p-4">{box}</div>;
  return box;
}

export default function NoticeView(p: NoticeViewProps): ReactNode {
  switch (p.template) {
    case 'banner':
      return <BannerView {...p} />;
    case 'celebrate':
      return <CelebrateView {...p} />;
    case 'popup':
      return <PopupView {...p} />;
    case 'toast':
      return <ToastView {...p} />;
    default:
      return <CardView {...p} />;
  }
}

/** Mẫu nội dung soạn sẵn cho admin. */
export const CONTENT_PRESETS: { label: string; title: string; text: string; tone: Tone; template: NoticeTemplate }[] = [
  {
    label: 'Bộ đề mới',
    title: 'Bộ đề mới đã lên kệ!',
    text: 'Vừa có thêm bộ câu hỏi mới trong mục Khám phá. Vào học ngay để giữ chuỗi ngày học nhé!',
    tone: 'success',
    template: 'card',
  },
  {
    label: 'Bảo trì',
    title: 'Thông báo bảo trì',
    text: 'Web sẽ bảo trì từ 22h đến 23h tối nay. Trong thời gian này bạn vẫn học được nhưng tạm thời chưa tạo / sửa câu hỏi.',
    tone: 'warning',
    template: 'banner',
  },
  {
    label: 'Chúc thi tốt',
    title: 'Chúc cả nhà thi thật tốt!',
    text: 'Cố lên nào! Ôn lại các câu hay sai trong chế độ Ôn tập để tự tin hơn trước giờ thi.',
    tone: 'success',
    template: 'celebrate',
  },
  {
    label: 'Nhắc ôn bài',
    title: 'Đến giờ ôn bài rồi!',
    text: 'Dành 10 phút làm vài câu để không mất chuỗi ngày học của bạn nhé.',
    tone: 'info',
    template: 'toast',
  },
  {
    label: 'Tính năng mới',
    title: 'Có gì mới trong Cú Học Bài?',
    text: 'Trang Thống kê mới với lịch học, huy hiệu và “giờ vàng”. Vào xem thành tích của bạn ngay!',
    tone: 'info',
    template: 'popup',
  },
];
