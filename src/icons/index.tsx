import type { SVGProps } from 'react';
import type { FolderColor } from '../lib/types';
import { useSkinId } from '../lib/skinContext';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

/** Khung chung cho icon nét: nét tròn, dùng currentColor. */
function Line({ size = 22, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export { PALETTE } from './palette';
export { TopicIcon, TOPICS } from './topics';
import { PALETTE } from './palette';

const INK = '#3B3355';

/* ---------------- Linh vật: chú cú – phụ kiện đổi theo theme ---------------- */

type Mood = 'happy' | 'sad' | 'think' | 'wow';

/** Mũ tốt nghiệp (Cú Học Bài). */
const GradCap = () => (
  <>
    <path d="M38 34 L38 44 Q60 52 82 44 L82 34 Z" fill={INK} />
    <path d="M14 30 L60 12 L106 30 L60 48 Z" fill="#4A4168" />
    <path d="M60 30 L96 34 L96 50" stroke="#F5C518" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M92 50 L96 60 L100 50 Z" fill="#F5C518" />
    <circle cx="60" cy="30" r="3.5" fill="#F5C518" />
  </>
);

/** Vòng lá thảo dược + nhành thuốc (Cú Học Dược). */
const HerbCrown = () => (
  <>
    <path d="M30 42 Q60 30 90 42" fill="none" stroke="#2C9A6F" strokeWidth="3" strokeLinecap="round" />
    {[
      [34, 38, -40],
      [46, 32, -20],
      [60, 29, 0],
      [74, 32, 20],
      [86, 38, 40],
    ].map(([x, y, r], i) => (
      <path
        key={i}
        d={`M${x} ${y} c-4 -6 -2 -13 0 -16 c2 3 4 10 0 16 Z`}
        fill={i % 2 ? '#8FE0BE' : '#3FBF8C'}
        stroke="#2C9A6F"
        strokeWidth="1.2"
        transform={`rotate(${r} ${x} ${y})`}
      />
    ))}
    <circle cx="60" cy="27" r="3.2" fill="#FFE27A" stroke="#E0AE00" strokeWidth="1" />
    {/* nhành thuốc ở cánh phải */}
    <path d="M96 96 L108 70" stroke="#2C9A6F" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M104 78 c6 -3 10 -1 11 1 c-4 3 -8 3 -11 -1 Z M101 85 c-6 -2 -9 1 -10 3 c4 2 8 1 10 -3 Z M106 72 c4 -5 8 -5 9 -4 c-2 4 -6 6 -9 4 Z" fill="#8FE0BE" stroke="#2C9A6F" strokeWidth="1" />
  </>
);

/** Kính râm + hoa dâm bụt (Cú Chill). Khi buồn thì kính được đẩy lên đầu. */
const ChillLook = ({ glasses }: { glasses: boolean }) => (
  <>
    {glasses ? (
      <>
        <path d="M28 58 h64" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        <rect x="29" y="54" width="27" height="17" rx="8" fill={INK} />
        <rect x="64" y="54" width="27" height="17" rx="8" fill={INK} />
        <path d="M34 59 l7 -2 M69 59 l7 -2" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      </>
    ) : (
      <>
        <path d="M36 42 h48" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
        <rect x="37" y="38" width="19" height="11" rx="5.5" fill={INK} />
        <rect x="64" y="38" width="19" height="11" rx="5.5" fill={INK} />
      </>
    )}
    {/* hoa trên đầu */}
    {[0, 72, 144, 216, 288].map((r) => (
      <ellipse key={r} cx="82" cy="30" rx="5" ry="8" fill="#FF7A9C" transform={`rotate(${r} 82 37)`} />
    ))}
    <circle cx="82" cy="37" r="3.5" fill="#FFE27A" />
  </>
);

/** Băng đầu có gương soi + ống nghe (Cú Học Y). */
const MedicKit = () => (
  <>
    <path d="M27 48 Q60 30 93 48" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
    <path d="M27 48 Q60 30 93 48" fill="none" stroke="#C9D7E8" strokeWidth="1.2" />
    <circle cx="60" cy="34" r="10" fill="#E6EEF7" stroke="#9FB3C8" strokeWidth="2" />
    <circle cx="60" cy="34" r="3.5" fill="#fff" stroke="#9FB3C8" strokeWidth="1.2" />
    <path d="M54 30 a8 8 0 0 1 5 -4" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
    {/* ống nghe quanh cổ */}
    <path d="M40 86 Q44 104 60 104 Q76 104 80 86" fill="none" stroke="#4D9EF5" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="60" cy="106" r="5" fill="#9FB3C8" stroke="#6E85A0" strokeWidth="1.5" />
    <circle cx="60" cy="106" r="2" fill="#E6EEF7" />
    <path d="M86 44 v8 M82 48 h8" stroke="#F2647F" strokeWidth="3" strokeLinecap="round" />
  </>
);

/** Khăn xếp + kính tròn + chòm râu (Cú YHCT – thầy lang). */
const YhctLook = ({ mood }: { mood: Mood }) => (
  <>
    <path d="M30 46 Q30 22 60 22 Q90 22 90 46 Q60 38 30 46 Z" fill="#6B4430" />
    <path d="M30 46 Q60 38 90 46" fill="none" stroke="#4A2E20" strokeWidth="2.5" />
    <path d="M34 39 Q60 30 86 39 M37 32 Q60 24 83 32" fill="none" stroke="#8C5A3E" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M30 46 Q33 30 50 25" fill="none" stroke="#8C5A3E" strokeWidth="1.5" opacity="0.7" />
    {/* kính tròn */}
    {mood !== 'sad' && (
      <>
        <circle cx="43" cy="62" r="13" fill="none" stroke="#B88A2E" strokeWidth="2.5" />
        <circle cx="77" cy="62" r="13" fill="none" stroke="#B88A2E" strokeWidth="2.5" />
        <path d="M56 61 q4 -3 8 0" fill="none" stroke="#B88A2E" strokeWidth="2.5" />
      </>
    )}
    {/* chòm râu bạc */}
    <path d="M55 84 q5 14 -1 22 q7 -4 6 -12 q1 8 7 12 q-5 -9 0 -22 Z" fill="#fff" stroke="#D9D4E3" strokeWidth="1.2" strokeLinejoin="round" />
  </>
);

/** Mũ tiệc + pháo giấy (Cú Quẩy). */
const PartyLook = () => (
  <>
    <g transform="rotate(-14 60 30)">
      <path d="M44 44 L62 4 L78 44 Z" fill="#FF6FB1" />
      <path d="M50 30 L72 30 M47 37 L75 37 M55 17 L68 17" stroke="#FFE27A" strokeWidth="3.5" />
      <path d="M44 44 Q61 49 78 44" fill="none" stroke="#E3398F" strokeWidth="3" strokeLinecap="round" />
      <circle cx="62" cy="5" r="5" fill="#9CCBFF" />
    </g>
    {[
      [14, 30, '#FFE27A', 20],
      [104, 22, '#8FE0BE', -30],
      [100, 52, '#FF6FB1', 40],
      [10, 58, '#9CCBFF', -15],
      [22, 16, '#C5AEFF', 50],
    ].map(([x, y, c, r], i) => (
      <rect key={i} x={x as number} y={y as number} width="5" height="9" rx="1.5" fill={c as string} transform={`rotate(${r} ${x} ${y})`} />
    ))}
    <path d="M108 38 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5 Z" fill="#FFE27A" />
  </>
);

/** Kính cận + bút chì + cuốn sách (Mọt sách). */
const NerdLook = () => (
  <>
    <circle cx="43" cy="62" r="14" fill="none" stroke={INK} strokeWidth="3.5" />
    <circle cx="77" cy="62" r="14" fill="none" stroke={INK} strokeWidth="3.5" />
    <path d="M57 60 q3 -3 6 0 M29 60 l-7 -3 M91 60 l7 -3" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
    <path d="M36 52 l8 -3 M70 52 l8 -3" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
    {/* bút chì trên đầu */}
    <g transform="rotate(-25 72 34)">
      <rect x="56" y="31" width="30" height="7" rx="1.5" fill="#FFE27A" stroke="#E0AE00" strokeWidth="1.2" />
      <path d="M86 31 l7 3.5 -7 3.5 Z" fill="#FFE8DC" stroke="#E0AE00" strokeWidth="1.2" strokeLinejoin="round" />
      <rect x="52" y="31" width="5" height="7" rx="1.5" fill="#FF8FA8" />
    </g>
    {/* cuốn sách ôm trước bụng */}
    <path d="M38 92 q11 -5 22 0 v16 q-11 -5 -22 0 Z" fill="#F2647F" stroke="#C63F5C" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M82 92 q-11 -5 -22 0 v16 q11 -5 22 0 Z" fill="#FF8FA8" stroke="#C63F5C" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M43 96 q6 -2 12 0 M43 100 q6 -2 12 0 M65 96 q6 -2 12 0" stroke="#fff" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.8" />
  </>
);

/** Mũ ngủ + Zzz (Ngủ gật ôn đêm). */
const SleepyLook = () => (
  <>
    <path d="M30 46 Q32 20 60 16 Q86 14 100 34 Q96 42 92 46 Q60 36 30 46 Z" fill="#4D6FD0" />
    <path d="M38 34 Q60 24 84 28 M34 41 Q60 31 90 38" fill="none" stroke="#9CCBFF" strokeWidth="3" strokeLinecap="round" />
    <path d="M28 46 Q60 36 92 46" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
    <circle cx="101" cy="38" r="6" fill="#fff" stroke="#D9D4E3" strokeWidth="1.2" />
    {/* Zzz */}
    <path d="M98 10 h8 l-8 9 h8 M108 0 h6 l-6 7 h6" fill="none" stroke="#8C6CF0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </>
);

/** Vương miện vàng (thủ khoa). */
const KingLook = () => (
  <>
    <path d="M34 46 L30 20 L45 32 L60 14 L75 32 L90 20 L86 46 Z" fill="#FFD43B" stroke="#E0AE00" strokeWidth="2" strokeLinejoin="round" />
    <path d="M34 46 Q60 40 86 46" fill="none" stroke="#E0AE00" strokeWidth="2.5" />
    <circle cx="60" cy="34" r="4" fill="#F2647F" />
    <circle cx="44" cy="39" r="3" fill="#4D9EF5" />
    <circle cx="76" cy="39" r="3" fill="#3FBF8C" />
    <circle cx="30" cy="20" r="2.6" fill="#FFE27A" />
    <circle cx="60" cy="14" r="2.6" fill="#FFE27A" />
    <circle cx="90" cy="20" r="2.6" fill="#FFE27A" />
    <path d="M100 18 l1.8 4.2 4.2 1.8 -4.2 1.8 -1.8 4.2 -1.8 -4.2 -4.2 -1.8 4.2 -1.8 Z M16 30 l1.3 3 3 1.3 -3 1.3 -1.3 3 -1.3 -3 -3 -1.3 3 -1.3 Z" fill="#FFE27A" />
  </>
);

/** Tai nghe chụp tai + nốt nhạc. */
const MusicLook = () => (
  <>
    <path d="M24 62 Q24 22 60 22 Q96 22 96 62" fill="none" stroke="#4A4168" strokeWidth="7" strokeLinecap="round" />
    <path d="M24 62 Q24 22 60 22 Q96 22 96 62" fill="none" stroke="#8C6CF0" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
    <rect x="13" y="52" width="16" height="24" rx="8" fill="#4A4168" />
    <rect x="91" y="52" width="16" height="24" rx="8" fill="#4A4168" />
    <rect x="17" y="56" width="8" height="16" rx="4" fill="#FF6FB1" />
    <rect x="95" y="56" width="8" height="16" rx="4" fill="#FF6FB1" />
    {/* nốt nhạc */}
    <path d="M104 12 v14 M104 12 l9 -3 v12" fill="none" stroke="#8C6CF0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <ellipse cx="101.5" cy="26.5" rx="3.5" ry="2.8" fill="#8C6CF0" />
    <ellipse cx="110.5" cy="21.5" rx="3.5" ry="2.8" fill="#8C6CF0" />
    <path d="M14 22 v10" stroke="#FF6FB1" strokeWidth="2.4" strokeLinecap="round" />
    <ellipse cx="11.5" cy="32.5" rx="3.5" ry="2.8" fill="#FF6FB1" />
  </>
);

const Star = ({ x, y }: { x: number; y: number }) => (
  <path
    d={`M${x} ${y - 9} l2.7 5.6 6.1 .9 -4.4 4.3 1 6.1 -5.4 -2.9 -5.4 2.9 1 -6.1 -4.4 -4.3 6.1 -.9 Z`}
    fill="#F5C518"
    stroke="#E0AE00"
    strokeWidth="1"
    strokeLinejoin="round"
  />
);

export function Owl({ size = 64, mood = 'happy', mascot, ...rest }: IconProps & { mood?: Mood; mascot?: string }) {
  // Kiểu cú: truyền trực tiếp (xem trước trong Admin) hoặc theo cấu hình theme hiện tại.
  const ctx = useSkinId();
  const skin = mascot ?? ctx;
  const sunglasses = skin === 'chill' && mood !== 'sad';
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" {...rest}>
      {/* thân – màu thân / cánh / bụng đổi theo theme (biến CSS --owl-*) */}
      <ellipse cx="60" cy="74" rx="40" ry="38" fill="var(--owl-body, #C5AEFF)" />
      <path d="M22 60 Q14 80 26 96 Q30 80 30 66 Z" fill="var(--owl-wing, #AE90FA)" />
      <path d="M98 60 Q106 80 94 96 Q90 80 90 66 Z" fill="var(--owl-wing, #AE90FA)" />
      <ellipse cx="60" cy="86" rx="24" ry="22" fill="var(--owl-belly, #EEE6FF)" />
      <path d="M48 82 q4 4 8 0 M58 90 q4 4 8 0 M52 98 q4 4 8 0" stroke="var(--owl-body, #C5AEFF)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* mắt */}
      {!sunglasses && (
        <>
          <circle cx="43" cy="62" r="15" fill="#fff" />
          <circle cx="77" cy="62" r="15" fill="#fff" />
          {mood === 'sad' ? (
            <>
              <path d="M36 64 q7 -6 14 0" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M70 64 q7 -6 14 0" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
            </>
          ) : mood === 'happy' && skin === 'party' ? (
            <>
              <Star x={43} y={63} />
              <Star x={77} y={63} />
            </>
          ) : mood === 'happy' ? (
            <>
              <path d="M36 64 q7 -9 14 0" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M70 64 q7 -9 14 0" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx={mood === 'think' ? 46 : 43} cy={mood === 'think' ? 59 : 63} r="7" fill={INK} />
              <circle cx={mood === 'think' ? 80 : 77} cy={mood === 'think' ? 59 : 63} r="7" fill={INK} />
              <circle cx={mood === 'think' ? 48.5 : 45.5} cy={mood === 'think' ? 56.5 : 60.5} r="2.4" fill="#fff" />
              <circle cx={mood === 'think' ? 82.5 : 79.5} cy={mood === 'think' ? 56.5 : 60.5} r="2.4" fill="#fff" />
            </>
          )}
        </>
      )}
      {mood === 'sad' && <path d="M84 70 q3 6 0 9 q-3 -3 0 -9" fill="#9CCBFF" />}
      {/* má hồng */}
      <ellipse cx="32" cy="78" rx="6" ry="3.5" fill="#FFA8BC" opacity="0.8" />
      <ellipse cx="88" cy="78" rx="6" ry="3.5" fill="#FFA8BC" opacity="0.8" />
      {/* mỏ */}
      {mood === 'wow' ? (
        <ellipse cx="60" cy="78" rx="4" ry="5" fill="#FF8A65" />
      ) : (
        <path d="M54 73 L60 82 L66 73 Z" fill="#FFB59A" stroke="#FF8A65" strokeWidth="1.5" strokeLinejoin="round" />
      )}
      {/* chân */}
      <path d="M48 110 v4 M44 112 h8 M72 110 v4 M68 112 h8" stroke="#FFB59A" strokeWidth="3.5" strokeLinecap="round" />
      {/* phụ kiện theo theme */}
      {skin === 'herbal' ? (
        <HerbCrown />
      ) : skin === 'chill' ? (
        <ChillLook glasses={sunglasses} />
      ) : skin === 'medic' ? (
        <MedicKit />
      ) : skin === 'yhct' ? (
        <YhctLook mood={mood} />
      ) : skin === 'party' ? (
        <PartyLook />
      ) : skin === 'nerd' ? (
        <NerdLook />
      ) : skin === 'sleepy' ? (
        <SleepyLook />
      ) : skin === 'king' ? (
        <KingLook />
      ) : skin === 'music' ? (
        <MusicLook />
      ) : (
        <GradCap />
      )}
    </svg>
  );
}

/* ---------------- Thư mục có mặt cười ---------------- */

export function FolderFace({ size = 56, color = 'lilac', ...rest }: IconProps & { color?: FolderColor }) {
  const c = PALETTE[color];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" {...rest}>
      <path d="M6 16 a5 5 0 0 1 5 -5 h14 l6 6 h22 a5 5 0 0 1 5 5 v4 H6 Z" fill={c.dark} />
      <rect x="6" y="20" width="52" height="36" rx="7" fill={c.main} />
      <rect x="6" y="20" width="52" height="8" rx="4" fill="#fff" opacity="0.35" />
      <circle cx="24" cy="38" r="2.8" fill={INK} />
      <circle cx="40" cy="38" r="2.8" fill={INK} />
      <path d="M28 43 q4 4 8 0" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <ellipse cx="18" cy="44" rx="3.5" ry="2" fill="#FF8FA8" opacity="0.7" />
      <ellipse cx="46" cy="44" rx="3.5" ry="2" fill="#FF8FA8" opacity="0.7" />
    </svg>
  );
}

/* ---------------- Icon nét dùng trong giao diện ---------------- */

export const IconPlus = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 5v14M5 12h14" />
  </Line>
);

export const IconEdit = (p: IconProps) => (
  <Line {...p}>
    <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
    <path d="M13.5 6.5l4 4" />
  </Line>
);

export const IconTrash = (p: IconProps) => (
  <Line {...p}>
    <path d="M4 7h16M9 7V4.5h6V7M6 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5L18 7" />
    <path d="M10 11v6M14 11v6" />
  </Line>
);

export const IconShare = (p: IconProps) => (
  <Line {...p}>
    <circle cx="18" cy="5.5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="18.5" r="2.5" />
    <path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1" />
  </Line>
);

export const IconLock = (p: IconProps) => (
  <Line {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="3" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    <circle cx="12" cy="15.5" r="1.2" fill="currentColor" />
  </Line>
);

export const IconGlobe = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" />
  </Line>
);

export const IconLink = (p: IconProps) => (
  <Line {...p}>
    <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" />
    <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />
  </Line>
);

export const IconUsers = (p: IconProps) => (
  <Line {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <circle cx="17" cy="9" r="2.6" />
    <path d="M17.5 14.5a5 5 0 0 1 4 5" />
  </Line>
);

export const IconCheck = (p: IconProps) => (
  <Line {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Line>
);

export const IconX = (p: IconProps) => (
  <Line {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Line>
);

export const IconBulb = (p: IconProps) => (
  <Line {...p}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3Z" />
  </Line>
);

export const IconShuffle = (p: IconProps) => (
  <Line {...p}>
    <path d="M3 7h3.5c2 0 3.2 1 4.2 2.6l2.6 4.8c1 1.6 2.2 2.6 4.2 2.6H21" />
    <path d="M3 17h3.5c1.5 0 2.5-.5 3.3-1.4M14.2 8.4C15 7.5 16 7 17.5 7H21" />
    <path d="M18 4l3 3-3 3M18 14l3 3-3 3" />
  </Line>
);

export const IconRepeat = (p: IconProps) => (
  <Line {...p}>
    <path d="M4 11V9a3 3 0 0 1 3-3h12" />
    <path d="M16 3l3 3-3 3" />
    <path d="M20 13v2a3 3 0 0 1-3 3H5" />
    <path d="M8 21l-3-3 3-3" />
  </Line>
);

export const IconPlay = (p: IconProps) => (
  <Line {...p}>
    <path d="M7 4.8v14.4a1 1 0 0 0 1.5.9l11.5-7.2a1 1 0 0 0 0-1.7L8.5 3.9A1 1 0 0 0 7 4.8Z" />
  </Line>
);

export const IconArrowLeft = (p: IconProps) => (
  <Line {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Line>
);

export const IconArrowRight = (p: IconProps) => (
  <Line {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Line>
);

export const IconUp = (p: IconProps) => (
  <Line {...p}>
    <path d="M6 15l6-6 6 6" />
  </Line>
);

export const IconDown = (p: IconProps) => (
  <Line {...p}>
    <path d="M6 9l6 6 6-6" />
  </Line>
);

export const IconCopy = (p: IconProps) => (
  <Line {...p}>
    <rect x="8" y="8" width="12" height="12" rx="2.5" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </Line>
);

export const IconLogout = (p: IconProps) => (
  <Line {...p}>
    <path d="M14 4h3a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-3" />
    <path d="M10 8l-4 4 4 4M6 12h10" />
  </Line>
);

export const IconSearch = (p: IconProps) => (
  <Line {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </Line>
);

export const IconImport = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5" />
    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </Line>
);

export const IconSparkle = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z" />
    <path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7Z" />
  </Line>
);

export const IconHome = (p: IconProps) => (
  <Line {...p}>
    <path d="M4 11l8-7 8 7v8a2 2 0 0 1-2 2h-3.5v-6h-5v6H6a2 2 0 0 1-2-2Z" />
  </Line>
);

export const IconFolder = (p: IconProps) => (
  <Line {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h4.5l2 2.5H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
  </Line>
);

export const IconEye = (p: IconProps) => (
  <Line {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Line>
);

export const IconRefresh = (p: IconProps) => (
  <Line {...p}>
    <path d="M20 11a8 8 0 0 0-14.5-4.5L4 8" />
    <path d="M4 4v4h4" />
    <path d="M4 13a8 8 0 0 0 14.5 4.5L20 16" />
    <path d="M20 20v-4h-4" />
  </Line>
);

export const IconShield = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 3l7.5 3v5.5c0 4.5-3.2 8.3-7.5 9.5-4.3-1.2-7.5-5-7.5-9.5V6Z" />
    <path d="M9 12l2 2 4-4" />
  </Line>
);

export const IconUser = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Line>
);

export const IconBan = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M5.6 5.6l12.8 12.8" />
  </Line>
);

export const IconSettings = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
  </Line>
);

export const IconMegaphone = (p: IconProps) => (
  <Line {...p}>
    <path d="M3 10v4a1 1 0 0 0 1 1h3l8 4V5L7 9H4a1 1 0 0 0-1 1Z" />
    <path d="M7 15l1.5 5h2.5l-1-4.5M18.5 9a4 4 0 0 1 0 6" />
  </Line>
);

export const IconList = (p: IconProps) => (
  <Line {...p}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle cx="4.5" cy="6" r="1" fill="currentColor" />
    <circle cx="4.5" cy="12" r="1" fill="currentColor" />
    <circle cx="4.5" cy="18" r="1" fill="currentColor" />
  </Line>
);

export const IconVolume = (p: IconProps) => (
  <Line {...p}>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5Z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </Line>
);

export const IconVolumeOff = (p: IconProps) => (
  <Line {...p}>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5Z" />
    <path d="M16 9.5l5 5M21 9.5l-5 5" />
  </Line>
);

export const IconBell = (p: IconProps) => (
  <Line {...p}>
    <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z" />
    <path d="M10 20.5a2 2 0 0 0 4 0" />
  </Line>
);

export const IconCard = (p: IconProps) => (
  <Line {...p}>
    <rect x="4" y="5" width="16" height="14" rx="3" />
    <path d="M8 10h8M8 14h5" />
  </Line>
);

export const IconPage = (p: IconProps) => (
  <Line {...p}>
    <path d="M6 3h8.5L19 7.5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v5h5M8.5 12h7M8.5 15.5h7M8.5 19h4" />
  </Line>
);

export const IconPrinter = (p: IconProps) => (
  <Line {...p}>
    <path d="M7 9V3.5h10V9" />
    <rect x="3.5" y="9" width="17" height="8" rx="2" />
    <path d="M7 14h10v6.5H7Z" />
  </Line>
);

export const IconSun = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
  </Line>
);

export const IconMoon = (p: IconProps) => (
  <Line {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
  </Line>
);

export const IconMonitor = (p: IconProps) => (
  <Line {...p}>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8M12 16v4" />
  </Line>
);

export const IconChart = (p: IconProps) => (
  <Line {...p}>
    <path d="M4 20h16" />
    <path d="M7 16v-4M12 16V8M17 16v-7" />
  </Line>
);

/* ---------------- Icon màu ---------------- */

export function Trophy({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M18 10 h28 v14 a14 14 0 0 1 -28 0 Z" fill="#FFE27A" stroke="#E0AE00" strokeWidth="2" strokeLinejoin="round" />
      <path d="M18 14 h-6 a6 6 0 0 0 6 12 M46 14 h6 a6 6 0 0 1 -6 12" fill="none" stroke="#E0AE00" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M28 37 h8 v8 h-8 Z" fill="#FFE27A" stroke="#E0AE00" strokeWidth="2" />
      <rect x="20" y="45" width="24" height="8" rx="3" fill="#C5AEFF" stroke="#8C6CF0" strokeWidth="2" />
      <circle cx="27" cy="21" r="2" fill={INK} />
      <circle cx="37" cy="21" r="2" fill={INK} />
      <path d="M29 26 q3 3 6 0" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="23" cy="25" rx="2.5" ry="1.5" fill="#FF8FA8" opacity="0.7" />
      <ellipse cx="41" cy="25" rx="2.5" ry="1.5" fill="#FF8FA8" opacity="0.7" />
      <path d="M8 6 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2 Z M56 4 l1 2.4 2.4 1 -2.4 1 -1 2.4 -1 -2.4 -2.4 -1 2.4 -1 Z" fill="#FFB59A" />
    </svg>
  );
}

export function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/** Minh họa trạng thái rỗng: hộp quà với chú cú nhỏ ngó ra. */
export function EmptyBox({ size = 140 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 160 128" aria-hidden="true">
      <ellipse cx="80" cy="118" rx="58" ry="7" fill="#3B3355" opacity="0.07" />
      <circle cx="80" cy="56" r="26" fill="var(--owl-body, #C5AEFF)" />
      <circle cx="70" cy="52" r="8" fill="#fff" />
      <circle cx="90" cy="52" r="8" fill="#fff" />
      <circle cx="71" cy="53" r="4" fill={INK} />
      <circle cx="91" cy="53" r="4" fill={INK} />
      <path d="M77 60 L80 64 L83 60 Z" fill="#FFB59A" />
      <path d="M58 40 L80 30 L102 40 L80 50 Z" fill="#4A4168" />
      <path d="M30 70 h100 v38 a8 8 0 0 1 -8 8 H38 a8 8 0 0 1 -8 -8 Z" fill="#FFB59A" />
      <path d="M24 62 h112 a4 4 0 0 1 4 4 v8 a4 4 0 0 1 -4 4 H24 a4 4 0 0 1 -4 -4 v-8 a4 4 0 0 1 4 -4 Z" fill="#FFCDB9" />
      <rect x="72" y="62" width="16" height="54" fill="#FFE27A" />
      <circle cx="52" cy="96" r="2.5" fill={INK} />
      <circle cx="108" cy="96" r="2.5" fill={INK} />
      <path d="M126 22 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="#8FE0BE" />
      <path d="M30 28 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5 Z" fill="#9CCBFF" />
    </svg>
  );
}
