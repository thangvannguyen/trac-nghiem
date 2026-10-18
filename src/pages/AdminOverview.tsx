import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Timestamp } from 'firebase/firestore';
import {
  countAll,
  useAdmins,
  useAllDays,
  useAllFolders,
  useAllSessions,
  useAllUsers,
  useBans,
  type DayRow,
  type SessionRow,
  type UserRow,
} from '../lib/admin';
import { useAllNotices } from '../lib/notices';
import { countPushDevices, pushConfigured } from '../lib/push';
import { effective, useAllLimits, useAllUsage } from '../lib/quota';
import { useSite } from '../lib/site';
import { addDays, dayKey } from '../lib/stats';
import { timeAgo } from '../lib/time';
import type { Folder } from '../lib/types';
import { C, ChartCard, Columns, Donut, LineChart, Sparkline, StackedColumns } from '../components/charts';
import { Avatar } from '../components/Navbar';
import {
  IconBan,
  IconBell,
  IconChart,
  IconDown,
  IconFolder,
  IconList,
  IconMegaphone,
  IconRefresh,
  IconSettings,
  IconShield,
  IconSparkle,
  IconUp,
  IconUser,
  IconUsers,
  Owl,
  PALETTE,
  TopicIcon,
} from '../icons';

/*
 * Bảng điều khiển tổng quan cho admin. Một bộ lọc thời gian (7 / 30 / 90 ngày) áp dụng cho mọi số liệu;
 * mỗi chỉ số so sánh với khoảng thời gian liền trước có cùng độ dài.
 */

type Range = 7 | 30 | 90;
const RANGES: Range[] = [7, 30, 90];
const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MODE_LABEL = { learn: 'Học', test: 'Kiểm tra', review: 'Ôn tập' } as const;

const toDate = (t?: Timestamp | Date | null) => (!t ? null : t instanceof Date ? t : t.toDate());
const nf = (n: number) => n.toLocaleString('vi-VN');
const compact = (n: number) => (n >= 10000 ? `${(n / 1000).toFixed(1).replace('.0', '')}K` : nf(n));
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const fmtDur = (sec: number) => (sec < 60 ? `${Math.round(sec)} giây` : `${Math.round(sec / 60)} phút`);
const niceMax = (v: number) => {
  if (v <= 5) return 5;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
};

export default function AdminOverview() {
  const users = useAllUsers(true);
  const folders = useAllFolders(true);
  const days = useAllDays(true, 180);
  const sessions = useAllSessions(true, 180);
  const admins = useAdmins(true);
  const bans = useBans(true);
  const notices = useAllNotices();
  const limits = useAllLimits(true);
  const usage = useAllUsage(true);
  const { config } = useSite();
  const [counts, setCounts] = useState<Awaited<ReturnType<typeof countAll>> | null>(null);
  const [devices, setDevices] = useState<number | null>(null);
  const [refreshedAt, setRefreshedAt] = useState(Date.now());

  useEffect(() => {
    countAll().then(setCounts, console.error);
    if (pushConfigured()) countPushDevices().then(setDevices, () => setDevices(null));
  }, [refreshedAt]);

  const nearQuota = users.data.filter((u) => {
    if (!u.email) return false;
    const us = usage.get(u.uid);
    const l = limits.get(u.uid);
    const mf = effective(l?.maxFolders, config.defaultMaxFolders);
    const mq = effective(l?.maxQuestions, config.defaultMaxQuestions);
    return (mf > 0 && (us?.folders ?? 0) >= mf * 0.8) || (mq > 0 && (us?.questions ?? 0) >= mq * 0.8);
  }).length;

  return (
    <OverviewView
      loading={users.loading || days.loading || folders.loading}
      users={users.data}
      folders={folders.data}
      days={days.data}
      sessions={sessions.data}
      counts={counts}
      health={{
        readOnly: config.readOnly,
        activeNotices: notices.data.filter((n) => n.active).length,
        devices,
        admins: admins.data.length + 1,
        bans: bans.data.length,
        nearQuota,
      }}
      onRefresh={() => setRefreshedAt(Date.now())}
    />
  );
}

export interface OverviewProps {
  loading: boolean;
  users: UserRow[];
  folders: Folder[];
  days: DayRow[];
  sessions: SessionRow[];
  counts: { users: number; folders: number; questions: number; publicFolders: number } | null;
  health: { readOnly: boolean; activeNotices: number; devices: number | null; admins: number; bans: number; nearQuota: number };
  onRefresh: () => void;
}

export function OverviewView({ loading, users, folders, days, sessions, counts, health, onRefresh }: OverviewProps) {
  const [range, setRange] = useState<Range>(30);
  const m = useMemo(() => compute(range, users, folders, days, sessions), [range, users, folders, days, sessions]);

  const every = range === 7 ? 1 : range === 30 ? 5 : 15;
  const label = (d: Date, i: number, n: number) => (i === n - 1 ? 'Nay' : range === 7 ? WEEKDAY[d.getDay()] : `${d.getDate()}/${d.getMonth() + 1}`);
  const full = (d: Date) => `${WEEKDAY[d.getDay()]} ${d.toLocaleDateString('vi-VN')}`;

  return (
    <div className="flex flex-col gap-4">
      {/* ---------- Bộ lọc ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink/55">
          So sánh với {range} ngày liền trước · cập nhật realtime
        </p>
        <div className="flex items-center gap-2">
          <div className="flex rounded-2xl bg-surface p-1 shadow-soft" role="group" aria-label="Khoảng thời gian">
            {RANGES.map((r) => (
              <button
                key={r}
                aria-pressed={range === r}
                onClick={() => setRange(r)}
                className={`rounded-xl px-3 py-1.5 text-sm font-extrabold transition ${range === r ? 'bg-ink text-cream' : 'text-ink/55 hover:text-ink'}`}
              >
                {r} ngày
              </button>
            ))}
          </div>
          <button className="btn-ghost p-2" title="Làm mới số đếm" onClick={onRefresh}>
            <IconRefresh size={18} />
          </button>
        </div>
      </div>

      {/* ---------- Chỉ số chính ---------- */}
      <section className={`grid grid-cols-2 gap-3 lg:grid-cols-4 ${loading ? 'opacity-60' : ''}`}>
        <Kpi
          label="Người học hoạt động"
          value={compact(m.cur.activeUsers)}
          delta={delta(m.cur.activeUsers, m.prev.activeUsers)}
          sub={`TB ${m.cur.dau.toFixed(1)} người/ngày`}
          spark={m.series.map((r) => r.active)}
          Icon={IconUsers}
        />
        <Kpi
          label="Câu trả lời"
          value={compact(m.cur.answers)}
          delta={delta(m.cur.answers, m.prev.answers)}
          sub={`TB ${compact(Math.round(m.cur.answers / range))} câu/ngày`}
          spark={m.series.map((r) => r.answered)}
          Icon={IconList}
        />
        <Kpi
          label="Tỉ lệ đúng"
          value={`${m.cur.accuracy}%`}
          delta={m.prev.answers ? { value: m.cur.accuracy - m.prev.accuracy, unit: 'điểm' } : null}
          sub={`${compact(m.cur.correct)} câu đúng`}
          Icon={IconChart}
        />
        <Kpi
          label="Tài khoản mới"
          value={compact(m.cur.newAccounts)}
          delta={delta(m.cur.newAccounts, m.prev.newAccounts)}
          sub={`Tổng ${compact(m.totals.accounts)} tài khoản · ${compact(m.totals.guests)} khách`}
          spark={m.series.map((r) => r.newAccounts)}
          Icon={IconUser}
        />
        <Kpi
          label="Lượt làm bài"
          value={compact(m.cur.sessions)}
          delta={delta(m.cur.sessions, m.prev.sessions)}
          sub={m.cur.sessions ? `Điểm TB ${m.cur.avgScore}% · ${fmtDur(m.cur.avgDuration)}/lượt` : 'Chưa có lượt nào'}
          Icon={IconSparkle}
        />
        <Kpi
          label="Tỉ lệ quay lại"
          value={m.prev.activeUsers ? `${m.retention}%` : '—'}
          sub={`Người học kỳ trước còn học kỳ này`}
          Icon={IconRefresh}
        />
        <Kpi
          label="Thư mục"
          value={compact(counts?.folders ?? m.totals.folders)}
          delta={delta(m.cur.newFolders, m.prev.newFolders, 'mới')}
          sub={`${compact(counts?.publicFolders ?? m.totals.publicFolders)} công khai · +${m.cur.newFolders} trong kỳ`}
          Icon={IconFolder}
        />
        <Kpi
          label="Câu hỏi"
          value={counts ? compact(counts.questions) : '…'}
          sub={`TB ${m.totals.folders ? Math.round((counts?.questions ?? m.totals.questions) / m.totals.folders) : 0} câu/thư mục`}
          Icon={IconList}
        />
      </section>

      {/* ---------- Hoạt động theo ngày ---------- */}
      <ChartCard
        title="Hoạt động học theo ngày"
        subtitle={`Số câu trả lời toàn hệ thống trong ${range} ngày, tách đúng / sai`}
        legend={[
          { color: C.right, label: 'Đúng' },
          { color: C.wrong, label: 'Sai' },
        ]}
        table={{
          head: ['Ngày', 'Đúng', 'Sai', 'Tổng', 'Người học'],
          rows: m.series.map((r) => [r.key, r.correct, r.answered - r.correct, r.answered, r.active]),
        }}
      >
        <StackedColumns
          height={220}
          every={every}
          data={m.series.map((r, i) => ({
            label: label(r.date, i, m.series.length),
            full: full(r.date),
            highlight: i === m.series.length - 1,
            parts: [
              { key: 'Đúng', value: r.correct, color: C.right },
              { key: 'Sai', value: r.answered - r.correct, color: C.wrong },
            ],
          }))}
        />
      </ChartCard>

      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Người học mỗi ngày"
          subtitle="Số tài khoản (kể cả khách) có làm bài trong ngày"
          table={{ head: ['Ngày', 'Người học'], rows: m.series.map((r) => [r.key, r.active]) }}
        >
          <LineChart
            suffix=""
            maxY={niceMax(Math.max(1, ...m.series.map((r) => r.active)))}
            data={m.series.map((r, i) => ({ label: label(r.date, i, m.series.length), full: full(r.date), value: r.active }))}
          />
        </ChartCard>
        <ChartCard
          title="Tăng trưởng tài khoản"
          subtitle="Tổng số tài khoản Google tích lũy theo ngày"
          table={{ head: ['Ngày', 'Tổng tài khoản', 'Mới'], rows: m.series.map((r) => [r.key, r.cumAccounts, r.newAccounts]) }}
        >
          <LineChart
            suffix=""
            maxY={niceMax(Math.max(1, ...m.series.map((r) => r.cumAccounts)))}
            data={m.series.map((r, i) => ({ label: label(r.date, i, m.series.length), full: full(r.date), value: r.cumAccounts }))}
          />
        </ChartCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <ChartCard
          title="Giờ cao điểm"
          subtitle="Số câu trả lời theo thứ trong tuần × giờ trong ngày – ô càng đậm càng đông"
          table={{
            head: ['Thứ', 'Giờ', 'Số câu'],
            rows: m.heat.flatMap((row, d) => row.map((v, h) => [WEEKDAY[d], `${h}h`, v] as (string | number)[])).filter((r) => (r[2] as number) > 0),
          }}
        >
          <WeekHourHeatmap grid={m.heat} />
          {m.peak && (
            <p className="mt-2 text-sm font-semibold text-ink/60">
              Đông nhất: <b className="text-ink">{WEEKDAY[m.peak.d]}, {m.peak.h}h – {m.peak.h + 1}h</b>
            </p>
          )}
        </ChartCard>
        <ChartCard
          title="Người dùng mới mỗi ngày"
          legend={[
            { color: C.cat[0], label: 'Tài khoản Google' },
            { color: C.cat[2], label: 'Khách' },
          ]}
          table={{ head: ['Ngày', 'Tài khoản', 'Khách'], rows: m.series.map((r) => [r.key, r.newAccounts, r.newGuests]) }}
        >
          <StackedColumns
            every={every}
            data={m.series.map((r, i) => ({
              label: label(r.date, i, m.series.length),
              full: full(r.date),
              highlight: i === m.series.length - 1,
              parts: [
                { key: 'Tài khoản', value: r.newAccounts, color: C.cat[0] },
                { key: 'Khách', value: r.newGuests, color: C.cat[2] },
              ],
            }))}
          />
        </ChartCard>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <ChartCard
          title="Chế độ học"
          subtitle={`${nf(m.cur.sessions)} lượt hoàn thành`}
          legend={m.modes.map((x, i) => ({ color: C.cat[i], label: `${x.label} ${x.value}` }))}
          table={{ head: ['Chế độ', 'Lượt', 'Điểm TB'], rows: m.modes.map((x) => [x.label, x.value, `${x.avg}%`]) }}
        >
          <Donut
            size={150}
            parts={m.modes.map((x, i) => ({ label: x.label, value: x.value, color: C.cat[i] }))}
            center={
              <>
                <span className="text-2xl font-black">{nf(m.cur.sessions)}</span>
                <span className="text-xs font-bold text-ink/55">lượt</span>
              </>
            }
          />
        </ChartCard>
        <ChartCard
          title="Thư mục theo quyền xem"
          subtitle={`${nf(m.totals.folders)} thư mục`}
          legend={m.visibility.map((x, i) => ({ color: C.cat[i], label: `${x.label} ${x.value}` }))}
          table={{ head: ['Quyền xem', 'Thư mục'], rows: m.visibility.map((x) => [x.label, x.value]) }}
        >
          <Donut
            size={150}
            parts={m.visibility.map((x, i) => ({ label: x.label, value: x.value, color: C.cat[i] }))}
            center={
              <>
                <span className="text-2xl font-black">{pct(m.visibility[2].value, m.totals.folders)}%</span>
                <span className="text-xs font-bold text-ink/55">công khai</span>
              </>
            }
          />
        </ChartCard>
        <ChartCard
          title="Phân bố điểm kiểm tra"
          subtitle={m.testCount ? `${nf(m.testCount)} bài kiểm tra · TB ${m.testAvg}%` : 'Chưa có bài kiểm tra trong kỳ'}
          table={{ head: ['Khoảng điểm', 'Số bài'], rows: m.scoreBins.map((b) => [b.label, b.value]) }}
        >
          <Columns
            height={170}
            color={C.cat[1]}
            data={m.scoreBins.map((b, i) => ({ label: b.label, full: `Điểm ${b.label}`, value: b.value, highlight: i === m.scoreBins.length - 1 || b.value === Math.max(...m.scoreBins.map((x) => x.value)) }))}
            format={(v) => `${v} bài`}
          />
        </ChartCard>
      </section>

      {/* ---------- Bảng xếp hạng ---------- */}
      <section className="grid gap-4 lg:grid-cols-3">
        <RankCard
          title="Thư mục được học nhiều nhất"
          unit="câu"
          empty="Chưa có hoạt động trong kỳ"
          rows={m.topFolders.map((x) => ({
            key: x.id,
            value: x.value,
            label: x.folder ? (
              <Link to={`/f/${x.id}`} className="flex min-w-0 items-center gap-2 hover:text-lilac-500">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: PALETTE[x.folder.color]?.light }}>
                  <TopicIcon name={x.folder.icon} color={x.folder.color} size={18} />
                </span>
                <span className="truncate">{x.folder.name}</span>
              </Link>
            ) : (
              <span className="text-ink/45">Thư mục đã xóa</span>
            ),
          }))}
        />
        <RankCard
          title="Người học tích cực nhất"
          unit="câu"
          empty="Chưa có hoạt động trong kỳ"
          rows={m.topLearners.map((x) => ({ key: x.uid, value: x.value, label: <UserLabel user={x.user} uid={x.uid} /> }))}
        />
        <RankCard
          title="Người đóng góp nội dung"
          unit="câu hỏi"
          empty="Chưa có thư mục nào"
          rows={m.topCreators.map((x) => ({ key: x.uid, value: x.value, label: <UserLabel user={x.user} uid={x.uid} />, hint: `${x.folders} thư mục` }))}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* ---------- Hoạt động gần đây ---------- */}
        <ChartCard title="Lượt làm bài gần đây" subtitle="Cập nhật ngay khi có người hoàn thành">
          {m.recent.length === 0 ? (
            <p className="text-sm text-ink/50">Chưa có lượt làm bài nào.</p>
          ) : (
            <ul className="divide-y divide-ink/5">
              {m.recent.map((s) => {
                const score = pct(s.correct, s.total);
                return (
                  <li key={`${s.uid}-${s.id}`} className="flex items-center gap-3 py-2">
                    <UserLabel user={m.userMap.get(s.uid)} uid={s.uid} compactName />
                    <div className="min-w-0 flex-1 text-sm">
                      <div className="truncate font-bold">{s.folderName}</div>
                      <div className="text-xs font-semibold text-ink/45">
                        {MODE_LABEL[s.mode] ?? s.mode} · {s.correct}/{s.total} câu · {fmtDur(s.durationSec)} · {timeAgo(s.endedAt)}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-lg px-2 py-1 text-sm font-black tabular-nums ${score >= 80 ? 'bg-mint-100 text-mint-500' : score >= 50 ? 'bg-lemon-100 text-lemonink' : 'bg-peach-100 text-peach-500'}`}
                    >
                      {score}%
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </ChartCard>

        {/* ---------- Tình trạng hệ thống ---------- */}
        <ChartCard title="Tình trạng hệ thống" icon={<IconShield size={18} className="text-lilac-500" />}>
          <ul className="flex flex-col gap-2 text-sm">
            <Health Icon={IconSettings} label="Chế độ bảo trì" value={health.readOnly ? 'Đang bật' : 'Tắt'} tone={health.readOnly ? 'warn' : 'ok'} to="/admin/settings" />
            <Health Icon={IconMegaphone} label="Thông báo đang hiện" value={nf(health.activeNotices)} to="/admin/notices" />
            <Health
              Icon={IconBell}
              label="Thiết bị nhận thông báo đẩy"
              value={pushConfigured() ? (health.devices == null ? '…' : nf(health.devices)) : 'Chưa kích hoạt'}
              tone={pushConfigured() ? 'ok' : 'muted'}
              to="/admin/notices"
            />
            <Health Icon={IconShield} label="Admin" value={nf(health.admins)} to="/admin/users" />
            <Health Icon={IconBan} label="Tài khoản bị khóa" value={nf(health.bans)} tone={health.bans ? 'warn' : 'ok'} to="/admin/users" />
            <Health Icon={IconFolder} label="Người dùng sắp hết hạn mức (≥80%)" value={nf(health.nearQuota)} tone={health.nearQuota ? 'warn' : 'ok'} to="/admin/users" />
          </ul>
        </ChartCard>
      </section>
    </div>
  );
}

/* ================= Thành phần ================= */

type Delta = { value: number; unit: string } | null;
function delta(cur: number, prev: number, unit = '%'): Delta {
  if (unit !== '%') return { value: cur - prev, unit };
  if (!prev) return cur ? { value: 100, unit: '%' } : null;
  return { value: Math.round(((cur - prev) / prev) * 100), unit: '%' };
}

function Kpi({ label, value, delta: d, sub, spark, Icon }: { label: string; value: string; delta?: Delta; sub?: string; spark?: number[]; Icon: typeof IconUser }) {
  return (
    <div className="card flex flex-col gap-1.5 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-extrabold text-ink/55">{label}</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lilac-100 text-lilac-500">
          <Icon size={15} />
        </span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-black leading-none sm:text-[28px]">{value}</span>
        {spark && spark.some((v) => v > 0) && <Sparkline values={spark.slice(-14)} width={72} height={26} />}
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-semibold text-ink/45">
        {d && d.value !== 0 && (
          <span className={`flex items-center font-extrabold ${d.value > 0 ? 'text-mint-500' : 'text-peach-500'}`}>
            {d.value > 0 ? <IconUp size={13} strokeWidth={3} /> : <IconDown size={13} strokeWidth={3} />}
            {d.value > 0 ? '+' : ''}
            {d.value}
            {d.unit === '%' ? '%' : ` ${d.unit}`}
          </span>
        )}
        {d && d.value === 0 && <span className="font-extrabold text-ink/40">Không đổi</span>}
        {sub && <span className="truncate">{sub}</span>}
      </div>
    </div>
  );
}

function WeekHourHeatmap({ grid }: { grid: number[][] }) {
  const max = Math.max(1, ...grid.flat());
  const colorOf = (v: number) => (v <= 0 ? C.seq[0] : C.seq[Math.min(4, 1 + Math.floor((v / max) * 3.999))]);
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[420px]">
        <div className="grid grid-cols-[28px_repeat(24,minmax(0,1fr))] gap-[3px]">
          <span />
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className="text-center text-[10px] font-bold text-ink/40">
              {h % 3 === 0 ? h : ''}
            </span>
          ))}
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <div key={d} className="contents">
              <span className="self-center text-[11px] font-bold text-ink/45">{WEEKDAY[d]}</span>
              {grid[d].map((v, h) => (
                <span
                  key={h}
                  tabIndex={0}
                  title={`${WEEKDAY[d]} ${h}h–${h + 1}h: ${v} câu`}
                  aria-label={`${WEEKDAY[d]} ${h} giờ: ${v} câu`}
                  className="aspect-square rounded-[3px] outline-none transition hover:ring-2 hover:ring-ink/30 focus:ring-2 focus:ring-ink/50"
                  style={{ background: colorOf(v) }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-end gap-1 text-[11px] font-bold text-ink/45">
          Ít
          {C.seq.map((c) => (
            <span key={c} className="h-3 w-3 rounded-[3px]" style={{ background: c }} />
          ))}
          Nhiều
        </div>
      </div>
    </div>
  );
}

function RankCard({
  title,
  rows,
  unit,
  empty,
}: {
  title: string;
  rows: { key: string; label: ReactNode; value: number; hint?: string }[];
  unit: string;
  empty: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ChartCard title={title} table={{ head: ['#', 'Tên', unit], rows: rows.map((r, i) => [i + 1, typeof r.label === 'string' ? r.label : r.key, r.value]) }}>
      {rows.length === 0 ? (
        <p className="text-sm text-ink/50">{empty}</p>
      ) : (
        <ol className="flex flex-col gap-2.5">
          {rows.map((r, i) => (
            <li key={r.key} className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm font-bold">
                <span className={`w-5 shrink-0 text-center font-black ${i < 3 ? 'text-lilac-500' : 'text-ink/35'}`}>{i + 1}</span>
                <div className="min-w-0 flex-1">{r.label}</div>
                <span className="shrink-0 tabular-nums">
                  {nf(r.value)} <span className="text-xs text-ink/40">{unit}</span>
                </span>
              </div>
              <div className="ml-7 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-lilac-100">
                  <div className="h-full rounded-full bg-lilac-500" style={{ width: `${(r.value / max) * 100}%` }} />
                </div>
                {r.hint && <span className="shrink-0 text-[11px] font-semibold text-ink/40">{r.hint}</span>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </ChartCard>
  );
}

function UserLabel({ user, uid, compactName }: { user?: UserRow; uid: string; compactName?: boolean }) {
  const guest = !user?.email;
  return (
    <span className={`flex min-w-0 items-center gap-2 ${compactName ? 'w-36 shrink-0 sm:w-44' : ''}`}>
      {guest ? (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lilac-100">
          <Owl size={24} />
        </span>
      ) : (
        <Avatar url={user?.photoURL || null} name={user?.displayName || user?.email || '?'} size={28} />
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold">{guest ? 'Khách ẩn danh' : user?.displayName || user?.email}</span>
        {!compactName && !guest && <span className="block truncate text-[11px] font-semibold text-ink/40">{user?.email}</span>}
        {guest && !compactName && <span className="block truncate text-[11px] font-semibold text-ink/40">{uid.slice(0, 8)}…</span>}
      </span>
    </span>
  );
}

function Health({ Icon, label, value, tone = 'ok', to }: { Icon: typeof IconUser; label: string; value: string; tone?: 'ok' | 'warn' | 'muted'; to: string }) {
  const dot = tone === 'warn' ? 'bg-peach-500' : tone === 'muted' ? 'bg-ink/20' : 'bg-mint-500';
  return (
    <li>
      <Link to={to} className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-ink/[0.04]">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-ink/60">
          <Icon size={16} />
        </span>
        <span className="min-w-0 flex-1 font-semibold text-ink/70">{label}</span>
        <span className="flex items-center gap-1.5 font-black">
          <span className={`h-2 w-2 rounded-full ${dot}`} />
          {value}
        </span>
      </Link>
    </li>
  );
}

/* ================= Tính toán ================= */

function compute(range: Range, users: UserRow[], folders: Folder[], days: DayRow[], sessions: SessionRow[]) {
  const today = new Date();
  const curStart = dayKey(addDays(today, -(range - 1)));
  const prevStart = dayKey(addDays(today, -(2 * range - 1)));
  const inCur = (k: string) => k >= curStart;
  const inPrev = (k: string) => k >= prevStart && k < curStart;
  const userMap = new Map(users.map((u) => [u.uid, u]));

  // Theo ngày
  const byDay = new Map<string, { answered: number; correct: number; active: number }>();
  for (const d of days) {
    const cur = byDay.get(d.date) ?? { answered: 0, correct: 0, active: 0 };
    cur.answered += d.answered ?? 0;
    cur.correct += d.correct ?? 0;
    if ((d.answered ?? 0) > 0) cur.active += 1;
    byDay.set(d.date, cur);
  }
  const newBy = new Map<string, { a: number; g: number }>();
  let accountsBefore = 0;
  for (const u of users) {
    const c = toDate(u.createdAt);
    if (!c) continue;
    const k = dayKey(c);
    if (u.email && k < curStart) accountsBefore++;
    const v = newBy.get(k) ?? { a: 0, g: 0 };
    if (u.email) v.a++;
    else v.g++;
    newBy.set(k, v);
  }
  let cum = accountsBefore;
  const series = Array.from({ length: range }, (_, i) => {
    const date = addDays(today, i - range + 1);
    const key = dayKey(date);
    const v = byDay.get(key) ?? { answered: 0, correct: 0, active: 0 };
    const n = newBy.get(key) ?? { a: 0, g: 0 };
    cum += n.a;
    return { date, key, ...v, newAccounts: n.a, newGuests: n.g, cumAccounts: cum };
  });

  // Tổng hợp kỳ này / kỳ trước
  const period = (inP: (k: string) => boolean) => {
    const ds = days.filter((d) => inP(d.date));
    const answers = ds.reduce((s, d) => s + (d.answered ?? 0), 0);
    const correct = ds.reduce((s, d) => s + (d.correct ?? 0), 0);
    const active = new Set(ds.filter((d) => (d.answered ?? 0) > 0).map((d) => d.uid));
    const dayActive = ds.filter((d) => (d.answered ?? 0) > 0).length;
    const ss = sessions.filter((s) => inP(dayKey(new Date(s.endedAt))));
    const newAccounts = users.filter((u) => u.email && toDate(u.createdAt) && inP(dayKey(toDate(u.createdAt)!))).length;
    const newFolders = folders.filter((f) => toDate(f.createdAt) && inP(dayKey(toDate(f.createdAt)!))).length;
    return {
      answers,
      correct,
      accuracy: pct(correct, answers),
      activeUsers: active.size,
      activeSet: active,
      dau: dayActive / range,
      sessions: ss.length,
      avgScore: ss.length ? Math.round(ss.reduce((s, x) => s + pct(x.correct, x.total), 0) / ss.length) : 0,
      avgDuration: ss.length ? ss.reduce((s, x) => s + (x.durationSec ?? 0), 0) / ss.length : 0,
      newAccounts,
      newFolders,
      ss,
      ds,
    };
  };
  const cur = period(inCur);
  const prev = period(inPrev);
  const retained = [...prev.activeSet].filter((u) => cur.activeSet.has(u)).length;

  // Giờ cao điểm (thứ × giờ)
  const heat = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  for (const d of cur.ds) {
    const wd = new Date(`${d.date}T00:00:00`).getDay();
    for (const [h, v] of Object.entries(d.hours ?? {})) heat[wd][Number(h)] += v;
  }
  let peak: { d: number; h: number } | null = null;
  let peakV = 0;
  heat.forEach((row, d) => row.forEach((v, h) => v > peakV && ((peakV = v), (peak = { d, h }))));

  // Chế độ học & điểm kiểm tra
  const modes = (['learn', 'test', 'review'] as const).map((k) => {
    const ss = cur.ss.filter((s) => s.mode === k);
    return { label: MODE_LABEL[k], value: ss.length, avg: ss.length ? Math.round(ss.reduce((a, s) => a + pct(s.correct, s.total), 0) / ss.length) : 0 };
  });
  const tests = cur.ss.filter((s) => s.mode === 'test');
  const scoreBins = ['0–19', '20–39', '40–59', '60–79', '80–100'].map((label, i) => ({
    label,
    value: tests.filter((s) => Math.min(4, Math.floor(pct(s.correct, s.total) / 20)) === i).length,
  }));

  // Xếp hạng
  const folderMap = new Map(folders.map((f) => [f.id, f]));
  const byFolder = new Map<string, number>();
  const byLearner = new Map<string, number>();
  for (const d of cur.ds) {
    for (const [fid, v] of Object.entries(d.folders ?? {})) byFolder.set(fid, (byFolder.get(fid) ?? 0) + v);
    byLearner.set(d.uid, (byLearner.get(d.uid) ?? 0) + (d.answered ?? 0));
  }
  const byCreator = new Map<string, { q: number; f: number }>();
  for (const f of folders) {
    const v = byCreator.get(f.ownerId) ?? { q: 0, f: 0 };
    v.q += f.questionCount ?? 0;
    v.f += 1;
    byCreator.set(f.ownerId, v);
  }
  const top = <T,>(m: Map<string, T>, val: (v: T) => number) =>
    [...m.entries()].filter(([, v]) => val(v) > 0).sort((a, b) => val(b[1]) - val(a[1])).slice(0, 6);

  return {
    series,
    cur,
    prev,
    retention: pct(retained, prev.activeUsers),
    totals: {
      accounts: users.filter((u) => u.email).length,
      guests: users.filter((u) => !u.email).length,
      folders: folders.length,
      publicFolders: folders.filter((f) => f.visibility === 'public').length,
      questions: folders.reduce((s, f) => s + (f.questionCount ?? 0), 0),
    },
    heat,
    peak: peak as { d: number; h: number } | null,
    modes,
    visibility: [
      { label: 'Riêng tư', value: folders.filter((f) => f.visibility === 'private').length },
      { label: 'Có link', value: folders.filter((f) => f.visibility === 'link').length },
      { label: 'Công khai', value: folders.filter((f) => f.visibility === 'public').length },
    ],
    testCount: tests.length,
    testAvg: tests.length ? Math.round(tests.reduce((a, s) => a + pct(s.correct, s.total), 0) / tests.length) : 0,
    scoreBins,
    topFolders: top(byFolder, (v) => v).map(([id, value]) => ({ id, value, folder: folderMap.get(id) })),
    topLearners: top(byLearner, (v) => v).map(([uid, value]) => ({ uid, value, user: userMap.get(uid) })),
    topCreators: top(byCreator, (v) => v.q).map(([uid, v]) => ({ uid, value: v.q, folders: v.f, user: userMap.get(uid) })),
    recent: [...sessions].sort((a, b) => b.endedAt - a.endedAt).slice(0, 8),
    userMap,
  };
}
