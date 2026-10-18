import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import {
  addDays,
  dayKey,
  levelOf,
  masteryOf,
  setDailyGoal,
  streaks,
  titleOf,
  useAllProgress,
  useDays,
  useSessions,
  useUserDoc,
  xpOf,
  type DayStat,
  type FolderProgress,
  type Session,
  type UserDoc,
} from '../lib/stats';
import LoginButton, { LoginPrompt } from '../components/LoginButton';
import { timeAgo } from '../lib/time';
import { useSite } from '../lib/site';
import { C, ChartCard, Columns, Donut, Heatmap, LineChart, Ring, Sparkline, StackBar, StackedColumns } from '../components/charts';
import { Badge, Flame, type Glyph } from '../icons/badges';
import { IconCheck, IconFolder, IconRepeat, IconSparkle, IconUp, IconDown, Owl, Trophy } from '../icons';

const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const fmtDay = (d: Date) => `${WEEKDAY[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
const short = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
const compact = (n: number) => (n >= 10000 ? `${(n / 1000).toFixed(1).replace('.0', '')}K` : n.toLocaleString('vi-VN'));
const GOALS = [10, 20, 30, 50, 100];
const MODE_LABEL = { learn: 'Học', test: 'Kiểm tra', review: 'Ôn tập' } as const;

export default function Stats() {
  const { user, uid, loading } = useAuth();
  if (loading) return <div className="card h-64 animate-pulse bg-surface/60" />;
  if (!uid) return <LoginPrompt message="Đăng nhập để theo dõi chuỗi ngày học, cấp độ, huy hiệu và biểu đồ tiến bộ của bạn." />;
  return (
    <div className="flex flex-col gap-5">
      {!user && (
        <div className="card flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm font-semibold text-ink/65">
            Bạn đang học ở chế độ <b className="text-ink">khách</b>. Tiến độ vẫn được lưu trên hệ thống, nhưng chỉ gắn với trình
            duyệt này. Đăng nhập Google để giữ toàn bộ thống kê và học tiếp trên mọi thiết bị.
          </p>
          <LoginButton />
        </div>
      )}
      <Dashboard uid={uid} name={user?.displayName?.split(' ').pop() ?? 'bạn'} />
    </div>
  );
}

function Dashboard({ uid, name }: { uid: string; name: string }) {
  const days = useDays(uid);
  const sessions = useSessions(uid);
  const me = useUserDoc(uid);
  const progress = useAllProgress(uid);

  const loading = days.loading || progress.loading || me.loading;
  if (loading)
    return (
      <div className="grid gap-4">
        <div className="card h-44 animate-pulse bg-surface/60" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card h-28 animate-pulse bg-surface/60" />
          ))}
        </div>
        <div className="card h-56 animate-pulse bg-surface/60" />
      </div>
    );
  return <DashboardView uid={uid} name={name} days={days.data} sessions={sessions.data} me={me.data} progress={progress.data} />;
}

export function DashboardView({
  uid,
  name,
  days,
  sessions,
  me,
  progress,
}: {
  uid: string;
  name: string;
  days: DayStat[];
  sessions: Session[];
  me: UserDoc;
  progress: FolderProgress[];
}) {
  const { config } = useSite();
  const goal = me.dailyGoal ?? config.defaultDailyGoal ?? 20;
  const m = useMemo(() => compute(days, progress), [days, progress]);
  const lv = levelOf(m.xp);
  const todayDone = m.today.answered;
  const goalPct = Math.min(100, Math.round((todayDone / goal) * 100));
  const achievements = buildAchievements(m, sessions, me.perfectCount ?? 0, goal);
  const unlocked = achievements.filter((a) => a.value >= a.target).length;
  const empty = m.totalAnswered === 0;

  const owlMood = empty ? 'wow' : m.streak.studiedToday ? 'happy' : 'think';
  const greeting = empty
    ? `Chào ${name}! Làm câu đầu tiên để bắt đầu hành trình nhé!`
    : todayDone >= goal
      ? `Tuyệt vời ${name}! Hôm nay đã hoàn thành mục tiêu rồi!`
      : m.streak.studiedToday
        ? `Cố lên ${name}! Còn ${goal - todayDone} câu nữa là đạt mục tiêu hôm nay.`
        : m.streak.current > 0
          ? `${name} ơi, học vài câu để giữ chuỗi ${m.streak.current} ngày nhé!`
          : `Chào ${name}! Hôm nay mình học gì nào?`;

  return (
    <div className="flex flex-col gap-5">
      {/* ---------- Hero: cấp độ + chuỗi ngày ---------- */}
      <section className="card relative overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-lilac-100" />
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-center gap-4">
            <Owl size={92} mood={owlMood} className="shrink-0 animate-bob" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip bg-lilac-500 text-white">Cấp {lv.level}</span>
                <span className="text-lg font-black">{titleOf(lv.level)}</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-ink/60">{greeting}</p>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs font-extrabold text-ink/55">
                  <span>{compact(m.xp)} XP</span>
                  <span>
                    {lv.into}/{lv.need} → Cấp {lv.level + 1}
                  </span>
                </div>
                <div className="h-3.5 overflow-hidden rounded-full bg-lilac-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-lilac-300 to-lilac-500 transition-all duration-700"
                    style={{ width: `${(lv.into / lv.need) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-blob bg-peach-100/70 px-5 py-4">
            <Flame size={60} lit={m.streak.studiedToday} />
            <div>
              <div className="text-4xl font-black leading-none">{m.streak.current}</div>
              <div className="text-sm font-extrabold text-ink/60">ngày liên tiếp</div>
              <div className="mt-0.5 text-xs font-bold text-ink/45">Kỷ lục: {m.streak.best} ngày</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Mục tiêu ngày + thẻ số ---------- */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
        <div className="card flex items-center gap-4 p-5">
          <Ring value={todayDone} max={goal} size={128} color={todayDone >= goal ? 'rgb(var(--mint-500))' : C.right} track={todayDone >= goal ? 'rgb(var(--mint-100))' : 'rgb(var(--lilac-100))'}>
            <span className="text-3xl font-black leading-none">{todayDone}</span>
            <span className="text-xs font-bold text-ink/50">/ {goal} câu</span>
          </Ring>
          <div className="min-w-0">
            <h3 className="font-black">Mục tiêu hôm nay</h3>
            <p className="text-sm font-semibold text-ink/55">
              {todayDone >= goal ? (
                <span className="flex items-center gap-1 text-mint-500">
                  <IconCheck size={16} /> Hoàn thành!
                </span>
              ) : (
                `Đã đạt ${goalPct}%`
              )}
            </p>
            <label className="mt-3 block text-xs font-extrabold text-ink/50">
              Đổi mục tiêu
              <select
                className="input mt-1 w-auto py-1.5 pr-8 text-sm font-bold"
                value={goal}
                onChange={(e) => setDailyGoal(uid, Number(e.target.value))}
              >
                {GOALS.map((g) => (
                  <option key={g} value={g}>
                    {g} câu / ngày
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Câu đã làm" value={compact(m.totalAnswered)} spark={m.last14.map((d) => d.answered)} />
          <StatTile label="Tỉ lệ đúng" value={`${m.accuracy}%`} delta={m.accDelta} deltaUnit="điểm" />
          <StatTile label="Câu đã thuộc" value={compact(m.mastery.mastered)} hint={`/${compact(m.mastery.total)} câu`} />
          <StatTile label="7 ngày qua" value={compact(m.week)} delta={m.weekDeltaPct} deltaUnit="%" hint="câu" />
        </div>
      </section>

      {empty ? (
        <EmptyHint />
      ) : (
        <>
          {/* ---------- Lịch hoạt động ---------- */}
          <ChartCard
            title="Lịch học 20 tuần"
            subtitle={`${m.activeDays20} ngày có học · ô càng đậm là học càng nhiều`}
            icon={<IconSparkle size={18} className="text-lilac-500" />}
            table={{
              head: ['Ngày', 'Số câu'],
              rows: m.heatWeeks
                .flat()
                .filter((d) => !d.future && d.value > 0)
                .reverse()
                .map((d) => [d.label, d.value]),
            }}
          >
            <Heatmap weeks={m.heatWeeks} levels={m.heatLevels} />
          </ChartCard>

          {/* ---------- 14 ngày + xu hướng ---------- */}
          <section className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Số câu 14 ngày qua"
              subtitle="Cột cao = học chăm. Phần tím là câu đúng."
              legend={[
                { color: C.right, label: 'Đúng' },
                { color: C.wrong, label: 'Sai' },
              ]}
              table={{
                head: ['Ngày', 'Đúng', 'Sai', 'Tổng'],
                rows: m.last14.map((d) => [fmtDay(d.date), d.correct, d.answered - d.correct, d.answered]),
              }}
            >
              <StackedColumns
                data={m.last14.map((d, i) => ({
                  label: i === 13 ? 'Nay' : WEEKDAY[d.date.getDay()],
                  full: fmtDay(d.date),
                  highlight: i === 13,
                  parts: [
                    { key: 'Đúng', value: d.correct, color: C.right },
                    { key: 'Sai', value: d.answered - d.correct, color: C.wrong },
                  ],
                }))}
              />
            </ChartCard>
            <ChartCard
              title="Độ chính xác 30 ngày"
              subtitle="Tỉ lệ trả lời đúng mỗi ngày – đường đi lên là bạn đang giỏi dần!"
              table={{
                head: ['Ngày', 'Tỉ lệ đúng'],
                rows: m.last30.filter((d) => d.answered).map((d) => [fmtDay(d.date), `${Math.round((d.correct / d.answered) * 100)}%`]),
              }}
            >
              <LineChart
                data={m.last30.map((d) => ({
                  label: short(d.date),
                  full: fmtDay(d.date),
                  value: d.answered ? (d.correct / d.answered) * 100 : null,
                }))}
              />
            </ChartCard>
          </section>

          {/* ---------- Giờ vàng + độ thuộc ---------- */}
          <section className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <ChartCard
              title="Giờ vàng của bạn"
              subtitle={
                m.bestHour != null ? (
                  <>
                    Bạn học nhiều nhất lúc <b className="text-ink">{m.bestHour}h – {m.bestHour + 1}h</b>
                  </>
                ) : undefined
              }
              table={{ head: ['Giờ', 'Số câu'], rows: m.hours.map((v, h) => [`${h}h`, v]).filter((r) => (r[1] as number) > 0) }}
            >
              <Columns
                every={3}
                height={200}
                data={m.hours.map((v, h) => ({ label: `${h}h`, full: `${h}h – ${h + 1}h`, value: v, highlight: h === m.bestHour }))}
                format={(v) => `${v} câu`}
              />
            </ChartCard>
            <ChartCard
              title="Mức độ thuộc bài"
              subtitle="Đã thuộc = đúng ít nhất 2 lần và đúng nhiều hơn sai"
              legend={[
                { color: C.right, label: `Đã thuộc ${m.mastery.mastered}` },
                { color: C.wrong, label: `Đang học ${m.mastery.learning}` },
                { color: C.neutral, label: `Chưa học ${m.mastery.fresh}` },
              ]}
              table={{
                head: ['Mức', 'Số câu'],
                rows: [
                  ['Đã thuộc', m.mastery.mastered],
                  ['Đang học', m.mastery.learning],
                  ['Chưa học', m.mastery.fresh],
                ],
              }}
            >
              <Donut
                parts={[
                  { label: 'Đã thuộc', value: m.mastery.mastered, color: C.right },
                  { label: 'Đang học', value: m.mastery.learning, color: C.wrong },
                  { label: 'Chưa học', value: m.mastery.fresh, color: C.neutral },
                ]}
                center={
                  <>
                    <span className="text-3xl font-black">{m.mastery.total ? Math.round((m.mastery.mastered / m.mastery.total) * 100) : 0}%</span>
                    <span className="text-xs font-bold text-ink/55">đã thuộc</span>
                  </>
                }
              />
            </ChartCard>
          </section>

          {/* ---------- Theo thư mục ---------- */}
          <ChartCard
            title="Tiến độ từng thư mục"
            subtitle="Thư mục nào còn nhiều phần cam thì ôn thêm nhé"
            icon={<IconFolder size={18} className="text-peach-500" />}
            legend={[
              { color: C.right, label: 'Đã thuộc' },
              { color: C.wrong, label: 'Đang học' },
              { color: C.neutral, label: 'Chưa học' },
            ]}
            table={{
              head: ['Thư mục', 'Đã thuộc', 'Đang học', 'Chưa học', 'Cần ôn'],
              rows: m.folders.map((f) => [f.name, f.mastered, f.learning, f.fresh, f.review]),
            }}
          >
            <ul className="flex flex-col gap-4">
              {m.folders.map((f) => (
                <li key={f.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Link to={`/f/${f.id}`} className="min-w-0 truncate font-extrabold hover:text-lilac-500">
                      {f.name}
                    </Link>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-black tabular-nums">{f.pct}%</span>
                      {f.review > 0 && (
                        <Link to={`/f/${f.id}/study?mode=review`} className="chip bg-peach-100 text-ink/70 hover:bg-peach-300/50">
                          <IconRepeat size={12} /> Ôn {f.review}
                        </Link>
                      )}
                    </div>
                  </div>
                  <StackBar
                    parts={[
                      { label: 'Đã thuộc', value: f.mastered, color: C.right },
                      { label: 'Đang học', value: f.learning, color: C.wrong },
                      { label: 'Chưa học', value: f.fresh, color: C.neutral },
                    ]}
                  />
                </li>
              ))}
            </ul>
          </ChartCard>
        </>
      )}

      {/* ---------- Huy hiệu ---------- */}
      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 font-black">
            <Trophy size={26} /> Bộ sưu tập huy hiệu
          </h3>
          <span className="chip bg-lemon-100 text-ink/70">
            {unlocked}/{achievements.length} đã mở
          </span>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {achievements.map((a) => {
            const done = a.value >= a.target;
            return (
              <li
                key={a.id}
                className={`flex flex-col items-center gap-1 rounded-2xl p-3 text-center transition ${
                  done ? 'bg-lilac-100/60' : 'bg-ink/[0.03]'
                }`}
              >
                <Badge glyph={a.glyph} color={a.color} unlocked={done} size={60} />
                <span className={`text-sm font-black ${done ? '' : 'text-ink/55'}`}>{a.title}</span>
                <span className="text-xs font-semibold text-ink/50">{a.desc}</span>
                {!done && (
                  <div className="mt-1 w-full">
                    <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
                      <div className="h-full rounded-full bg-lilac-500" style={{ width: `${Math.min(100, (a.value / a.target) * 100)}%` }} />
                    </div>
                    <span className="text-[11px] font-bold tabular-nums text-ink/45">
                      {Math.min(a.value, a.target)}/{a.target}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---------- Lượt học gần đây ---------- */}
      {sessions.length > 0 && <RecentSessions sessions={sessions} />}
    </div>
  );
}

/* ---------------- Thẻ số ---------------- */

function StatTile({
  label,
  value,
  hint,
  delta,
  deltaUnit,
  spark,
}: {
  label: string;
  value: string;
  hint?: string;
  delta?: number | null;
  deltaUnit?: string;
  spark?: number[];
}) {
  return (
    <div className="card flex flex-col justify-between gap-1 p-4">
      <span className="text-xs font-extrabold text-ink/55">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black sm:text-3xl">{value}</span>
        {hint && <span className="text-xs font-bold text-ink/45">{hint}</span>}
      </div>
      {delta != null && delta !== 0 ? (
        <span className={`flex items-center gap-0.5 text-xs font-extrabold ${delta > 0 ? 'text-mint-500' : 'text-ink/50'}`}>
          {delta > 0 ? <IconUp size={14} strokeWidth={3} /> : <IconDown size={14} strokeWidth={3} />}
          {delta > 0 ? '+' : ''}
          {delta} {deltaUnit} so với tuần trước
        </span>
      ) : spark ? (
        <Sparkline values={spark} />
      ) : (
        <span className="text-xs font-bold text-ink/35">so với tuần trước: —</span>
      )}
    </div>
  );
}

function EmptyHint() {
  return (
    <section className="card flex flex-col items-center gap-3 p-8 text-center">
      <Owl size={96} mood="wow" />
      <h3 className="text-xl font-black">Biểu đồ đang chờ bạn!</h3>
      <p className="max-w-md text-ink/60">
        Mỗi câu trả lời sẽ được ghi lại để vẽ lịch học, độ chính xác, giờ vàng và mức thuộc bài. Làm vài câu là thấy ngay.
      </p>
      <Link to="/me" className="btn-primary">
        <IconFolder size={18} /> Chọn thư mục để học
      </Link>
    </section>
  );
}

function RecentSessions({ sessions }: { sessions: Session[] }) {
  return (
    <ChartCard
      title="Lượt học gần đây"
      table={{
        head: ['Thời gian', 'Thư mục', 'Chế độ', 'Điểm', 'Thời lượng'],
        rows: sessions.map((s) => [
          new Date(s.endedAt).toLocaleString('vi-VN'),
          s.folderName,
          MODE_LABEL[s.mode],
          `${s.correct}/${s.total}`,
          `${Math.max(1, Math.round(s.durationSec / 60))} phút`,
        ]),
      }}
    >
      <ul className="flex flex-col gap-2">
        {sessions.slice(0, 8).map((s) => {
          const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
          return (
            <li key={s.id} className="flex items-center gap-3 rounded-2xl bg-ink/[0.03] px-3 py-2.5">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                  pct === 100 ? 'bg-lemon-300 text-ink' : 'bg-surface text-ink'
                }`}
              >
                {pct}%
              </span>
              <div className="min-w-0 flex-1">
                <Link to={`/f/${s.folderId}`} className="block truncate font-extrabold hover:text-lilac-500">
                  {s.folderName}
                </Link>
                <div className="text-xs font-semibold text-ink/50">
                  {MODE_LABEL[s.mode]} · {s.correct}/{s.total} câu đúng · {Math.max(1, Math.round(s.durationSec / 60))} phút ·{' '}
                  {timeAgo(s.endedAt)}
                </div>
              </div>
              <div className="hidden w-28 sm:block">
                <div className="h-2 overflow-hidden rounded-full bg-peach-100">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: C.right }} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
}

/* ---------------- Tính toán số liệu ---------------- */

interface DayRow {
  date: Date;
  answered: number;
  correct: number;
}

function compute(days: DayStat[], progress: FolderProgress[]) {
  const byKey = new Map(days.map((d) => [d.date, d]));
  const today = new Date();
  const range = (n: number): DayRow[] =>
    Array.from({ length: n }, (_, i) => {
      const date = addDays(today, i - n + 1);
      const d = byKey.get(dayKey(date));
      return { date, answered: d?.answered ?? 0, correct: d?.correct ?? 0 };
    });

  const totalAnswered = days.reduce((s, d) => s + (d.answered ?? 0), 0);
  const totalCorrect = days.reduce((s, d) => s + (d.correct ?? 0), 0);
  const last14 = range(14);
  const last30 = range(30);

  const sum = (rows: { answered: number; correct: number }[]) =>
    rows.reduce((a, r) => ({ answered: a.answered + r.answered, correct: a.correct + r.correct }), { answered: 0, correct: 0 });
  const thisWeek = sum(last14.slice(7));
  const lastWeek = sum(last14.slice(0, 7));
  const acc = (r: { answered: number; correct: number }) => (r.answered ? Math.round((r.correct / r.answered) * 100) : null);
  const accThis = acc(thisWeek);
  const accLast = acc(lastWeek);

  // Bản đồ nhiệt: 20 tuần, cột bắt đầu từ thứ Hai.
  const mondayOffset = (today.getDay() + 6) % 7;
  const start = addDays(today, -mondayOffset - 19 * 7);
  const heatWeeks = Array.from({ length: 20 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = addDays(start, w * 7 + d);
      const k = dayKey(date);
      return { key: k, label: fmtDay(date), value: byKey.get(k)?.answered ?? 0, future: date > today };
    }),
  );
  const heatVals = heatWeeks.flat().map((d) => d.value).filter((v) => v > 0).sort((a, b) => a - b);
  const q = (p: number) => heatVals[Math.min(heatVals.length - 1, Math.floor(p * heatVals.length))] ?? 1;
  const heatLevels = [q(0.25), q(0.5), q(0.75)];

  const hours = Array.from({ length: 24 }, () => 0);
  for (const d of days) for (const [h, v] of Object.entries(d.hours ?? {})) hours[Number(h)] += v;
  const maxHour = Math.max(...hours);
  const bestHour = maxHour > 0 ? hours.indexOf(maxHour) : null;

  // Mức thuộc bài theo thư mục.
  const folders = progress
    .map((p) => {
      let mastered = 0;
      let learning = 0;
      let review = 0;
      for (const s of Object.values(p.stats)) {
        const lvl = masteryOf(s);
        if (lvl === 'mastered') mastered++;
        else if (lvl === 'learning') learning++;
        if (s.wrong > 0 && s.wrong >= s.right) review++;
      }
      const total = Math.max(p.questionCount ?? 0, mastered + learning);
      const fresh = total - mastered - learning;
      return { id: p.folderId, name: p.folderName, mastered, learning, fresh, review, total, pct: total ? Math.round((mastered / total) * 100) : 0 };
    })
    .filter((f) => f.total > 0)
    .sort((a, b) => b.mastered + b.learning - (a.mastered + a.learning));
  const mastery = folders.reduce(
    (a, f) => ({ mastered: a.mastered + f.mastered, learning: a.learning + f.learning, fresh: a.fresh + f.fresh, total: a.total + f.total }),
    { mastered: 0, learning: 0, fresh: 0, total: 0 },
  );

  const goalDays = (goal: number) => days.filter((d) => d.answered >= goal).length;
  const nightOwl = Object.entries(hours).some(([h, v]) => v > 0 && (Number(h) >= 22 || Number(h) < 4));
  const earlyBird = Object.entries(hours).some(([h, v]) => v > 0 && Number(h) >= 4 && Number(h) < 7);
  const maxDay = Math.max(0, ...days.map((d) => d.answered));

  return {
    totalAnswered,
    accuracy: totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
    accDelta: accThis != null && accLast != null ? accThis - accLast : null,
    week: thisWeek.answered,
    weekDeltaPct: lastWeek.answered ? Math.round(((thisWeek.answered - lastWeek.answered) / lastWeek.answered) * 100) : null,
    xp: xpOf(totalAnswered, totalCorrect),
    today: last14[13],
    streak: streaks(days),
    last14,
    last30,
    heatWeeks,
    heatLevels,
    activeDays20: heatWeeks.flat().filter((d) => d.value > 0).length,
    hours,
    bestHour,
    folders,
    mastery,
    goalDays,
    nightOwl,
    earlyBird,
    maxDay,
    folderCount: progress.filter((p) => Object.keys(p.stats).length > 0).length,
  };
}

type Metrics = ReturnType<typeof compute>;

interface Achievement {
  id: string;
  title: string;
  desc: string;
  glyph: Glyph;
  color: string;
  value: number;
  target: number;
}

function buildAchievements(m: Metrics, sessions: Session[], perfectCount: number, goal: number): Achievement[] {
  const best = m.streak.best;
  return [
    { id: 'first', title: 'Bước đầu tiên', desc: 'Trả lời câu đầu tiên', glyph: 'seed', color: '#3FBF8C', value: m.totalAnswered, target: 1 },
    { id: 'a100', title: 'Chăm chỉ', desc: 'Làm 100 câu', glyph: 'book', color: '#8C6CF0', value: m.totalAnswered, target: 100 },
    { id: 'a1000', title: 'Mọt sách', desc: 'Làm 1.000 câu', glyph: 'gem', color: '#4D9EF5', value: m.totalAnswered, target: 1000 },
    { id: 's3', title: 'Nhóm lửa', desc: 'Học 3 ngày liên tiếp', glyph: 'flame', color: '#FF8A65', value: best, target: 3 },
    { id: 's7', title: 'Lửa bùng cháy', desc: 'Học 7 ngày liên tiếp', glyph: 'flame', color: '#F2647F', value: best, target: 7 },
    { id: 's30', title: 'Ngọn đuốc', desc: 'Học 30 ngày liên tiếp', glyph: 'crown', color: '#E0AE00', value: best, target: 30 },
    { id: 'goal', title: 'Về đích', desc: `Đạt mục tiêu ${goal} câu/ngày`, glyph: 'target', color: '#F2647F', value: m.goalDays(goal), target: 1 },
    { id: 'goal10', title: 'Bền bỉ', desc: 'Đạt mục tiêu ngày 10 lần', glyph: 'check', color: '#3FBF8C', value: m.goalDays(goal), target: 10 },
    {
      id: 'perfect',
      title: 'Điểm tuyệt đối',
      desc: 'Đúng hết 1 lượt (≥5 câu)',
      glyph: 'star',
      color: '#E0AE00',
      value: Math.max(perfectCount, sessions.some((s) => s.total >= 5 && s.correct === s.total) ? 1 : 0),
      target: 1,
    },
    { id: 'm50', title: 'Trí nhớ siêu phàm', desc: 'Thuộc 50 câu', glyph: 'bolt', color: '#8C6CF0', value: m.mastery.mastered, target: 50 },
    { id: 'speed', title: 'Tia chớp', desc: 'Làm 100 câu trong 1 ngày', glyph: 'bolt', color: '#FF8A65', value: m.maxDay, target: 100 },
    { id: 'explore', title: 'Nhà thám hiểm', desc: 'Học 3 thư mục khác nhau', glyph: 'compass', color: '#4D9EF5', value: m.folderCount, target: 3 },
    { id: 'night', title: 'Cú đêm', desc: 'Học sau 22 giờ', glyph: 'moon', color: '#8C6CF0', value: m.nightOwl ? 1 : 0, target: 1 },
    { id: 'early', title: 'Chim sớm', desc: 'Học trước 7 giờ sáng', glyph: 'sun', color: '#E0AE00', value: m.earlyBird ? 1 : 0, target: 1 },
  ];
}
