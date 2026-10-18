import { useEffect, useState, type ReactNode } from 'react';
import {
  collection,
  collectionGroup,
  limit,
  query,
  type DocumentData,
  type Query,
} from 'firebase/firestore';
import { getCountFromServer, getDocs } from '../lib/fs'; // có đếm quota ước tính
import { db } from '../lib/firebase';
import { doc } from 'firebase/firestore';
import { onSnapshot } from '../lib/fs';
import { quotaDayKey } from '../lib/quotaMeter';
import { useAuth } from '../lib/auth';
import { useSite } from '../lib/site';
import { saveConfig } from '../lib/admin';
import Switch from '../components/Switch';
import { useToast } from '../components/Toast';
import { ChartCard } from '../components/charts';
import { IconChart, IconFolder, IconGlobe, IconList, IconRefresh, IconShield, IconUsers } from '../icons';

/*
 * Tài nguyên & hạn mức của gói miễn phí (Spark).
 * Số lượt đọc / ghi thật trong ngày chỉ đọc được qua Cloud Monitoring – Google yêu cầu bật thanh toán,
 * nên ở gói miễn phí trang này chỉ hiện: hạn mức gói Spark, số tài liệu thật, dung lượng ƯỚC TÍNH và link tới Firebase Console.
 */

const PROJECT = 'trac-nghiem-4804e';
const CONSOLE = `https://console.firebase.google.com/project/${PROJECT}`;
const GiB = 1024 ** 3;

/** Hạn mức gói Spark (theo bảng giá Firebase). */
const SPARK = [
  { group: 'Cloud Firestore', items: [
    ['Lượt đọc tài liệu', '50.000 / ngày'],
    ['Lượt ghi tài liệu', '20.000 / ngày'],
    ['Lượt xóa tài liệu', '20.000 / ngày'],
    ['Dữ liệu lưu trữ (kể cả index)', '1 GiB'],
    ['Băng thông ra ngoài', '10 GiB / tháng'],
  ] },
  { group: 'Hosting', items: [
    ['Dung lượng lưu trữ', '10 GB'],
    ['Băng thông tải về', '360 MB / ngày'],
  ] },
  { group: 'Authentication', items: [
    ['Người dùng hoạt động (Google, ẩn danh)', '50.000 / tháng'],
  ] },
  { group: 'Khác', items: [
    ['Google Analytics', 'Miễn phí, không giới hạn sự kiện'],
    ['Cloud Functions / thông báo đẩy', 'Không có ở gói Spark'],
  ] },
] as const;

const LINKS = [
  { label: 'Usage Firestore (đọc / ghi / xóa thật)', href: `${CONSOLE}/firestore/databases/-default-/usage`, Icon: IconChart },
  { label: 'Usage & billing của project', href: `${CONSOLE}/usage`, Icon: IconList },
  { label: 'Hosting (băng thông, dung lượng)', href: `${CONSOLE}/hosting/sites/${PROJECT}`, Icon: IconGlobe },
  { label: 'Authentication – người dùng', href: `${CONSOLE}/authentication/users`, Icon: IconUsers },
  { label: 'Luật bảo mật Firestore', href: `${CONSOLE}/firestore/databases/-default-/rules`, Icon: IconShield },
];

/** Nhóm dữ liệu cần đếm. */
const GROUPS: { key: string; label: string; q: () => Query<DocumentData> }[] = [
  { key: 'users', label: 'Người dùng (hồ sơ)', q: () => collection(db, 'users') },
  { key: 'folders', label: 'Thư mục', q: () => collection(db, 'folders') },
  { key: 'questions', label: 'Câu hỏi', q: () => collectionGroup(db, 'questions') },
  { key: 'days', label: 'Thống kê theo ngày', q: () => collectionGroup(db, 'days') },
  { key: 'sessions', label: 'Lượt học / kiểm tra', q: () => collectionGroup(db, 'sessions') },
  { key: 'announcements', label: 'Thông báo', q: () => collection(db, 'announcements') },
  { key: 'adminLogs', label: 'Nhật ký quản trị', q: () => collection(db, 'adminLogs') },
  { key: 'usage', label: 'Bộ đếm hạn mức', q: () => collection(db, 'usage') },
];

/* ---------------- Giờ làm mới hạn mức ngày (nửa đêm giờ Thái Bình Dương) ---------------- */

function nextPacificMidnight(now = new Date()) {
  // Giờ hiện tại theo America/Los_Angeles → số phút còn lại tới 00:00 hôm sau.
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const secs = (Number(parts.hour) % 24) * 3600 + Number(parts.minute) * 60 + Number(parts.second);
  const left = 86400 - secs;
  return { at: new Date(now.getTime() + left * 1000), left };
}

function ResetClock() {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const { at, left } = nextPacificMidnight();
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-lilac-100/60 p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-lilac-500">
        <IconRefresh size={22} />
      </span>
      <div>
        <div className="font-black">
          Hạn mức ngày làm mới sau {h} giờ {m} phút
        </div>
        <div className="text-sm text-ink/55">
          Lúc {at.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày {at.toLocaleDateString('vi-VN')} (giờ Việt Nam) – tức 0h giờ Thái
          Bình Dương (Mỹ).
        </div>
      </div>
    </div>
  );
}

/* ---------------- Ước tính dung lượng (theo cách Firestore tính kích thước tài liệu) ---------------- */

const utf8 = (s: string) => new TextEncoder().encode(s).length;

function valueBytes(v: unknown): number {
  if (v === null || v === undefined) return 1;
  if (typeof v === 'boolean') return 1;
  if (typeof v === 'number') return 8;
  if (typeof v === 'string') return utf8(v) + 1;
  if (v instanceof Date) return 8;
  if (typeof v === 'object' && 'toMillis' in (v as object)) return 8; // Timestamp
  if (Array.isArray(v)) return v.reduce((s, x) => s + valueBytes(x), 0);
  if (typeof v === 'object') return Object.entries(v as object).reduce((s, [k, x]) => s + utf8(k) + 1 + valueBytes(x), 0);
  return 8;
}

const docBytes = (path: string, data: DocumentData) => utf8(path) + 16 + valueBytes(data) + 32;

const fmtBytes = (b: number) =>
  b < 1024 ? `${b} B` : b < 1024 ** 2 ? `${(b / 1024).toFixed(1)} KB` : b < GiB ? `${(b / 1024 ** 2).toFixed(2)} MB` : `${(b / GiB).toFixed(2)} GB`;

/* ---------------- Ước tính lượt đọc / ghi / xóa hôm nay ---------------- */

function UsageToday() {
  const { user } = useAuth();
  const { config } = useSite();
  const toast = useToast();
  const [today, setToday] = useState<{ reads: number; writes: number; deletes: number; at?: Date } | null>(null);
  const day = quotaDayKey();

  useEffect(
    () =>
      onSnapshot(
        doc(db, 'quotaStats', day),
        (s) => {
          const d = s.data() ?? {};
          setToday({ reads: d.reads ?? 0, writes: d.writes ?? 0, deletes: d.deletes ?? 0, at: d.updatedAt?.toDate?.() });
        },
        (e) => console.error(e),
      ),
    [day],
  );

  const rows = [
    { label: 'Đọc', value: today?.reads ?? 0, max: 50000 },
    { label: 'Ghi', value: today?.writes ?? 0, max: 20000 },
    { label: 'Xóa', value: today?.deletes ?? 0, max: 20000 },
  ];

  return (
    <ChartCard
      title="Lượt đọc / ghi / xóa hôm nay (ước tính)"
      subtitle={`Ngày quota ${day} (giờ Mỹ)${today?.at ? ` · cập nhật ${today.at.toLocaleTimeString('vi-VN')}` : ''}`}
      icon={<IconChart size={18} className="text-lilac-500" />}
      table={{ head: ['Loại', 'Ước tính', 'Hạn mức / ngày'], rows: rows.map((r) => [r.label, r.value, r.max]) }}
    >
      <div className="flex flex-col gap-3">
        {rows.map((r) => {
          const pct = Math.min(100, (r.value / r.max) * 100);
          const tone = pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-peach-500' : 'bg-lilac-500';
          return (
            <div key={r.label}>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="font-extrabold">{r.label}</span>
                <span className="tabular-nums">
                  <b>{r.value.toLocaleString('vi-VN')}</b>
                  <span className="text-ink/45"> / {r.max.toLocaleString('vi-VN')} · {pct < 0.1 && r.value > 0 ? '< 0,1' : pct.toFixed(1)}%</span>
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-lilac-100">
                <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(pct, r.value ? 0.6 : 0)}%` }} />
              </div>
            </div>
          );
        })}
        <p className="text-xs text-ink/50">
          Số do các trình duyệt tự đếm và gửi về – <b>luôn thấp hơn số thật</b> (không tính lượt đọc của luật bảo mật, Firebase Console, khách chưa
          đăng nhập…). Số chính xác xem ở Firebase Console.
        </p>
        <div className="flex items-center gap-3 rounded-2xl bg-ink/[0.03] p-3">
          <Switch
            on={config.quotaTracking}
            label="Đếm ước tính"
            onChange={(v) =>
              user &&
              saveConfig(user, { ...config, quotaTracking: v }).then(
                () => toast(v ? 'Đã bật đếm ước tính' : 'Đã tắt đếm ước tính – không tốn thêm lượt ghi'),
                () => toast('Không lưu được', 'error'),
              )
            }
          />
          <div>
            <div className="text-sm font-extrabold">Đếm ước tính lượt đọc / ghi / xóa</div>
            <div className="text-xs text-ink/50">
              Mỗi người dùng tốn khoảng 1 lượt ghi / 10 phút để gửi số. Tắt khi web đông để dành quota cho người dùng thật.
            </div>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}

/* ---------------- Trang ---------------- */

export default function AdminResources() {
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [countedAt, setCountedAt] = useState<Date | null>(null);
  const [sizes, setSizes] = useState<Record<string, number> | null>(null);
  const [estimating, setEstimating] = useState(false);

  const recount = () => {
    setCounts({});
    Promise.all(
      GROUPS.map(async (g) => {
        try {
          return [g.key, (await getCountFromServer(g.q())).data().count] as const;
        } catch (e) {
          console.error(g.key, e);
          return [g.key, null] as const;
        }
      }),
    ).then((rows) => {
      setCounts(Object.fromEntries(rows));
      setCountedAt(new Date());
    });
  };
  useEffect(recount, []);

  // Lấy tối đa 25 tài liệu mỗi nhóm để tính kích thước trung bình, nhân với số tài liệu.
  const estimate = async () => {
    setEstimating(true);
    try {
      const out: Record<string, number> = {};
      for (const g of GROUPS) {
        const n = counts[g.key];
        if (!n) {
          out[g.key] = 0;
          continue;
        }
        const snap = await getDocs(query(g.q(), limit(25)));
        const avg = snap.docs.reduce((s, d) => s + docBytes(d.ref.path, d.data()), 0) / Math.max(1, snap.size);
        out[g.key] = avg * n;
      }
      setSizes(out);
    } finally {
      setEstimating(false);
    }
  };

  const total = Object.values(counts).reduce<number>((s, n) => s + (n ?? 0), 0);
  const raw = sizes ? Object.values(sizes).reduce((s, b) => s + b, 0) : 0;
  const withIndexes = raw * 2.5; // index mặc định của Firestore thường chiếm thêm ~1,5 lần dữ liệu
  const pct = Math.min(100, (withIndexes / GiB) * 100);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border-2 border-dashed border-sky-300/70 bg-sky-100/50 px-4 py-3 text-sm text-ink/70">
        <b className="text-ink">Gói miễn phí (Spark):</b> Google chỉ cho xem số lượt đọc / ghi / xóa thật trong ngày tại Firebase Console (nút bên dưới). Trang
        này hiện những gì lấy được miễn phí: hạn mức của gói, số tài liệu thật và dung lượng <b>ước tính</b>.
      </div>

      <ResetClock />

      <UsageToday />

      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Dữ liệu trong database"
          subtitle={countedAt ? `Đếm lúc ${countedAt.toLocaleTimeString('vi-VN')} · tổng ${total.toLocaleString('vi-VN')} tài liệu` : 'Đang đếm…'}
          icon={<IconFolder size={18} className="text-peach-500" />}
          table={{
            head: ['Nhóm dữ liệu', 'Số tài liệu', 'Dung lượng ước tính'],
            rows: GROUPS.map((g) => [g.label, counts[g.key] ?? '—', sizes ? fmtBytes(sizes[g.key] ?? 0) : '—']),
          }}
        >
          <ul className="flex flex-col divide-y divide-ink/5">
            {GROUPS.map((g) => (
              <li key={g.key} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="font-semibold text-ink/70">{g.label}</span>
                <span className="flex items-center gap-3 tabular-nums">
                  {sizes && <span className="text-xs font-semibold text-ink/40">{fmtBytes(sizes[g.key] ?? 0)}</span>}
                  <b>{counts[g.key] == null ? (countedAt ? '?' : '…') : counts[g.key]!.toLocaleString('vi-VN')}</b>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-soft px-3 py-1.5 text-sm" onClick={recount}>
              <IconRefresh size={16} /> Đếm lại
            </button>
            <button className="btn-soft px-3 py-1.5 text-sm" disabled={estimating || !countedAt} onClick={estimate}>
              <IconChart size={16} /> {estimating ? 'Đang ước tính…' : 'Ước tính dung lượng'}
            </button>
          </div>
          <p className="mt-2 text-xs text-ink/45">Mỗi lần đếm tốn khoảng 1 lượt đọc / 1.000 tài liệu; ước tính dung lượng đọc thêm tối đa 25 tài liệu mỗi nhóm.</p>
        </ChartCard>

        <ChartCard title="Dung lượng Firestore so với hạn mức 1 GiB" icon={<IconChart size={18} className="text-lilac-500" />}>
          {sizes ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black">{fmtBytes(withIndexes)}</span>
                <span className="text-sm font-bold text-ink/50">/ 1 GiB · {pct < 0.01 ? '< 0,01' : pct.toFixed(2)}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-lilac-100">
                <div className="h-full rounded-full bg-lilac-500" style={{ width: `${Math.max(pct, 0.5)}%` }} />
              </div>
              <p className="text-xs text-ink/50">
                Ước tính: dữ liệu {fmtBytes(raw)} + index tự động của Firestore (~1,5 lần). Con số chính xác chỉ có trong Firebase Console.
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink/55">Bấm “Ước tính dung lượng” để tính.</p>
          )}
        </ChartCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <ChartCard title="Hạn mức gói miễn phí (Spark)" subtitle="Vượt hạn mức ngày thì tính năng tạm dừng tới khi làm mới – không bị tính tiền">
          <div className="flex flex-col gap-3">
            {SPARK.map((g) => (
              <div key={g.group}>
                <div className="mb-1 text-xs font-extrabold uppercase tracking-wide text-ink/45">{g.group}</div>
                <ul className="divide-y divide-ink/5 rounded-xl border border-ink/5">
                  {g.items.map(([k, v]) => (
                    <li key={k} className="flex items-center justify-between gap-3 px-3 py-1.5 text-sm">
                      <span className="text-ink/70">{k}</span>
                      <b className="text-right">{v}</b>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Xem số liệu chính xác trên Firebase Console" subtitle="Mở trong tab mới (cần đăng nhập tài khoản chủ project)">
          <ul className="flex flex-col gap-1.5">
            {LINKS.map((l) => (
              <li key={l.href}>
                <LinkRow {...l} />
              </li>
            ))}
          </ul>
        </ChartCard>
      </section>
    </div>
  );
}

function LinkRow({ label, href, Icon }: { label: string; href: string; Icon: typeof IconChart }): ReactNode {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-bold text-ink/75 transition hover:bg-lilac-100/50 hover:text-ink"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-ink/60">
        <Icon size={16} />
      </span>
      <span className="flex-1">{label}</span>
      <span className="text-ink/35">↗</span>
    </a>
  );
}
