import { useEffect, useRef, useState, type ReactNode } from 'react';

/*
 * Bộ biểu đồ SVG tự vẽ (không dùng thư viện) cho trang Thống kê.
 * Màu đã kiểm tra an toàn cho người mù màu: Đúng = tím #8C6CF0, Sai = cam #F08A4B.
 * Quy tắc: nét mảnh, đầu cột bo 4px, khe 2px giữa các phần, lưới mảnh nhạt,
 * mọi giá trị đều xem được qua tooltip (rê chuột / focus bàn phím) và bảng số liệu.
 */

// Màu biểu đồ lấy từ biến CSS (index.css) nên tự đổi theo chế độ Sáng / Tối.
// Bộ màu từng chế độ đã được kiểm tra an toàn cho người mù màu trên đúng nền của chế độ đó.
export const C = {
  right: 'var(--c-lilac)',
  wrong: 'var(--c-orange)',
  neutral: 'var(--c-neutral)',
  grid: 'var(--c-grid)',
  axis: 'var(--c-axis)',
  surface: 'var(--c-surface)',
  ink: 'var(--c-ink)',
  // 3 màu phân loại: tím, cam, xanh ngọc.
  cat: ['var(--c-lilac)', 'var(--c-orange)', 'var(--c-teal)'],
  // Thang tuần tự 1 màu (nhạt → đậm) cho bản đồ nhiệt; seq[0] là ô không có dữ liệu.
  seq: ['var(--seq-0)', 'var(--seq-1)', 'var(--seq-2)', 'var(--seq-3)', 'var(--seq-4)'],
};

/* ---------------- Khung thẻ biểu đồ + bảng số liệu ---------------- */

export function ChartCard({
  title,
  subtitle,
  icon,
  table,
  legend,
  children,
  className = '',
}: {
  title: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  table?: { head: string[]; rows: (string | number)[][] };
  legend?: { color: string; label: string }[];
  children: ReactNode;
  className?: string;
}) {
  const [showTable, setShowTable] = useState(false);
  return (
    <section className={`card flex flex-col p-4 sm:p-5 ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 font-black">
            {icon}
            {title}
          </h3>
          {subtitle && <p className="mt-0.5 text-sm text-ink/55">{subtitle}</p>}
        </div>
        {table && (
          <button
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-ink/45 hover:bg-ink/5 hover:text-ink"
            onClick={() => setShowTable((s) => !s)}
          >
            {showTable ? 'Biểu đồ' : 'Bảng số'}
          </button>
        )}
      </div>
      {legend && legend.length > 1 && !showTable && (
        <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-ink/60">
          {legend.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      )}
      {showTable && table ? (
        <div className="max-h-72 overflow-auto rounded-xl border border-ink/5">
          <table className="w-full text-sm tabular-nums">
            <thead className="sticky top-0 bg-cream text-left text-xs text-ink/55">
              <tr>
                {table.head.map((h) => (
                  <th key={h} className="px-3 py-2 font-extrabold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i} className="border-t border-ink/5">
                  {r.map((c, j) => (
                    <td key={j} className="px-3 py-1.5">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex-1">{children}</div>
      )}
    </section>
  );
}

/* ---------------- Đo bề ngang thật để chữ trên trục luôn đúng cỡ ---------------- */

function useWidth(fallback = 600) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/* ---------------- Tooltip dùng chung ---------------- */

interface Tip {
  x: number; // % theo chiều ngang khung
  y: number; // % theo chiều dọc khung
  content: ReactNode;
}

function useTip() {
  const [tip, setTip] = useState<Tip | null>(null);
  const node = tip && (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-xl bg-ink px-3 py-2 text-xs font-bold text-cream shadow-lg"
      style={{ left: `${Math.min(Math.max(tip.x, 12), 88)}%`, top: `calc(${tip.y}% - 8px)` }}
    >
      {tip.content}
    </div>
  );
  return { tip, setTip, node };
}

const TipRow = ({ color, label, value }: { color?: string; label: string; value: ReactNode }) => (
  <div className="flex items-center gap-1.5">
    {color && <span className="h-2 w-2 rounded-sm" style={{ background: color }} />}
    <span className="font-semibold opacity-75">{label}</span>
    <span className="ml-auto pl-3">{value}</span>
  </div>
);

/** Hình chữ nhật bo góc trên (đầu dữ liệu), vuông ở đáy. */
function topRounded(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, h, w / 2);
  if (h <= 0) return '';
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

const niceMax = (v: number) => {
  if (v <= 5) return 5;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
};

/* ---------------- Cột chồng (đúng / sai theo ngày) ---------------- */

export interface StackDatum {
  label: string; // nhãn trục
  full: string; // nhãn trong tooltip
  parts: { key: string; value: number; color: string }[];
  highlight?: boolean;
}

export function StackedColumns({ data, height = 190, every = 1 }: { data: StackDatum[]; height?: number; every?: number }) {
  const { setTip, node } = useTip();
  const [box, W] = useWidth();
  const padL = 30;
  const padB = 24;
  const H = height;
  const plotH = H - padB - 8;
  const max = niceMax(Math.max(1, ...data.map((d) => d.parts.reduce((s, p) => s + p.value, 0))));
  const band = (W - padL) / data.length;
  const bw = Math.min(24, band * 0.6);
  const ticks = [0, max / 2, max];

  return (
    <div ref={box} className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Biểu đồ cột">
        {ticks.map((t) => {
          const y = 8 + plotH - (t / max) * plotH;
          return (
            <g key={t}>
              <line x1={padL} x2={W} y1={y} y2={y} stroke={C.grid} strokeWidth={1} />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="11" fill={C.axis} className="tabular-nums">
                {t}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const cx = padL + band * i + band / 2;
          let y = 8 + plotH;
          const total = d.parts.reduce((s, p) => s + p.value, 0);
          const visible = d.parts.filter((p) => p.value > 0);
          const show = () =>
            setTip({
              x: (cx / W) * 100,
              y: ((8 + plotH - (total / max) * plotH) / H) * 100,
              content: (
                <div className="min-w-[120px]">
                  <div className="mb-1">{d.full}</div>
                  {d.parts.map((p) => (
                    <TipRow key={p.key} color={p.color} label={p.key} value={p.value} />
                  ))}
                </div>
              ),
            });
          return (
            <g key={i}>
              {visible.map((p, j) => {
                const h = (p.value / max) * plotH;
                const top = j === visible.length - 1;
                y -= h;
                const gap = j > 0 ? 2 : 0; // khe 2px giữa các phần
                return top ? (
                  <path key={p.key} d={topRounded(cx - bw / 2, y, bw, h - gap, 4)} fill={p.color} />
                ) : (
                  <rect key={p.key} x={cx - bw / 2} y={y} width={bw} height={Math.max(0, h - gap)} fill={p.color} />
                );
              })}
              {(i % every === 0 || i === data.length - 1) && (
                <text
                  x={i === data.length - 1 ? Math.min(cx + bw / 2, W) : cx}
                  y={H - 6}
                  textAnchor={i === data.length - 1 ? 'end' : 'middle'}
                  fontSize="11"
                  fill={d.highlight ? C.ink : C.axis}
                  fontWeight={d.highlight ? 800 : 600}
                >
                  {d.label}
                </text>
              )}
              <rect
                x={padL + band * i}
                y={0}
                width={band}
                height={H}
                fill="transparent"
                tabIndex={0}
                aria-label={`${d.full}: ${d.parts.map((p) => `${p.key} ${p.value}`).join(', ')}`}
                onMouseEnter={show}
                onFocus={show}
                onMouseLeave={() => setTip(null)}
                onBlur={() => setTip(null)}
                className="cursor-pointer outline-none hover:fill-ink/[0.03] focus:fill-ink/[0.05]"
              />
            </g>
          );
        })}
      </svg>
      {node}
    </div>
  );
}

/* ---------------- Cột đơn (vd: theo giờ) ---------------- */

export function Columns({
  data,
  color = C.right,
  height = 150,
  format = (v) => String(v),
  every = 1,
}: {
  data: { label: string; full: string; value: number; highlight?: boolean }[];
  color?: string;
  height?: number;
  format?: (v: number) => string;
  every?: number;
}) {
  const { setTip, node } = useTip();
  const [box, W] = useWidth();
  const padB = 22;
  const H = height;
  const plotH = H - padB - 18;
  const max = Math.max(1, ...data.map((d) => d.value));
  const band = W / data.length;
  const bw = Math.min(24, band - 2);

  return (
    <div ref={box} className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Biểu đồ cột">
        <line x1={0} x2={W} y1={18 + plotH} y2={18 + plotH} stroke={C.grid} strokeWidth={1} />
        {data.map((d, i) => {
          const cx = band * i + band / 2;
          const h = (d.value / max) * plotH;
          const show = () =>
            setTip({ x: (cx / W) * 100, y: ((18 + plotH - h) / H) * 100, content: `${d.full}: ${format(d.value)}` });
          return (
            <g key={i}>
              <path d={topRounded(cx - bw / 2, 18 + plotH - h, bw, h, 4)} fill={color} fillOpacity={d.highlight ? 1 : 0.4} />
              {d.highlight && d.value > 0 && (
                <text x={cx} y={18 + plotH - h - 5} textAnchor="middle" fontSize="11" fontWeight={800} fill={C.ink}>
                  {format(d.value)}
                </text>
              )}
              {i % every === 0 && (
                <text x={cx} y={H - 5} textAnchor="middle" fontSize="11" fill={C.axis} fontWeight={600}>
                  {d.label}
                </text>
              )}
              <rect
                x={band * i}
                y={0}
                width={band}
                height={H}
                fill="transparent"
                tabIndex={0}
                aria-label={`${d.full}: ${format(d.value)}`}
                onMouseEnter={show}
                onFocus={show}
                onMouseLeave={() => setTip(null)}
                onBlur={() => setTip(null)}
                className="cursor-pointer outline-none"
              />
            </g>
          );
        })}
      </svg>
      {node}
    </div>
  );
}

/* ---------------- Đường xu hướng (tỉ lệ đúng %) ---------------- */

export function LineChart({
  data,
  color = C.right,
  height = 180,
  suffix = '%',
  maxY = 100,
}: {
  data: { label: string; full: string; value: number | null }[];
  color?: string;
  height?: number;
  suffix?: string;
  maxY?: number;
}) {
  const { setTip, node } = useTip();
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [box, W] = useWidth();
  const padL = 34;
  const padR = 34;
  const padB = 24;
  const H = height;
  const plotH = H - padB - 12;
  const step = (W - padL - padR) / Math.max(1, data.length - 1);
  const xOf = (i: number) => padL + step * i;
  const yOf = (v: number) => 12 + plotH - (v / maxY) * plotH;

  // Nối các ngày có học thành 1 đường liền (ngày không học được bỏ qua).
  const pts = data.flatMap((d, i) => (d.value == null ? [] : [{ i, v: d.value }]));
  const segments = pts.length ? [pts] : [];
  const points = segments.flat();
  const last = points[points.length - 1];

  const pick = (i: number) => {
    setHover(i);
    const d = data[i];
    setTip({
      x: (xOf(i) / W) * 100,
      y: ((d.value == null ? 12 + plotH / 2 : yOf(d.value)) / H) * 100,
      content: d.value == null ? `${d.full}: chưa học` : `${d.full}: ${Math.round(d.value)}${suffix}`,
    });
  };

  return (
    <div ref={box} className="relative">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="Biểu đồ đường"
        onMouseMove={(e) => {
          const r = ref.current!.getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * W;
          pick(Math.min(data.length - 1, Math.max(0, Math.round((x - padL) / step))));
        }}
        onMouseLeave={() => {
          setHover(null);
          setTip(null);
        }}
      >
        {[0, 50, 100].map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={yOf((t / 100) * maxY)} y2={yOf((t / 100) * maxY)} stroke={C.grid} strokeWidth={1} />
            <text x={padL - 6} y={yOf((t / 100) * maxY) + 4} textAnchor="end" fontSize="11" fill={C.axis}>
              {Math.round((t / 100) * maxY)}
              {suffix}
            </text>
          </g>
        ))}
        {segments.map((seg, k) => (
          <g key={k}>
            {seg.length > 1 && (
              <path
                d={`M${xOf(seg[0].i)},${yOf(0)} ${seg.map((p) => `L${xOf(p.i)},${yOf(p.v)}`).join(' ')} L${xOf(seg[seg.length - 1].i)},${yOf(0)} Z`}
                fill={color}
                opacity={0.1}
              />
            )}
            <path
              d={seg.map((p, j) => `${j ? 'L' : 'M'}${xOf(p.i)},${yOf(p.v)}`).join(' ')}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {seg.length === 1 && <circle cx={xOf(seg[0].i)} cy={yOf(seg[0].v)} r={4} fill={color} stroke={C.surface} strokeWidth={2} />}
          </g>
        ))}
        {hover != null && <line x1={xOf(hover)} x2={xOf(hover)} y1={12} y2={12 + plotH} stroke={C.axis} strokeWidth={1} />}
        {hover != null && data[hover].value != null && (
          <circle cx={xOf(hover)} cy={yOf(data[hover].value!)} r={5} fill={color} stroke={C.surface} strokeWidth={2} />
        )}
        {last && (
          <>
            <circle cx={xOf(last.i)} cy={yOf(last.v)} r={5} fill={color} stroke={C.surface} strokeWidth={2} />
            <text x={xOf(last.i) + 8} y={yOf(last.v) + 4} fontSize="12" fontWeight={800} fill={C.ink}>
              {Math.round(last.v)}
              {suffix}
            </text>
          </>
        )}
        {data.map((d, i) =>
          i % Math.ceil(data.length / 7) === 0 || i === data.length - 1 ? (
            <text key={i} x={xOf(i)} y={H - 5} textAnchor="middle" fontSize="11" fill={C.axis} fontWeight={600}>
              {d.label}
            </text>
          ) : null,
        )}
      </svg>
      {node}
    </div>
  );
}

/* ---------------- Bản đồ nhiệt kiểu lịch ---------------- */

export function Heatmap({
  weeks,
  levels,
}: {
  weeks: { key: string; label: string; value: number; future?: boolean }[][]; // cột = tuần, hàng = T2..CN
  levels: number[]; // ngưỡng cho 4 mức màu
}) {
  const { setTip, node } = useTip();
  const cell = 13;
  const gap = 3;
  const padL = 22;
  const padT = 16;
  const W = padL + weeks.length * (cell + gap);
  const H = padT + 7 * (cell + gap);
  const colorOf = (v: number) => {
    if (v <= 0) return C.seq[0];
    const idx = levels.findIndex((l) => v <= l);
    return C.seq[idx === -1 ? 4 : idx + 1];
  };
  const rows = ['T2', '', 'T4', '', 'T6', '', 'CN'];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto h-auto w-full" style={{ maxWidth: W * 1.9 }} role="img" aria-label="Lịch hoạt động">
        {rows.map((r, i) =>
          r ? (
            <text key={i} x={0} y={padT + i * (cell + gap) + cell - 2} fontSize="9" fill={C.axis} fontWeight={700}>
              {r}
            </text>
          ) : null,
        )}
        {weeks.map((w, wi) => {
          const first = w[0];
          const showMonth = first && parseInt(first.key.slice(8), 10) <= 7;
          return (
            <g key={wi}>
              {showMonth && (
                <text x={padL + wi * (cell + gap)} y={10} fontSize="9" fill={C.axis} fontWeight={700}>
                  Th{parseInt(first.key.slice(5, 7), 10)}
                </text>
              )}
              {w.map((d, di) => {
                if (d.future) return null;
                const x = padL + wi * (cell + gap);
                const y = padT + di * (cell + gap);
                const show = () =>
                  setTip({
                    x: ((x + cell / 2) / W) * 100,
                    y: (y / H) * 100,
                    content: `${d.label}: ${d.value ? `${d.value} câu` : 'chưa học'}`,
                  });
                return (
                  <rect
                    key={d.key}
                    x={x}
                    y={y}
                    width={cell}
                    height={cell}
                    rx={3}
                    fill={colorOf(d.value)}
                    tabIndex={0}
                    aria-label={`${d.label}: ${d.value} câu`}
                    onMouseEnter={show}
                    onFocus={show}
                    onMouseLeave={() => setTip(null)}
                    onBlur={() => setTip(null)}
                    className="cursor-pointer outline-none hover:stroke-ink/40 focus:stroke-ink/60"
                    strokeWidth={1.5}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
      <div className="mx-auto mt-2 flex items-center justify-end gap-1 text-[11px] font-bold text-ink/45" style={{ maxWidth: W * 1.9 }}>
        Ít
        {C.seq.map((c) => (
          <span key={c} className="h-3 w-3 rounded-[3px]" style={{ background: c }} />
        ))}
        Nhiều
      </div>
      {node}
    </div>
  );
}

/* ---------------- Donut (tỉ lệ thành phần) ---------------- */

export function Donut({
  parts,
  size = 170,
  center,
}: {
  parts: { label: string; value: number; color: string }[];
  size?: number;
  center: ReactNode;
}) {
  const [active, setActive] = useState<number | null>(null);
  const total = parts.reduce((s, p) => s + p.value, 0);
  const r = 60;
  const sw = 20;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg viewBox="0 0 160 160" width={size} height={size} role="img" aria-label="Biểu đồ tròn">
        <circle cx={80} cy={80} r={r} fill="none" stroke={C.neutral} strokeWidth={sw} />
        {total > 0 &&
          parts.map((p, i) => {
            const len = (p.value / total) * circ;
            const seg = (
              <circle
                key={p.label}
                cx={80}
                cy={80}
                r={r}
                fill="none"
                stroke={p.color}
                strokeWidth={active === i ? sw + 4 : sw}
                strokeDasharray={`${Math.max(0, len - (parts.filter((x) => x.value > 0).length > 1 ? 2 : 0))} ${circ}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 80 80)"
                tabIndex={0}
                aria-label={`${p.label}: ${p.value}`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="cursor-pointer outline-none transition-all"
              />
            );
            offset += len;
            return p.value > 0 ? seg : null;
          })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        {active != null ? (
          <>
            <span className="text-2xl font-black">{parts[active].value}</span>
            <span className="text-xs font-bold text-ink/55">{parts[active].label}</span>
          </>
        ) : (
          center
        )}
      </div>
    </div>
  );
}

/* ---------------- Vòng tiến độ (mục tiêu ngày) ---------------- */

export function Ring({
  value,
  max,
  size = 120,
  color = C.right,
  track = 'rgb(var(--lilac-100))',
  children,
}: {
  value: number;
  max: number;
  size?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const r = 48;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, max ? value / max : 0);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
        <circle cx={60} cy={60} r={r} fill="none" stroke={track} strokeWidth={12} />
        <circle
          cx={60}
          cy={60}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${pct * circ} ${circ}`}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dasharray .8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

/* ---------------- Thanh chồng ngang (độ thuộc bài theo thư mục) ---------------- */

export function StackBar({ parts, height = 12 }: { parts: { label: string; value: number; color: string }[]; height?: number }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  const [tip, setTip] = useState<string | null>(null);
  return (
    <div className="relative">
      <div className="flex w-full gap-[2px] overflow-hidden rounded-full" style={{ height }}>
        {parts
          .filter((p) => p.value > 0)
          .map((p) => (
            <div
              key={p.label}
              tabIndex={0}
              className="h-full cursor-pointer outline-none transition-[flex-grow] duration-700"
              style={{ flexGrow: p.value / total, background: p.color }}
              onMouseEnter={() => setTip(`${p.label}: ${p.value}`)}
              onMouseLeave={() => setTip(null)}
              onFocus={() => setTip(`${p.label}: ${p.value}`)}
              onBlur={() => setTip(null)}
              aria-label={`${p.label}: ${p.value}`}
            />
          ))}
      </div>
      {tip && (
        <div className="pointer-events-none absolute right-0 top-full z-10 mt-1 rounded-lg bg-ink px-2 py-1 text-xs font-bold text-cream">
          {tip}
        </div>
      )}
    </div>
  );
}

/* ---------------- Sparkline nhỏ trong thẻ số ---------------- */

export function Sparkline({ values, color = C.right, width = 90, height = 28 }: { values: number[]; color?: string; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => `${i * step},${height - 3 - (v / max) * (height - 6)}`);
  const last = pts[pts.length - 1].split(',').map(Number);
  return (
    <svg width={width} height={height} aria-hidden="true" className="overflow-visible">
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeOpacity={0.55} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={3.5} fill={color} stroke={C.surface} strokeWidth={2} />
    </svg>
  );
}
