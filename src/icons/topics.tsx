import type { ReactNode } from 'react';
import type { FolderColor, FolderIconName } from '../lib/types';
import { PALETTE } from './palette';

/* Icon chủ đề cho thư mục – SVG tự vẽ, tô theo màu thư mục, vài icon có mặt cười. */

const INK = '#3B3355';
type Pal = { light: string; main: string; dark: string };

// Thuộc tính nét dùng chung: viền màu đậm, bo tròn.
const st = (c: Pal, w = 1.6) => ({ stroke: c.dark, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const });

const Face = ({ x, y, gap = 5 }: { x: number; y: number; gap?: number }) => (
  <>
    <circle cx={x - gap / 2} cy={y} r="1.2" fill={INK} />
    <circle cx={x + gap / 2} cy={y} r="1.2" fill={INK} />
    <path d={`M${x - 1.5} ${y + 2.6} q1.5 1.4 3 0`} stroke={INK} strokeWidth="1.2" fill="none" strokeLinecap="round" />
  </>
);

export const TOPICS: Record<FolderIconName, { label: string; draw: (c: Pal) => ReactNode }> = {
  /* ---------- Học tập chung ---------- */
  book: {
    label: 'Sách',
    draw: (c) => (
      <>
        <path d="M4 7 q7 -3 12 1 v17 q-5 -4 -12 -1 Z" fill={c.main} {...st(c)} />
        <path d="M28 7 q-7 -3 -12 1 v17 q5 -4 12 -1 Z" fill={c.light} {...st(c)} />
        <path d="M8 12 q3 -1 5 0.5 M8 16 q3 -1 5 0.5 M19 12.5 q2 -1.5 5 -0.5" fill="none" {...st(c, 1.3)} />
      </>
    ),
  },
  pencil: {
    label: 'Bút chì',
    draw: (c) => (
      <g transform="rotate(45 16 16)">
        <rect x="12" y="3" width="8" height="19" rx="1.5" fill={c.main} {...st(c)} />
        <rect x="12" y="3" width="8" height="4" rx="1.5" fill="#FFA8BC" {...st(c)} />
        <path d="M12 22 L16 29 L20 22 Z" fill="#FFE8DC" {...st(c)} />
        <path d="M15 27 L16 29 L17 27 Z" fill={INK} />
      </g>
    ),
  },
  bulb: {
    label: 'Ý tưởng',
    draw: (c) => (
      <>
        <path d="M16 4 a9 9 0 0 0 -5.5 16 c1 0.8 1.5 1.8 1.5 3 h8 c0 -1.2 0.5 -2.2 1.5 -3 A9 9 0 0 0 16 4 Z" fill={c.main} {...st(c)} />
        <path d="M12.5 26 h7 M13.5 29 h5" fill="none" {...st(c)} />
        <Face x={16} y={12.5} />
      </>
    ),
  },
  star: {
    label: 'Ngôi sao',
    draw: (c) => (
      <>
        <path d="M16 4 l3.6 7.4 8.1 1.2 -5.9 5.7 1.4 8.1 -7.2 -3.8 -7.2 3.8 1.4 -8.1 -5.9 -5.7 8.1 -1.2 Z" fill={c.main} {...st(c)} />
        <Face x={16} y={15.5} />
      </>
    ),
  },
  trophy: {
    label: 'Cúp',
    draw: (c) => (
      <>
        <path d="M10 5 h12 v7 a6 6 0 0 1 -12 0 Z" fill={c.main} {...st(c)} />
        <path d="M10 7 h-3 a3 3 0 0 0 3 6 M22 7 h3 a3 3 0 0 1 -3 6" fill="none" {...st(c)} />
        <path d="M14 18 h4 v4 h-4 Z" fill={c.light} {...st(c)} />
        <rect x="9.5" y="22" width="13" height="5" rx="1.5" fill={c.light} {...st(c)} />
        <Face x={16} y={9.5} gap={4.5} />
      </>
    ),
  },
  puzzle: {
    label: 'Câu đố',
    draw: (c) => (
      <path
        d="M6 9 h6 a3 3 0 1 1 6 0 h6 v6 a3 3 0 1 0 0 6 v6 h-6 a3 3 0 1 0 -6 0 h-6 v-6 a3 3 0 1 1 0 -6 Z"
        fill={c.main}
        {...st(c)}
      />
    ),
  },
  calc: {
    label: 'Toán học',
    draw: (c) => (
      <>
        <rect x="7" y="4" width="18" height="24" rx="3" fill={c.light} {...st(c)} />
        <rect x="10" y="7" width="12" height="5" rx="1" fill={c.main} />
        <path d="M11 17 h3 M12.5 15.5 v3 M18 17 h3 M11 23 h3 M18 22 h3 M18 24 h3" fill="none" {...st(c, 1.5)} />
      </>
    ),
  },
  chat: {
    label: 'Ngoại ngữ',
    draw: (c) => (
      <>
        <path d="M4 6 h15 a2 2 0 0 1 2 2 v8 a2 2 0 0 1 -2 2 h-9 l-4 4 v-4 a2 2 0 0 1 -2 -2 v-8 a2 2 0 0 1 2 -2 Z" fill={c.main} {...st(c)} />
        <path d="M23 12 h4 a2 2 0 0 1 2 2 v7 a2 2 0 0 1 -2 2 v3 l-3 -3 h-7 a2 2 0 0 1 -2 -2 v-1" fill={c.light} {...st(c)} />
        <path d="M9 10 h7 M9 14 h4" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
  scroll: {
    label: 'Lịch sử',
    draw: (c) => (
      <>
        <path d="M8 6 h16 v18 a3 3 0 0 1 -3 3 H8" fill={c.light} {...st(c)} />
        <path d="M8 6 a3 3 0 0 0 -3 3 v1 h6 V9 a3 3 0 0 0 -3 -3 Z" fill={c.main} {...st(c)} />
        <path d="M8 27 a3 3 0 0 1 -3 -3 v-1 h11 v1 a3 3 0 0 1 -3 3" fill={c.main} {...st(c)} />
        <path d="M14 11 h6 M14 15 h6 M14 19 h4" fill="none" {...st(c, 1.4)} />
      </>
    ),
  },
  scale: {
    label: 'Luật',
    draw: (c) => (
      <>
        <path d="M16 5 v21 M10 27 h12 M6 9 h20" fill="none" {...st(c)} />
        <path d="M3 18 l4 -9 4 9 a4 3 0 0 1 -8 0 Z" fill={c.main} {...st(c)} />
        <path d="M21 18 l4 -9 4 9 a4 3 0 0 1 -8 0 Z" fill={c.main} {...st(c)} />
        <circle cx="16" cy="5" r="2" fill={c.light} {...st(c)} />
      </>
    ),
  },
  coin: {
    label: 'Kinh tế',
    draw: (c) => (
      <>
        <ellipse cx="13" cy="22" rx="9" ry="4" fill={c.main} {...st(c)} />
        <ellipse cx="13" cy="18" rx="9" ry="4" fill={c.light} {...st(c)} />
        <circle cx="21" cy="11" r="7" fill={c.main} {...st(c)} />
        <path d="M21 7.5 v7 M19 9 h3 a1.2 1.2 0 0 1 0 2.4 h-2 a1.2 1.2 0 0 0 0 2.4 h3" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
      </>
    ),
  },
  code: {
    label: 'Lập trình',
    draw: (c) => (
      <>
        <rect x="3" y="6" width="26" height="20" rx="3" fill={c.light} {...st(c)} />
        <path d="M3 11 h26" {...st(c)} />
        <circle cx="6.5" cy="8.5" r="0.9" fill={c.dark} />
        <circle cx="9.5" cy="8.5" r="0.9" fill={c.dark} />
        <path d="M12 15 l-3 3 3 3 M20 15 l3 3 -3 3 M17.5 14 l-3 8" fill="none" {...st(c)} />
      </>
    ),
  },
  globe: {
    label: 'Địa lý',
    draw: (c) => (
      <>
        <circle cx="16" cy="16" r="11" fill={c.light} {...st(c)} />
        <path d="M9 10 q4 1 5 4 q-1 3 -4 3 q-2 2 -1 5 Q5 18 9 10 Z" fill={c.main} />
        <path d="M9 10 q4 1 5 4 q-1 3 -4 3 q-2 2 -1 5 M20 7 q-1 4 3 5 q3 0 3 3 M18 22 q2 -2 5 -1" fill="none" {...st(c, 1.4)} />
      </>
    ),
  },
  rocket: {
    label: 'Tên lửa',
    draw: (c) => (
      <g transform="rotate(40 16 16)">
        <path d="M16 3 C21 8 21 17 19.5 23 h-7 C11 17 11 8 16 3 Z" fill={c.light} {...st(c)} />
        <path d="M12.3 17 L8 22 l4.5 1 M19.7 17 L24 22 l-4.5 1" fill={c.main} {...st(c)} />
        <circle cx="16" cy="12" r="2.6" fill={c.main} {...st(c, 1.3)} />
        <path d="M14 25 q2 4 4 0" fill="#FFB59A" stroke="#FF8A65" strokeWidth="1.2" />
      </g>
    ),
  },

  /* ---------- Y học / sức khỏe ---------- */
  pill: {
    label: 'Thuốc',
    draw: (c) => (
      <g transform="rotate(-40 16 16)">
        <rect x="4" y="10" width="24" height="12" rx="6" fill={c.light} />
        <path d="M16 10 h6 a6 6 0 0 1 0 12 h-6 Z" fill={c.main} />
        <rect x="4" y="10" width="24" height="12" rx="6" fill="none" {...st(c)} />
      </g>
    ),
  },
  herb: {
    label: 'Thảo dược',
    draw: (c) => (
      <>
        <path d="M20 4 l-6 12" fill="none" {...st(c, 2.2)} />
        <path d="M5 16 h22 a11 9 0 0 1 -22 0 Z" fill={c.main} {...st(c)} />
        <path d="M10 25 h12 l1 3 h-14 Z" fill={c.light} {...st(c)} />
        <path d="M22 9 c3 -3 6 -2 7 -1 c-1 3 -4 4 -7 1 Z M9 13 c-2 -3 -1 -6 0 -7 c2 1 3 4 0 7 Z" fill="#8FE0BE" stroke="#3FBF8C" strokeWidth="1.2" strokeLinejoin="round" />
        <Face x={16} y={20} />
      </>
    ),
  },
  leaf: {
    label: 'Lá cây',
    draw: (c) => (
      <>
        <path d="M6 26 Q4 8 26 5 Q28 24 6 26 Z" fill={c.main} {...st(c)} />
        <path d="M7 25 Q14 15 22 10" fill="none" {...st(c)} />
        <circle cx="13" cy="16" r="1.3" fill={INK} />
        <circle cx="18" cy="13.5" r="1.3" fill={INK} />
      </>
    ),
  },
  needle: {
    label: 'Châm cứu',
    draw: (c) => (
      <>
        <path d="M7 27 L19 13" fill="none" stroke={c.dark} strokeWidth="1.3" strokeLinecap="round" />
        <path d="M18 14 L23 9" fill="none" {...st(c, 3.2)} />
        <path d="M19.5 12.5 l1.5 1.5 M21 11 l1.5 1.5" stroke="#fff" strokeWidth="1" />
        <circle cx="25" cy="7" r="2.6" fill={c.main} {...st(c, 1.3)} />
        <circle cx="10" cy="11" r="4" fill={c.light} {...st(c, 1.3)} />
        <path d="M8 11 h4 M10 9 v4" stroke={c.dark} strokeWidth="1.2" strokeLinecap="round" />
      </>
    ),
  },
  yinyang: {
    label: 'Âm dương',
    draw: (c) => (
      <>
        <circle cx="16" cy="16" r="12" fill="#fff" />
        <path d="M16 4 A12 12 0 0 1 16 28 Z" fill={c.dark} />
        <circle cx="16" cy="10" r="6" fill="#fff" />
        <circle cx="16" cy="22" r="6" fill={c.dark} />
        <circle cx="16" cy="10" r="1.9" fill={c.dark} />
        <circle cx="16" cy="22" r="1.9" fill="#fff" />
        <circle cx="16" cy="16" r="12" fill="none" {...st(c)} />
      </>
    ),
  },
  tea: {
    label: 'Chén thuốc',
    draw: (c) => (
      <>
        <path d="M11 4 q-2 2 0 4 q2 2 0 4 M16 3 q-2 2 0 4 q2 2 0 4" fill="none" stroke={c.dark} strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
        <path d="M5 14 h20 v3 a10 9 0 0 1 -20 0 Z" fill={c.main} {...st(c)} />
        <path d="M25 16 h1.5 a3 3 0 0 1 0 6 H23" fill="none" {...st(c)} />
        <path d="M6 28 h18" fill="none" {...st(c)} />
        <Face x={15} y={18.5} />
      </>
    ),
  },
  stetho: {
    label: 'Ống nghe',
    draw: (c) => (
      <>
        <path d="M8 4 v8 a6 6 0 0 0 12 0 V4" fill="none" {...st(c, 2)} />
        <path d="M14 18 v3 a5 5 0 0 0 10 0 v-3" fill="none" {...st(c, 2)} />
        <circle cx="24" cy="15" r="3.5" fill={c.main} {...st(c)} />
        <circle cx="24" cy="15" r="1.3" fill="#fff" />
        <circle cx="8" cy="4" r="1.6" fill={c.dark} />
        <circle cx="20" cy="4" r="1.6" fill={c.dark} />
      </>
    ),
  },
  heart: {
    label: 'Tim mạch',
    draw: (c) => (
      <>
        <path d="M16 27 C4 19 3 11 8 7.5 C12 5 15 7 16 10 C17 7 20 5 24 7.5 C29 11 28 19 16 27 Z" fill={c.main} {...st(c)} />
        <path d="M7 16 h5 l2 -3 3 6 2 -3 h6" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  brain: {
    label: 'Thần kinh',
    draw: (c) => (
      <>
        <path d="M16 6 C12 3 6 5 6 10 C3 12 3 17 6 19 C5 24 10 27 14 25 L16 26 L18 25 C22 27 27 24 26 19 C29 17 29 12 26 10 C26 5 20 3 16 6 Z" fill={c.main} {...st(c)} />
        <path d="M16 6 v20 M10 12 q3 1 3 4 M22 12 q-3 1 -3 4" fill="none" {...st(c, 1.4)} />
      </>
    ),
  },
  tooth: {
    label: 'Răng',
    draw: (c) => (
      <>
        <path d="M9 5 c3 -1 5 1 7 1 s4 -2 7 -1 c4 1.5 4 7 2.5 11 c-1 3 -1.5 6 -2.5 10 c-0.5 2 -2.5 2 -3 0 l-1.5 -5 c-0.5 -1.5 -2.5 -1.5 -3 0 l-1.5 5 c-0.5 2 -2.5 2 -3 0 c-1 -4 -1.5 -7 -2.5 -10 C5 12 5 6.5 9 5 Z" fill={c.light} {...st(c)} />
        <Face x={16} y={12} />
        <ellipse cx="10.5" cy="14" rx="1.6" ry="1" fill="#FF8FA8" opacity="0.7" />
        <ellipse cx="21.5" cy="14" rx="1.6" ry="1" fill="#FF8FA8" opacity="0.7" />
      </>
    ),
  },
  bone: {
    label: 'Xương khớp',
    draw: (c) => (
      <g transform="rotate(-35 16 16)">
        <circle cx="7" cy="12.5" r="3.3" fill={c.light} {...st(c)} />
        <circle cx="7" cy="19.5" r="3.3" fill={c.light} {...st(c)} />
        <circle cx="25" cy="12.5" r="3.3" fill={c.light} {...st(c)} />
        <circle cx="25" cy="19.5" r="3.3" fill={c.light} {...st(c)} />
        <rect x="7" y="13" width="18" height="6" fill={c.light} />
        <path d="M8 13 h16 M8 19 h16" {...st(c)} />
        <circle cx="14" cy="15.5" r="1" fill={INK} />
        <circle cx="18" cy="15.5" r="1" fill={INK} />
      </g>
    ),
  },
  eye: {
    label: 'Mắt',
    draw: (c) => (
      <>
        <path d="M3 16 C7 9 11 7 16 7 s9 2 13 9 c-4 7 -8 9 -13 9 S7 23 3 16 Z" fill="#fff" {...st(c)} />
        <circle cx="16" cy="16" r="5.5" fill={c.main} {...st(c, 1.3)} />
        <circle cx="16" cy="16" r="2.5" fill={INK} />
        <circle cx="17.5" cy="14.5" r="1" fill="#fff" />
      </>
    ),
  },
  dna: {
    label: 'Di truyền',
    draw: (c) => (
      <>
        <path d="M10 3 c0 7 12 7 12 13 s-12 6 -12 13" fill="none" {...st(c, 2)} />
        <path d="M22 3 c0 7 -12 7 -12 13 s12 6 12 13" fill="none" stroke={c.main} strokeWidth="2" strokeLinecap="round" />
        <path d="M12 7 h8 M11.5 25 h9 M13 12 h6 M13 20 h6" fill="none" stroke={c.dark} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      </>
    ),
  },
  flask: {
    label: 'Hóa học',
    draw: (c) => (
      <>
        <path d="M12 4 h8 M13 4 v8 L6 24 a3 3 0 0 0 2.6 4.5 h14.8 A3 3 0 0 0 26 24 L19 12 V4" fill={c.light} {...st(c)} />
        <path d="M8.5 20 h15 L26 24 a3 3 0 0 1 -2.6 4.5 H8.6 A3 3 0 0 1 6 24 Z" fill={c.main} />
        <circle cx="13" cy="23" r="1.4" fill="#fff" />
        <circle cx="18" cy="25" r="1" fill="#fff" />
      </>
    ),
  },
  atom: {
    label: 'Vật lý',
    draw: (c) => (
      <>
        <ellipse cx="16" cy="16" rx="12" ry="5" fill="none" {...st(c)} />
        <ellipse cx="16" cy="16" rx="12" ry="5" fill="none" transform="rotate(60 16 16)" {...st(c)} />
        <ellipse cx="16" cy="16" rx="12" ry="5" fill="none" transform="rotate(-60 16 16)" {...st(c)} />
        <circle cx="16" cy="16" r="3" fill={c.main} {...st(c, 1.2)} />
      </>
    ),
  },

  /* ---------- Y học cổ truyền ---------- */
  ginseng: {
    label: 'Nhân sâm',
    draw: (c) => (
      <>
        <path d="M16 8 V4.5" stroke="#3FBF8C" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M16 5 c-2 -3 -5 -2 -5.5 -1 c2 1.5 4 2 5.5 1 Z M16 5 c2 -3 5 -2 5.5 -1 c-2 1.5 -4 2 -5.5 1 Z" fill="#8FE0BE" stroke="#3FBF8C" strokeWidth="1" />
        <circle cx="16" cy="3" r="1.3" fill="#F2647F" />
        <path d="M12.5 13 L7 16.5 M19.5 13 L25 16.5 M14 20 L12 28 M18 20 L20 28 M7 16.5 l-1.5 1 M25 16.5 l1.5 1 M12 28 l-1.5 1 M20 28 l1.5 1" fill="none" {...st(c)} />
        <path d="M12.5 9 Q16 7 19.5 9 Q21.5 14.5 19.5 20 Q16 21.5 12.5 20 Q10.5 14.5 12.5 9 Z" fill={c.light} {...st(c)} />
        <Face x={16} y={13.5} />
        <path d="M13.5 17.5 h1.5 M17 17.5 h1.5" stroke={c.dark} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      </>
    ),
  },
  gourd: {
    label: 'Hồ lô',
    draw: (c) => (
      <>
        <path d="M15 3.5 h2 v3 h-2 Z" fill="#E8805C" stroke="#B85A3A" strokeWidth="1" />
        <circle cx="16" cy="11" r="4.8" fill={c.main} {...st(c)} />
        <circle cx="16" cy="21.5" r="7.5" fill={c.main} {...st(c)} />
        <path d="M12.5 15.5 q3.5 1.5 7 0" fill="none" stroke="#F2647F" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M19.5 16 l2 4 M19.5 16 l-0.5 4.5" stroke="#F2647F" strokeWidth="1.4" strokeLinecap="round" />
        <ellipse cx="13.5" cy="9.5" rx="1.3" ry="0.9" fill="#fff" opacity="0.7" />
        <Face x={16} y={21.5} />
      </>
    ),
  },
  lotus: {
    label: 'Hoa sen',
    draw: (c) => (
      <>
        <ellipse cx="16" cy="25.5" rx="12" ry="3" fill="#8FE0BE" stroke="#3FBF8C" strokeWidth="1.3" />
        <path d="M16 23 C9 23 4 19 3 14 C8 14 13 17 16 23 Z M16 23 C23 23 28 19 29 14 C24 14 19 17 16 23 Z" fill={c.light} {...st(c)} />
        <path d="M16 23 C11 19 9 13 10 8 C13 10 16 15 16 23 Z M16 23 C21 19 23 13 22 8 C19 10 16 15 16 23 Z" fill={c.main} {...st(c)} />
        <path d="M16 23 C13 18 13 10 16 4 C19 10 19 18 16 23 Z" fill={c.main} {...st(c)} />
      </>
    ),
  },
  bagua: {
    label: 'Bát quái',
    draw: (c) => (
      <>
        <path d="M11 3.5 h10 l7.5 7.5 v10 l-7.5 7.5 h-10 l-7.5 -7.5 v-10 Z" fill={c.light} {...st(c)} />
        <path d="M13 6.5 h6 M13 8.5 h2.3 M16.7 8.5 h2.3 M13 23.5 h6 M13 25.5 h6 M6.5 13 v6 M8.5 13 v2.3 M8.5 16.7 v2.3 M25.5 13 v6 M23.5 13 v6" fill="none" {...st(c, 1.3)} />
        <circle cx="16" cy="16" r="5" fill="#fff" />
        <path d="M16 11 A5 5 0 0 1 16 21 Z" fill={c.dark} />
        <circle cx="16" cy="13.5" r="2.5" fill="#fff" />
        <circle cx="16" cy="18.5" r="2.5" fill={c.dark} />
        <circle cx="16" cy="16" r="5" fill="none" {...st(c, 1.2)} />
      </>
    ),
  },
  wuxing: {
    label: 'Ngũ hành',
    draw: (c) => (
      <>
        <path d="M16 5 L26.5 12.6 L22.5 25 H9.5 L5.5 12.6 Z" fill="none" stroke={c.dark} strokeWidth="1.2" strokeLinejoin="round" opacity="0.5" />
        <circle cx="16" cy="5" r="3.6" fill="#F2647F" stroke="#fff" strokeWidth="1.2" />
        <circle cx="26.5" cy="12.6" r="3.6" fill="#F5C518" stroke="#fff" strokeWidth="1.2" />
        <circle cx="22.5" cy="25" r="3.6" fill="#CFCADB" stroke="#fff" strokeWidth="1.2" />
        <circle cx="9.5" cy="25" r="3.6" fill="#4D9EF5" stroke="#fff" strokeWidth="1.2" />
        <circle cx="5.5" cy="12.6" r="3.6" fill="#3FBF8C" stroke="#fff" strokeWidth="1.2" />
        <circle cx="16" cy="16.5" r="2.4" fill={c.main} {...st(c, 1.2)} />
      </>
    ),
  },
  moxa: {
    label: 'Cứu ngải',
    draw: (c) => (
      <>
        <path d="M22 6 q-2 -2 0 -4 M25 8 q2 -2.5 0 -5" fill="none" stroke={c.dark} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        <g transform="rotate(45 16 16)">
          <rect x="12.5" y="5" width="7" height="23" rx="2" fill={c.light} {...st(c)} />
          <path d="M12.5 11 h7 M12.5 22 h7" {...st(c, 1.2)} />
          <rect x="12.5" y="2.5" width="7" height="4" rx="2" fill="#FF8A65" stroke="#E8805C" strokeWidth="1.2" />
          <circle cx="16" cy="4.5" r="1.2" fill="#FFE27A" />
        </g>
        <path d="M6 26 c-1 -2 1 -3 0 -5 c2 1 3 3 2 5" fill="#8FE0BE" stroke="#3FBF8C" strokeWidth="1" strokeLinejoin="round" />
      </>
    ),
  },
  cupping: {
    label: 'Giác hơi',
    draw: (c) => (
      <>
        <path d="M3 26 h26" fill="none" stroke="#E8805C" strokeWidth="1.8" strokeLinecap="round" />
        <ellipse cx="16" cy="24" rx="6" ry="3" fill="#FFA8BC" opacity="0.8" />
        <path d="M8 25 V15 a8 8 0 0 1 16 0 V25" fill={c.light} fillOpacity="0.75" {...st(c)} />
        <path d="M7 25 h18" {...st(c)} />
        <path d="M11 13 a5 5 0 0 1 3 -4" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        <Face x={16} y={17} />
      </>
    ),
  },
  pulse: {
    label: 'Bắt mạch',
    draw: (c) => (
      <>
        <rect x="2" y="16" width="28" height="9" rx="4.5" fill="#FFE8DC" stroke="#E8805C" strokeWidth="1.4" />
        <rect x="7" y="7" width="5" height="11" rx="2.5" fill={c.main} {...st(c, 1.3)} />
        <rect x="13.5" y="5" width="5" height="13" rx="2.5" fill={c.main} {...st(c, 1.3)} />
        <path d="M5 21 h4 l1.5 -2 2 4 2 -4 2 4 2 -4 2 4 1.5 -2 h5" fill="none" stroke="#F2647F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="20" y="8" width="5" height="10" rx="2.5" fill={c.main} {...st(c, 1.3)} />
      </>
    ),
  },
  meridian: {
    label: 'Kinh lạc',
    draw: (c) => (
      <>
        <circle cx="16" cy="6" r="3.5" fill={c.light} {...st(c)} />
        <path d="M16 10 c-4 0 -6 2 -6 5 v4 h2.5 l0.5 9 h6 l0.5 -9 H22 v-4 c0 -3 -2 -5 -6 -5 Z" fill={c.light} {...st(c)} />
        <path d="M14 11 C13 16 15 19 14 27 M18 11 C19 16 17 19 18 27" fill="none" stroke="#F2647F" strokeWidth="1.1" strokeLinecap="round" />
        <circle cx="13.8" cy="14" r="1.2" fill="#F2647F" />
        <circle cx="14.3" cy="19" r="1.2" fill="#F2647F" />
        <circle cx="18.2" cy="16.5" r="1.2" fill="#F2647F" />
        <circle cx="17.9" cy="22.5" r="1.2" fill="#F2647F" />
      </>
    ),
  },
  cabinet: {
    label: 'Tủ thuốc',
    draw: (c) => (
      <>
        <rect x="4" y="4" width="24" height="22" rx="2" fill={c.main} {...st(c)} />
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((k) => (
            <g key={`${r}${k}`}>
              <rect x={6 + k * 7} y={6 + r * 6.5} width="6" height="5" rx="1" fill={c.light} />
              <circle cx={9 + k * 7} cy={8.5 + r * 6.5} r="0.9" fill={c.dark} />
            </g>
          )),
        )}
        <path d="M6 26 v3 M26 26 v3" {...st(c)} />
      </>
    ),
  },
  steelyard: {
    label: 'Cân thuốc',
    draw: (c) => (
      <>
        <path d="M4 9 L28 6" fill="none" {...st(c, 1.8)} />
        <path d="M12 8 V4" fill="none" {...st(c, 1.3)} />
        <path d="M7 8.6 L4 19 M7 8.6 L10 19" fill="none" stroke={c.dark} strokeWidth="1" />
        <path d="M2.5 19 h9 a4.5 3 0 0 1 -9 0 Z" fill={c.main} {...st(c)} />
        <path d="M5 18.5 q2 -2 4 0" fill="#8FE0BE" stroke="#3FBF8C" strokeWidth="0.9" />
        <path d="M23 6.6 V12" fill="none" stroke={c.dark} strokeWidth="1" />
        <path d="M20.5 12 h5 l1 5 h-7 Z" fill={c.light} {...st(c, 1.3)} />
        <path d="M15 7.9 v1.4 M18 7.5 v1.4 M21 7.1 v1.4" stroke={c.dark} strokeWidth="0.9" />
      </>
    ),
  },
  potsac: {
    label: 'Ấm sắc thuốc',
    draw: (c) => (
      <>
        <path d="M12 6 q-2 -2 0 -4 M16 6 q-2 -2 0 -4" fill="none" stroke={c.dark} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        <path d="M22 16 L30 13" fill="none" stroke="#B85A3A" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M5 16 L2 13" fill="none" {...st(c, 2)} />
        <path d="M6 13 h16 c1 8 -1 14 -8 14 s-9 -6 -8 -14 Z" fill={c.main} {...st(c)} />
        <path d="M8 13 a6 3 0 0 1 12 0" fill={c.light} {...st(c)} />
        <circle cx="14" cy="9.8" r="1.2" fill={c.dark} />
        <Face x={14} y={19} />
      </>
    ),
  },
  lingzhi: {
    label: 'Linh chi',
    draw: (c) => (
      <>
        <path d="M14 18 c-1 4 -1 7 -2 10 h5 c0 -3 0 -6 1 -10 Z" fill="#E8C9A6" stroke="#B88A5A" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M3 17 C3 9 9 5 16 5 S29 9 29 16 c-2 3 -7 3 -9 2 c-3 -1 -6 -1 -8 0 c-3 1 -7 1 -9 -1 Z" fill={c.main} {...st(c)} />
        <path d="M7 15 C8 10 12 8 16 8 s8 2 9 7 M11 14 c1 -2 3 -3 5 -3 s4 1 5 3" fill="none" stroke={c.dark} strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
      </>
    ),
  },
  cinnamon: {
    label: 'Quế',
    draw: (c) => (
      <>
        <g transform="rotate(-30 16 16)">
          <rect x="5" y="9" width="22" height="6" rx="3" fill={c.main} {...st(c)} />
          <path d="M8 10.5 v3 M24 10.5 v3" stroke={c.dark} strokeWidth="1" />
          <ellipse cx="5" cy="12" rx="1.8" ry="3" fill={c.light} {...st(c, 1.2)} />
        </g>
        <g transform="rotate(25 16 16)">
          <rect x="5" y="16" width="22" height="6" rx="3" fill={c.main} {...st(c)} />
          <ellipse cx="27" cy="19" rx="1.8" ry="3" fill={c.light} {...st(c, 1.2)} />
        </g>
        <path d="M24 4 l0.8 1.8 1.8 0.8 -1.8 0.8 -0.8 1.8 -0.8 -1.8 -1.8 -0.8 1.8 -0.8 Z" fill="#F5C518" />
      </>
    ),
  },
  ginger: {
    label: 'Gừng',
    draw: () => (
      <>
        <path d="M21 9 c0 -3 1 -5 3 -6 M21 9 c-1 -2 -3 -3 -5 -3" fill="none" stroke="#3FBF8C" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M4 21 c-1 -4 2 -6 5 -5 c0 -3 3 -5 5 -3 c1 -3 4 -4 6 -2 c2 -2 6 -1 6 2 c3 1 3 5 1 7 c1 3 -1 6 -4 5 c-2 2 -5 2 -7 0 c-3 2 -9 1 -12 -4 Z" fill="#F3D19C" stroke="#C99A4E" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9 16 c1 1 1 2 0 3 M20 11 c1 1 1 2 0 3 M24 17 c-1 1 -1 2 0 3" fill="none" stroke="#C99A4E" strokeWidth="1.1" strokeLinecap="round" />
        <Face x={15} y={18.5} />
      </>
    ),
  },
  chrysanthemum: {
    label: 'Cúc hoa',
    draw: (c) => (
      <>
        {Array.from({ length: 12 }, (_, i) => (
          <ellipse key={i} cx="16" cy="8.5" rx="2.3" ry="5.5" fill={i % 2 ? c.light : c.main} {...st(c, 1.1)} transform={`rotate(${i * 30} 16 16)`} />
        ))}
        <circle cx="16" cy="16" r="4.5" fill="#FFE27A" stroke="#E0AE00" strokeWidth="1.3" />
        <Face x={16} y={15.2} gap={4} />
      </>
    ),
  },
  goji: {
    label: 'Kỷ tử',
    draw: () => (
      <>
        <path d="M16 4 c-3 1 -6 4 -6 7 M16 4 c3 1 6 3 7 7 M16 4 v8" fill="none" stroke="#3FBF8C" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M16 4 c-4 -2 -7 0 -8 1 c3 2 6 1 8 -1 Z" fill="#8FE0BE" stroke="#3FBF8C" strokeWidth="1" />
        <ellipse cx="10" cy="17" rx="3.5" ry="6" transform="rotate(15 10 17)" fill="#F2647F" stroke="#C63F5C" strokeWidth="1.3" />
        <ellipse cx="22.5" cy="17.5" rx="3.5" ry="6" transform="rotate(-15 22.5 17.5)" fill="#F2647F" stroke="#C63F5C" strokeWidth="1.3" />
        <ellipse cx="16" cy="21" rx="4" ry="6.5" fill="#FF7A93" stroke="#C63F5C" strokeWidth="1.3" />
        <ellipse cx="14.5" cy="18" rx="1" ry="1.8" fill="#fff" opacity="0.7" />
        <Face x={16} y={22} gap={4} />
      </>
    ),
  },
  bamboo: {
    label: 'Tre trúc',
    draw: (c) => (
      <>
        <path d="M11 4 V29 M20 7 V29" fill="none" {...st(c, 4.5)} />
        <path d="M11 4 V29 M20 7 V29" fill="none" stroke={c.main} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M9 12 h4 M9 21 h4 M18 15 h4 M18 23 h4" stroke={c.dark} strokeWidth="1.4" strokeLinecap="round" />
        <path d="M13 12 c4 -2 8 -2 11 0 c-4 2 -8 2 -11 0 Z M22 15 c2 -3 5 -5 8 -5 c-1 3 -5 5 -8 5 Z M9 21 c-3 -1 -5 -3 -6 -6 c3 0 5 2 6 6 Z" fill="#8FE0BE" stroke="#3FBF8C" strokeWidth="1" strokeLinejoin="round" />
      </>
    ),
  },
  classic: {
    label: 'Sách cổ',
    draw: (c) => (
      <>
        <rect x="6" y="4" width="21" height="25" rx="1.5" fill={c.main} {...st(c)} />
        <path d="M10 4 v25" stroke={c.dark} strokeWidth="1.2" />
        <path d="M6 8 h4 M6 13.5 h4 M6 19 h4 M6 24.5 h4" stroke="#fff" strokeWidth="1.2" />
        <rect x="16" y="7.5" width="7" height="15" rx="1" fill="#FFF6CC" stroke={c.dark} strokeWidth="1.1" />
        <path d="M19.5 10 v2.5 M18 14.5 h3 M19.5 16 v4" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
      </>
    ),
  },
  tongue: {
    label: 'Xem lưỡi',
    draw: (c) => (
      <>
        <circle cx="16" cy="15" r="12" fill={c.light} {...st(c)} />
        <path d="M11 11 q1.5 -1.5 3 0 M18 11 q1.5 -1.5 3 0" fill="none" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
        <path d="M10 17 q6 4 12 0" fill="none" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
        <path d="M12.5 18.5 h7 v4 a3.5 3.5 0 0 1 -7 0 Z" fill="#FFA8BC" stroke="#F2647F" strokeWidth="1.2" />
        <path d="M16 19 v3" stroke="#F2647F" strokeWidth="1" strokeLinecap="round" />
        <ellipse cx="8.5" cy="15" rx="2" ry="1.2" fill="#FF8FA8" opacity="0.6" />
        <ellipse cx="23.5" cy="15" rx="2" ry="1.2" fill="#FF8FA8" opacity="0.6" />
      </>
    ),
  },

  /* ---------- Y học hiện đại ---------- */
  syringe: {
    label: 'Kim tiêm',
    draw: (c) => (
      <g transform="rotate(45 16 16)">
        <rect x="12" y="7" width="8" height="15" rx="1.5" fill={c.light} {...st(c)} />
        <rect x="12" y="13" width="8" height="9" rx="1" fill={c.main} />
        <rect x="12" y="7" width="8" height="15" rx="1.5" fill="none" {...st(c)} />
        <path d="M10 7 h12 M16 7 V3 M13 3 h6 M16 22 v7" fill="none" {...st(c)} />
        <path d="M14 11 h2 M14 15 h2 M14 19 h2" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" />
      </g>
    ),
  },
  microscope: {
    label: 'Kính hiển vi',
    draw: (c) => (
      <>
        <path d="M6 28 h20 M10 28 v-3 h12 v3" fill="none" {...st(c)} />
        <path d="M22 25 a8 8 0 0 0 -4 -14" fill="none" {...st(c, 2)} />
        <g transform="rotate(-30 14 12)">
          <rect x="11" y="3" width="6" height="14" rx="2" fill={c.main} {...st(c)} />
          <rect x="10" y="16" width="8" height="3" rx="1" fill={c.light} {...st(c, 1.3)} />
        </g>
        <path d="M9 21 h8" {...st(c, 2)} />
      </>
    ),
  },
  lungs: {
    label: 'Phổi',
    draw: (c) => (
      <>
        <path d="M16 4 v11 M16 12 l-4 3 M16 12 l4 3" fill="none" {...st(c, 1.8)} />
        <path d="M12 9 C6 9 4 16 4 22 c0 4 3 5 6 4 l3 -2 V13 c0 -2 -0.5 -4 -1 -4 Z" fill={c.main} {...st(c)} />
        <path d="M20 9 C26 9 28 16 28 22 c0 4 -3 5 -6 4 l-3 -2 V13 c0 -2 0.5 -4 1 -4 Z" fill={c.main} {...st(c)} />
        <path d="M8 17 q2 1 3 3 M24 17 q-2 1 -3 3" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
      </>
    ),
  },
  kidney: {
    label: 'Thận',
    draw: (c) => (
      <>
        <path d="M12 5 C5 5 3 12 4 18 c1 6 6 9 10 6 c2 -1.5 1 -4 -1 -5 c-2 -1 -2 -4 0 -5 c2 -1 3 -3 2 -5 c-0.5 -2 -1.5 -4 -3 -4 Z" fill={c.main} {...st(c)} />
        <path d="M14 14 h5 l3 -3 M19 14 l3 3 M22 17 v10" fill="none" {...st(c, 1.6)} />
        <ellipse cx="9" cy="11" rx="2" ry="1.3" fill="#fff" opacity="0.6" />
      </>
    ),
  },
  stomach: {
    label: 'Dạ dày',
    draw: (c) => (
      <>
        <path d="M12 3 v6 c0 3 -6 4 -6 11 c0 6 6 9 12 8 c6 -1 9 -6 8 -11 c-1 -4 -5 -5 -8 -3 c-2 1.5 -3 0 -3 -2 V3" fill={c.main} {...st(c)} />
        <path d="M24 22 q3 2 4 6" fill="none" {...st(c)} />
        <Face x={15} y={19} />
      </>
    ),
  },
  liver: {
    label: 'Gan',
    draw: (c) => (
      <>
        <path d="M3 13 C5 7 14 6 22 7 c5 0.5 8 3 7 6 c-1 3 -5 4 -9 6 c-4 2 -7 6 -11 5 C4 23 2 17 3 13 Z" fill={c.main} {...st(c)} />
        <path d="M17 7.5 C16 12 15 16 16 21" fill="none" {...st(c, 1.3)} />
        <Face x={10} y={14} />
      </>
    ),
  },
  bandage: {
    label: 'Băng cá nhân',
    draw: (c) => (
      <g transform="rotate(-40 16 16)">
        <rect x="2" y="11" width="28" height="10" rx="5" fill={c.light} {...st(c)} />
        <rect x="11" y="11" width="10" height="10" fill={c.main} />
        <rect x="2" y="11" width="28" height="10" rx="5" fill="none" {...st(c)} />
        {[13.5, 16, 18.5].map((x) => (
          <g key={x}>
            <circle cx={x} cy="14" r="0.7" fill="#fff" />
            <circle cx={x} cy="18" r="0.7" fill="#fff" />
          </g>
        ))}
      </g>
    ),
  },
  thermometer: {
    label: 'Nhiệt kế',
    draw: (c) => (
      <>
        <path d="M13 6 a3 3 0 0 1 6 0 v13 a6 6 0 1 1 -6 0 Z" fill={c.light} {...st(c)} />
        <path d="M16 11 v11" stroke="#F2647F" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="16" cy="24" r="3.6" fill="#F2647F" />
        <path d="M21 9 h3 M21 13 h3 M21 17 h3" fill="none" {...st(c, 1.3)} />
      </>
    ),
  },
  blood: {
    label: 'Huyết học',
    draw: () => (
      <>
        <path d="M16 3 C11 11 7 15 7 20 a9 9 0 0 0 18 0 c0 -5 -4 -9 -9 -17 Z" fill="#F2647F" stroke="#C63F5C" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M11 20 a5 5 0 0 0 4 5" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
        <Face x={16} y={18} />
      </>
    ),
  },
  virus: {
    label: 'Vi sinh',
    draw: (c) => (
      <>
        {Array.from({ length: 8 }, (_, i) => (
          <g key={i} transform={`rotate(${i * 45} 16 16)`}>
            <path d="M16 6 V3" {...st(c, 1.6)} />
            <circle cx="16" cy="2.8" r="1.6" fill={c.main} {...st(c, 1)} />
          </g>
        ))}
        <circle cx="16" cy="16" r="9" fill={c.main} {...st(c)} />
        <circle cx="13" cy="13" r="1.6" fill={c.light} />
        <circle cx="19" cy="18.5" r="1.2" fill={c.light} />
        <Face x={16} y={15.5} />
      </>
    ),
  },
  ambulance: {
    label: 'Cấp cứu',
    draw: (c) => (
      <>
        <path d="M3 10 h15 v13 H3 Z M18 13 h5 l5 5 v5 H18 Z" fill={c.light} {...st(c)} />
        <path d="M20 14.5 h3 l3 3 h-6 Z" fill={c.main} />
        <path d="M10.5 13 v7 M7 16.5 h7" stroke="#F2647F" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="8" cy="24" r="2.8" fill={c.main} {...st(c)} />
        <circle cx="22" cy="24" r="2.8" fill={c.main} {...st(c)} />
        <rect x="7" y="6.5" width="5" height="3.5" rx="1" fill="#F2647F" />
      </>
    ),
  },
  baby: {
    label: 'Nhi khoa',
    draw: (c) => (
      <>
        <circle cx="16" cy="17" r="11" fill="#FFE8DC" stroke="#E8805C" strokeWidth="1.6" />
        <path d="M16 6 c-2 0 -3 2 -2 3.5 c1 1 2.5 0 2 -1.5" fill="none" stroke="#E8805C" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1.4" fill={INK} />
        <circle cx="20" cy="16" r="1.4" fill={INK} />
        <ellipse cx="9" cy="19.5" rx="2" ry="1.2" fill="#FF8FA8" opacity="0.7" />
        <ellipse cx="23" cy="19.5" rx="2" ry="1.2" fill="#FF8FA8" opacity="0.7" />
        <rect x="13.5" y="20" width="5" height="4" rx="2" fill={c.main} {...st(c, 1.2)} />
        <circle cx="16" cy="25" r="1.6" fill={c.main} {...st(c, 1)} />
      </>
    ),
  },

  /* ---------- Y học cổ truyền (thêm) ---------- */
  jujube: {
    label: 'Đại táo',
    draw: () => (
      <>
        <path d="M16 7 c0 -2 1 -4 3 -5" fill="none" stroke="#3FBF8C" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M19 3 c3 -1 6 0 7 2 c-3 1 -5 0 -7 -2 Z" fill="#8FE0BE" stroke="#3FBF8C" strokeWidth="1" />
        <ellipse cx="16" cy="18" rx="9" ry="11" fill="#C9473F" stroke="#8E2C2A" strokeWidth="1.6" />
        <path d="M10 13 q2 4 0 9 M14 10 q2 6 0 14 M19 10 q-1.5 6 0 14" fill="none" stroke="#8E2C2A" strokeWidth="1" opacity="0.6" />
        <ellipse cx="12" cy="13" rx="1.6" ry="2.5" fill="#fff" opacity="0.4" />
      </>
    ),
  },
  licorice: {
    label: 'Cam thảo',
    draw: (c) => (
      <>
        <ellipse cx="11" cy="20" rx="8" ry="8" fill="#F3D19C" stroke="#C99A4E" strokeWidth="1.6" />
        <circle cx="11" cy="20" r="5" fill="none" stroke="#C99A4E" strokeWidth="1" />
        <circle cx="11" cy="20" r="2" fill="#E0B470" />
        <path d="M11 13 v14 M4 20 h14 M6 15 l10 10 M16 15 L6 25" stroke="#C99A4E" strokeWidth="0.7" opacity="0.6" />
        <ellipse cx="23" cy="11" rx="6" ry="6" fill={c.light} {...st(c)} />
        <circle cx="23" cy="11" r="3.5" fill="none" stroke={c.dark} strokeWidth="1" />
        <circle cx="23" cy="11" r="1.3" fill={c.main} />
      </>
    ),
  },
  acupoint: {
    label: 'Huyệt vị',
    draw: (c) => (
      <>
        <path d="M10 29 V17 l-3 -5 c-1 -1.6 1 -3 2.2 -1.6 L12 14 V5.5 a1.7 1.7 0 0 1 3.4 0 V13 V4 a1.7 1.7 0 0 1 3.4 0 v9 V6 a1.7 1.7 0 0 1 3.4 0 V22 c0 4 -2 7 -5 7 Z" fill="#FFE8DC" stroke="#E8805C" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="13.7" cy="10" r="1.4" fill={c.dark} />
        <circle cx="17.1" cy="9" r="1.4" fill={c.dark} />
        <circle cx="15.5" cy="20" r="1.8" fill="#F2647F" />
        <circle cx="15.5" cy="20" r="3.4" fill="none" stroke="#F2647F" strokeWidth="1" opacity="0.6" />
      </>
    ),
  },

  /* ---------- Học tập (thêm) ---------- */
  gradcap: {
    label: 'Tốt nghiệp',
    draw: (c) => (
      <>
        <path d="M9 15 v6 c0 2 3 4 7 4 s7 -2 7 -4 v-6" fill={c.main} {...st(c)} />
        <path d="M2 12 L16 6 L30 12 L16 18 Z" fill={c.dark} stroke={c.dark} strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M16 12 L26 14 V22" fill="none" stroke="#F5C518" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M24.5 22 h3 l-1.5 4 Z" fill="#F5C518" />
      </>
    ),
  },
  clock: {
    label: 'Đồng hồ',
    draw: (c) => (
      <>
        <path d="M7 5 l-3 3 M25 5 l3 3" {...st(c, 2.2)} />
        <circle cx="16" cy="17" r="11" fill={c.light} {...st(c)} />
        <path d="M16 11 v6 l4 3" fill="none" {...st(c, 2)} />
        <circle cx="16" cy="17" r="1.3" fill={c.dark} />
        <path d="M16 7.5 v1.5 M16 25 v1.5 M6.5 17 h1.5 M24 17 h1.5" {...st(c, 1.3)} />
      </>
    ),
  },
  calendar: {
    label: 'Lịch thi',
    draw: (c) => (
      <>
        <rect x="4" y="6" width="24" height="22" rx="3" fill={c.light} {...st(c)} />
        <path d="M4 9 a3 3 0 0 1 3 -3 h18 a3 3 0 0 1 3 3 v3 H4 Z" fill={c.main} />
        <rect x="4" y="6" width="24" height="22" rx="3" fill="none" {...st(c)} />
        <path d="M10 3.5 v5 M22 3.5 v5" {...st(c, 2)} />
        {[0, 1, 2, 3].map((x) => [0, 1].map((y) => <rect key={`${x}${y}`} x={7.5 + x * 4.5} y={15 + y * 5} width="3" height="3" rx="0.8" fill={x === 2 && y === 1 ? '#F2647F' : c.main} />))}
      </>
    ),
  },
  notebook: {
    label: 'Vở ghi',
    draw: (c) => (
      <>
        <rect x="7" y="4" width="20" height="25" rx="2.5" fill={c.light} {...st(c)} />
        <path d="M11 4 v25" stroke="#F2647F" strokeWidth="1.2" />
        <path d="M14 10 h9 M14 14 h9 M14 18 h9 M14 22 h6" stroke={c.dark} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        {[8, 13, 18, 23].map((y) => <circle key={y} cx="7" cy={y} r="1.5" fill="#fff" {...st(c, 1.1)} />)}
      </>
    ),
  },
  backpack: {
    label: 'Cặp sách',
    draw: (c) => (
      <>
        <path d="M12 7 a4 4 0 0 1 8 0" fill="none" {...st(c, 2)} />
        <rect x="6" y="7" width="20" height="22" rx="6" fill={c.main} {...st(c)} />
        <rect x="10" y="17" width="12" height="9" rx="2.5" fill={c.light} {...st(c, 1.4)} />
        <path d="M10 20.5 h12" {...st(c, 1.2)} />
        <Face x={16} y={12} />
      </>
    ),
  },
  flag: {
    label: 'Mục tiêu',
    draw: (c) => (
      <>
        <path d="M8 29 V4" {...st(c, 2.2)} />
        <path d="M8 5 c5 -2 8 2 12 0 s6 -1 7 0 v11 c-2 -1 -4 0 -7 1 s-7 -2 -12 0 Z" fill={c.main} {...st(c)} />
        <path d="M5 29 h7" {...st(c, 2)} />
        <circle cx="15" cy="10.5" r="1.1" fill={INK} />
        <circle cx="19.5" cy="10" r="1.1" fill={INK} />
      </>
    ),
  },
  magnifier: {
    label: 'Tra cứu',
    draw: (c) => (
      <>
        <path d="M20 20 l8 8" {...st(c, 3.5)} />
        <circle cx="13" cy="13" r="9" fill={c.light} {...st(c, 2)} />
        <path d="M8.5 11 a5 5 0 0 1 4 -3.5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        <Face x={13} y={13.5} />
      </>
    ),
  },
  chartbar: {
    label: 'Biểu đồ',
    draw: (c) => (
      <>
        <path d="M4 28 h24 M4 4 v24" fill="none" {...st(c)} />
        <rect x="8" y="17" width="4.5" height="11" rx="1.2" fill={c.light} {...st(c, 1.3)} />
        <rect x="15" y="11" width="4.5" height="17" rx="1.2" fill={c.main} {...st(c, 1.3)} />
        <rect x="22" y="6" width="4.5" height="22" rx="1.2" fill={c.dark} />
        <path d="M8 13 l7 -5 l5 2 l7 -6" fill="none" stroke="#F2647F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  coffee: {
    label: 'Cà phê',
    draw: (c) => (
      <>
        <path d="M12 3 q-2 2 0 4 q2 2 0 4 M17 3 q-2 2 0 4 q2 2 0 4" fill="none" stroke={c.dark} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        <path d="M6 13 h18 v8 a7 7 0 0 1 -7 7 h-4 a7 7 0 0 1 -7 -7 Z" fill={c.main} {...st(c)} />
        <path d="M24 15 h1.5 a3.5 3.5 0 0 1 0 7 H23" fill="none" {...st(c)} />
        <path d="M8 15.5 h14" stroke="#8B5E3C" strokeWidth="2" strokeLinecap="round" />
        <Face x={15} y={20.5} />
      </>
    ),
  },

  /* ---------- Sở thích (thêm) ---------- */
  headphones: {
    label: 'Tai nghe',
    draw: (c) => (
      <>
        <path d="M6 20 v-4 a10 10 0 0 1 20 0 v4" fill="none" {...st(c, 2.2)} />
        <rect x="3.5" y="17" width="6" height="10" rx="3" fill={c.main} {...st(c)} />
        <rect x="22.5" y="17" width="6" height="10" rx="3" fill={c.main} {...st(c)} />
        <path d="M13 21 l2 -4 v8 l3 -6" fill="none" stroke="#F2647F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  gamepad: {
    label: 'Trò chơi',
    draw: (c) => (
      <>
        <path d="M9 9 h14 c4 0 6 4 6.5 9 c0.5 5 -1 8 -3.5 8 c-2.5 0 -3.5 -3 -5.5 -4 h-9 c-2 1 -3 4 -5.5 4 C3.5 26 2 23 2.5 18 C3 13 5 9 9 9 Z" fill={c.main} {...st(c)} />
        <path d="M9 14 v6 M6 17 h6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="22" cy="15" r="1.5" fill="#F2647F" />
        <circle cx="25" cy="18" r="1.5" fill="#F5C518" />
        <circle cx="19" cy="18" r="1.5" fill="#3FBF8C" />
      </>
    ),
  },
  dog: {
    label: 'Cún con',
    draw: (c) => (
      <>
        <path d="M7 7 C3 7 2 14 4 18 c1 2 3 1 4 -1" fill={c.dark} {...st(c)} />
        <path d="M25 7 C29 7 30 14 28 18 c-1 2 -3 1 -4 -1" fill={c.dark} {...st(c)} />
        <ellipse cx="16" cy="17" rx="10" ry="10" fill={c.main} {...st(c)} />
        <ellipse cx="16" cy="21" rx="5" ry="4" fill={c.light} />
        <circle cx="12" cy="15" r="1.4" fill={INK} />
        <circle cx="20" cy="15" r="1.4" fill={INK} />
        <ellipse cx="16" cy="19" rx="1.8" ry="1.3" fill={INK} />
        <path d="M14 22 q2 1.5 4 0" stroke={INK} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M16 23 v2 q0 1.5 1.5 1" fill="#FF8FA8" />
      </>
    ),
  },
  bear: {
    label: 'Gấu',
    draw: (c) => (
      <>
        <circle cx="8" cy="9" r="4.5" fill={c.main} {...st(c)} />
        <circle cx="24" cy="9" r="4.5" fill={c.main} {...st(c)} />
        <circle cx="8" cy="9" r="2" fill={c.light} />
        <circle cx="24" cy="9" r="2" fill={c.light} />
        <circle cx="16" cy="18" r="11" fill={c.main} {...st(c)} />
        <ellipse cx="16" cy="21.5" rx="5" ry="4" fill={c.light} />
        <circle cx="12" cy="16" r="1.4" fill={INK} />
        <circle cx="20" cy="16" r="1.4" fill={INK} />
        <ellipse cx="16" cy="20" rx="1.8" ry="1.2" fill={INK} />
        <path d="M14.5 22.5 q1.5 1.2 3 0" stroke={INK} strokeWidth="1.1" fill="none" strokeLinecap="round" />
        <ellipse cx="9" cy="20" rx="1.8" ry="1" fill="#FF8FA8" opacity="0.7" />
        <ellipse cx="23" cy="20" rx="1.8" ry="1" fill="#FF8FA8" opacity="0.7" />
      </>
    ),
  },
  flower: {
    label: 'Hoa',
    draw: (c) => (
      <>
        <path d="M16 20 V30" stroke="#3FBF8C" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M16 26 c-4 0 -6 -2 -6 -4 c3 0 5 1 6 4 Z" fill="#8FE0BE" stroke="#3FBF8C" strokeWidth="1" />
        {Array.from({ length: 5 }, (_, i) => (
          <ellipse key={i} cx="16" cy="6.5" rx="4" ry="5" fill={c.main} {...st(c, 1.2)} transform={`rotate(${i * 72} 16 13)`} />
        ))}
        <circle cx="16" cy="13" r="4" fill="#FFE27A" stroke="#E0AE00" strokeWidth="1.2" />
        <Face x={16} y={12.4} gap={3.6} />
      </>
    ),
  },
  rainbow: {
    label: 'Cầu vồng',
    draw: () => (
      <>
        <path d="M3 24 a13 13 0 0 1 26 0" fill="none" stroke="#F2647F" strokeWidth="3" />
        <path d="M6.5 24 a9.5 9.5 0 0 1 19 0" fill="none" stroke="#F5C518" strokeWidth="3" />
        <path d="M10 24 a6 6 0 0 1 12 0" fill="none" stroke="#3FBF8C" strokeWidth="3" />
        <path d="M13.3 24 a2.7 2.7 0 0 1 5.4 0" fill="none" stroke="#4D9EF5" strokeWidth="3" />
        <ellipse cx="6" cy="25" rx="5" ry="3" fill="#fff" stroke="#C5D9EE" strokeWidth="1.2" />
        <ellipse cx="26" cy="25" rx="5" ry="3" fill="#fff" stroke="#C5D9EE" strokeWidth="1.2" />
      </>
    ),
  },

  /* ---------- Sở thích / khác ---------- */
  music: {
    label: 'Âm nhạc',
    draw: (c) => (
      <>
        <path d="M12 23 V7 l14 -3 v16" fill="none" {...st(c, 2)} />
        <path d="M12 11 l14 -3" fill="none" {...st(c, 2)} />
        <ellipse cx="8.5" cy="23.5" rx="4" ry="3.2" fill={c.main} {...st(c)} />
        <ellipse cx="22.5" cy="20.5" rx="4" ry="3.2" fill={c.main} {...st(c)} />
      </>
    ),
  },
  palette: {
    label: 'Mỹ thuật',
    draw: (c) => (
      <>
        <path d="M16 4 C8 4 3 10 3 16 c0 6 5 11 11 11 c2 0 2.5 -1.5 2 -3 c-0.7 -2 0.5 -3.5 2.5 -3.5 H22 c4 0 7 -2.5 7 -6.5 C29 9 23 4 16 4 Z" fill={c.light} {...st(c)} />
        <circle cx="10" cy="15" r="2.2" fill="#F2647F" />
        <circle cx="13" cy="9.5" r="2.2" fill="#F5C518" />
        <circle cx="19.5" cy="9" r="2.2" fill="#4D9EF5" />
        <circle cx="24" cy="13.5" r="2.2" fill="#3FBF8C" />
      </>
    ),
  },
  camera: {
    label: 'Nhiếp ảnh',
    draw: (c) => (
      <>
        <path d="M4 11 a2 2 0 0 1 2 -2 h4 l2 -3 h8 l2 3 h4 a2 2 0 0 1 2 2 v13 a2 2 0 0 1 -2 2 H6 a2 2 0 0 1 -2 -2 Z" fill={c.main} {...st(c)} />
        <circle cx="16" cy="17" r="5.5" fill={c.light} {...st(c)} />
        <circle cx="16" cy="17" r="2.5" fill={INK} />
        <circle cx="17" cy="16" r="0.9" fill="#fff" />
      </>
    ),
  },
  ball: {
    label: 'Thể thao',
    draw: (c) => (
      <>
        <circle cx="16" cy="16" r="12" fill={c.light} {...st(c)} />
        <path d="M16 11 l4.5 3.3 -1.7 5.3 h-5.6 l-1.7 -5.3 Z" fill={c.main} {...st(c, 1.3)} />
        <path d="M16 11 V5 M20.5 14.3 l6 -2 M18.8 19.6 l3.5 5 M13.2 19.6 l-3.5 5 M11.5 14.3 l-6 -2" fill="none" {...st(c, 1.3)} />
      </>
    ),
  },
  plant: {
    label: 'Cây cảnh',
    draw: (c) => (
      <>
        <path d="M16 19 V10" fill="none" stroke="#3FBF8C" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M16 12 c-5 0 -8 -3 -8 -7 c5 0 8 3 8 7 Z M16 15 c4 0 7 -3 7 -6 c-4 0 -7 2 -7 6 Z" fill="#8FE0BE" stroke="#3FBF8C" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M8 19 h16 l-2 9 H10 Z" fill={c.main} {...st(c)} />
        <Face x={16} y={22.5} />
      </>
    ),
  },
  cat: {
    label: 'Mèo',
    draw: (c) => (
      <>
        <path d="M6 13 L6 4 L12 9 Q16 8 20 9 L26 4 L26 13 Q28 17 26 21 Q22 27 16 27 Q10 27 6 21 Q4 17 6 13 Z" fill={c.main} {...st(c)} />
        <path d="M8 8 l2.5 2.5 M24 8 l-2.5 2.5" stroke="#FFA8BC" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1.4" fill={INK} />
        <circle cx="20" cy="16" r="1.4" fill={INK} />
        <path d="M15 19 h2 l-1 1.2 Z" fill="#FF8FA8" />
        <path d="M14 21 q2 1.5 4 0 M4 18 h5 M4 21 l5 -1 M28 18 h-5 M28 21 l-5 -1" fill="none" stroke={INK} strokeWidth="1" strokeLinecap="round" />
      </>
    ),
  },
  sun: {
    label: 'Mặt trời',
    draw: (c) => (
      <>
        <path d="M16 2.5 v3.5 M16 26 v3.5 M2.5 16 h3.5 M26 16 h3.5 M6.5 6.5 l2.5 2.5 M23 23 l2.5 2.5 M6.5 25.5 l2.5 -2.5 M23 9 l2.5 -2.5" fill="none" {...st(c, 1.8)} />
        <circle cx="16" cy="16" r="7.5" fill={c.main} {...st(c)} />
        <Face x={16} y={15} />
      </>
    ),
  },
  moon: {
    label: 'Mặt trăng',
    draw: (c) => (
      <>
        <path d="M20 4 a12 12 0 1 0 8 19 a10 10 0 0 1 -8 -19 Z" fill={c.main} {...st(c)} />
        <circle cx="11" cy="17" r="1.2" fill={INK} />
        <circle cx="16" cy="17" r="1.2" fill={INK} />
        <path d="M12 20 q1.5 1.4 3 0" stroke={INK} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M26 7 l0.8 1.8 1.8 0.8 -1.8 0.8 -0.8 1.8 -0.8 -1.8 -1.8 -0.8 1.8 -0.8 Z" fill="#F5C518" />
      </>
    ),
  },
};

export function TopicIcon({ name, size = 28, color = 'lilac' }: { name: FolderIconName; size?: number; color?: FolderColor }) {
  const c = PALETTE[color] ?? PALETTE.lilac;
  const t = TOPICS[name] ?? TOPICS.book;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      {t.draw(c)}
    </svg>
  );
}
