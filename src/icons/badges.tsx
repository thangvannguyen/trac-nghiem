/* Huy hiệu thành tích & icon cho trang Thống kê – SVG tự vẽ. */

export type Glyph = 'flame' | 'star' | 'book' | 'target' | 'crown' | 'moon' | 'sun' | 'compass' | 'bolt' | 'check' | 'gem' | 'seed';

const INK = '#3B3355';

function GlyphShape({ g, c }: { g: Glyph; c: string }) {
  switch (g) {
    case 'flame':
      return (
        <>
          <path d="M32 14 C40 22 44 28 44 36 a12 12 0 0 1 -24 0 c0 -5 2 -8 5 -11 c0 4 2 6 4 7 c-1 -7 0 -12 3 -18 Z" fill={c} />
          <path d="M32 30 c4 4 6 7 6 10 a6 6 0 0 1 -12 0 c0 -3 2 -6 6 -10 Z" fill="#FFE27A" />
        </>
      );
    case 'star':
      return <path d="M32 15 l5 10.5 11.5 1.6 -8.3 8.1 2 11.4 -10.2 -5.4 -10.2 5.4 2 -11.4 -8.3 -8.1 11.5 -1.6 Z" fill={c} />;
    case 'book':
      return (
        <>
          <path d="M18 21 q8 -4 14 1 v22 q-6 -4 -14 -1 Z" fill={c} />
          <path d="M46 21 q-8 -4 -14 1 v22 q6 -4 14 -1 Z" fill={c} opacity="0.7" />
        </>
      );
    case 'target':
      return (
        <>
          <circle cx="32" cy="32" r="14" fill="none" stroke={c} strokeWidth="4" />
          <circle cx="32" cy="32" r="7" fill="none" stroke={c} strokeWidth="4" />
          <circle cx="32" cy="32" r="2.5" fill={c} />
        </>
      );
    case 'crown':
      return <path d="M17 42 L19 22 L26 30 L32 18 L38 30 L45 22 L47 42 Z" fill={c} strokeLinejoin="round" />;
    case 'moon':
      return (
        <>
          <path d="M38 16 a16 16 0 1 0 10 26 a13 13 0 0 1 -10 -26 Z" fill={c} />
          <circle cx="44" cy="20" r="1.8" fill={c} />
        </>
      );
    case 'sun':
      return (
        <>
          <circle cx="32" cy="32" r="8" fill={c} />
          <path d="M32 14v5M32 45v5M14 32h5M45 32h5M19.5 19.5l3.5 3.5M41 41l3.5 3.5M19.5 44.5l3.5-3.5M41 23l3.5-3.5" stroke={c} strokeWidth="3.5" strokeLinecap="round" />
        </>
      );
    case 'compass':
      return (
        <>
          <circle cx="32" cy="32" r="15" fill="none" stroke={c} strokeWidth="3.5" />
          <path d="M38 26 L34.5 34.5 L26 38 L29.5 29.5 Z" fill={c} />
        </>
      );
    case 'bolt':
      return <path d="M35 14 L21 35 h9 l-3 15 l15 -22 h-9 Z" fill={c} strokeLinejoin="round" />;
    case 'check':
      return <path d="M20 33 l8 8 l16 -17" fill="none" stroke={c} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />;
    case 'gem':
      return (
        <>
          <path d="M22 20 h20 l7 9 -17 20 -17 -20 Z" fill={c} />
          <path d="M15 29 h34 M27 20 l5 29 5 -29" stroke="#fff" strokeWidth="1.5" opacity="0.6" fill="none" />
        </>
      );
    case 'seed':
      return (
        <>
          <path d="M32 46 V30" stroke={c} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M32 32 C24 32 20 26 20 20 C27 20 32 24 32 32 Z" fill={c} />
          <path d="M32 28 C38 28 44 24 44 17 C37 17 32 21 32 28 Z" fill={c} opacity="0.75" />
        </>
      );
  }
}

/** Huy hiệu tròn có ruy băng. Khi chưa mở khóa thì xám và có ổ khóa nhỏ. */
export function Badge({ glyph, color, unlocked, size = 64 }: { glyph: Glyph; color: string; unlocked: boolean; size?: number }) {
  const main = unlocked ? color : '#CFCADB';
  const ring = unlocked ? '#FFE27A' : '#E7E4EE';
  return (
    <svg width={size} height={size} viewBox="0 0 64 72" aria-hidden="true">
      <path d="M20 52 L14 70 L22 66 L26 72 L30 56 Z" fill={unlocked ? '#FFA8BC' : '#DDD9E6'} />
      <path d="M44 52 L50 70 L42 66 L38 72 L34 56 Z" fill={unlocked ? '#9CCBFF' : '#DDD9E6'} />
      <circle cx="32" cy="32" r="27" fill={ring} />
      <circle cx="32" cy="32" r="22" fill="#fff" />
      <g opacity={unlocked ? 1 : 0.8}>
        <GlyphShape g={glyph} c={main} />
      </g>
      {unlocked ? (
        <path d="M10 14 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5 Z" fill="#fff" />
      ) : (
        <g transform="translate(42 40)">
          <circle cx="8" cy="8" r="9" fill={INK} />
          <rect x="4" y="7" width="8" height="6" rx="1.5" fill="#fff" />
          <path d="M5.5 7 V5.5 a2.5 2.5 0 0 1 5 0 V7" stroke="#fff" strokeWidth="1.6" fill="none" />
        </g>
      )}
    </svg>
  );
}

/** Ngọn lửa dễ thương cho chuỗi ngày học. Tắt (xám) khi hôm nay chưa học. */
export function Flame({ size = 48, lit = true }: { size?: number; lit?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M24 3 C33 12 39 19 39 28 a15 15 0 0 1 -30 0 c0 -6 3 -10 6 -13 c0 5 2 8 5 9 c-1 -9 1 -15 4 -21 Z"
        fill={lit ? '#FF8A65' : '#D9D4E3'}
      />
      <path d="M24 20 c5 5 8 9 8 13 a8 8 0 0 1 -16 0 c0 -4 3 -8 8 -13 Z" fill={lit ? '#FFE27A' : '#EEEBF3'} />
      <circle cx="20.5" cy="33" r="1.6" fill={INK} />
      <circle cx="27.5" cy="33" r="1.6" fill={INK} />
      {lit ? (
        <path d="M22 36.5 q2 2 4 0" stroke={INK} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M22 37.5 q2 -1.5 4 0" stroke={INK} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      )}
      <ellipse cx="17.5" cy="35.5" rx="2" ry="1.2" fill="#FF8FA8" opacity="0.7" />
      <ellipse cx="30.5" cy="35.5" rx="2" ry="1.2" fill="#FF8FA8" opacity="0.7" />
    </svg>
  );
}
