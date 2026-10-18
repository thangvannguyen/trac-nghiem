import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';
import { useAllUsers, type Audience, type Tone } from '../lib/admin';
import {
  EMPTY_NOTICE,
  TEMPLATES,
  countDismissedNotice,
  createNotice,
  deleteNotice,
  reshowNotice,
  resendPush,
  setNoticeActive,
  updateNotice,
  useAllNotices,
  type Notice,
  type NoticeInput,
  type NoticeTemplate,
} from '../lib/notices';
import { countPushDevices, pushConfigured } from '../lib/push';
import { playChime } from '../lib/sound';
import NoticeView, { CONTENT_PRESETS, TONES } from '../components/NoticeView';
import Modal from '../components/Modal';
import Switch from '../components/Switch';
import { Avatar } from '../components/Navbar';
import { useToast } from '../components/Toast';
import {
  IconCopy,
  IconEdit,
  IconEye,
  IconGlobe,
  IconMegaphone,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSparkle,
  IconTrash,
  IconUser,
  IconUsers,
  IconVolume,
  IconX,
} from '../icons';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
const fmtDateTime = (t?: Timestamp | null) => (t ? t.toDate().toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—');


const AUDIENCE_LABEL: Record<Audience, string> = { all: 'Tất cả', users: 'Đã đăng nhập', guests: 'Khách', specific: 'Chỉ định' };

/* ================= Danh sách thông báo ================= */

type Filter = 'active' | 'off' | 'all';

export default function NoticesTab({ me }: { me: User }) {
  const notices = useAllNotices();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<{ notice?: Notice; input: NoticeInput } | null>(null);
  const [devices, setDevices] = useState<number | null>(null);

  useEffect(() => {
    if (pushConfigured()) countPushDevices().then(setDevices, () => setDevices(-1));
  }, []);

  const rows = notices.data.filter((n) => (filter === 'all' ? true : filter === 'active' ? n.active : !n.active));
  const counts = { active: notices.data.filter((n) => n.active).length, off: notices.data.filter((n) => !n.active).length, all: notices.data.length };

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      toast(ok);
    } catch (e) {
      console.error(e);
      toast('Không thực hiện được', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {([
            ['all', 'Tất cả'],
            ['active', 'Đang hiện'],
            ['off', 'Nháp / đã tắt'],
          ] as [Filter, string][]).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`chip px-3 py-1.5 text-sm ${filter === k ? 'bg-ink text-cream' : 'bg-surface text-ink/60 hover:text-ink'}`}
            >
              {label} <span className="opacity-60">{counts[k]}</span>
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={() => setEditing({ input: { ...EMPTY_NOTICE } })}>
          <IconPlus size={18} /> Tạo thông báo
        </button>
      </div>

      <PushSetupCard devices={devices} />

      {notices.loading ? (
        <div className="card h-40 animate-pulse" />
      ) : rows.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-8 text-center">
          <IconMegaphone size={36} className="text-lilac-300" />
          <p className="font-bold text-ink/55">{notices.data.length ? 'Không có thông báo nào ở mục này.' : 'Chưa có thông báo nào. Tạo thông báo đầu tiên nhé!'}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((n) => (
            <NoticeRow
              key={n.id}
              n={n}
              onToggle={(v) => act(() => setNoticeActive(me, n, v), v ? 'Đã bật thông báo' : 'Đã tắt thông báo')}
              onReshow={() => confirm('Hiện lại thông báo này cho tất cả (kể cả người đã đóng)?') && act(() => reshowNotice(me, n), 'Thông báo sẽ hiện lại với mọi người')}
              onResend={() => confirm('Gửi lại thông báo đẩy tới các thiết bị?') && act(() => resendPush(me, n), 'Đã yêu cầu gửi thông báo đẩy')}
              onEdit={() => setEditing({ notice: n, input: pick(n) })}
              onDuplicate={() => setEditing({ input: { ...pick(n), title: n.title ? `${n.title} (bản sao)` : '' } })}
              onDelete={() => confirm('Xóa vĩnh viễn thông báo này?') && act(() => deleteNotice(me, n), 'Đã xóa thông báo')}
            />
          ))}
        </ul>
      )}

      {editing && (
        <NoticeEditor
          initial={editing.input}
          isNew={!editing.notice}
          onClose={() => setEditing(null)}
          onSave={async (input, publish) => {
            try {
              if (editing.notice) await updateNotice(me, editing.notice, input);
              else await createNotice(me, input, publish);
              toast(editing.notice ? 'Đã lưu thông báo' : publish ? 'Đã đăng thông báo' : 'Đã lưu nháp');
              setEditing(null);
            } catch (e) {
              console.error(e);
              toast('Không lưu được', 'error');
            }
          }}
        />
      )}
    </div>
  );
}

const pick = (n: Notice): NoticeInput => ({
  title: n.title,
  text: n.text,
  tone: n.tone,
  template: n.template,
  audience: n.audience,
  targetUids: n.targetUids,
  sound: n.sound,
  push: n.push,
});

function PushSetupCard({ devices }: { devices: number | null }) {
  if (pushConfigured())
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-mint-100/70 px-4 py-3 text-sm font-bold text-ink/70">
        <IconSparkle size={18} className="shrink-0 text-mint-500" />
        Thông báo đẩy đã sẵn sàng · {devices == null ? '…' : devices < 0 ? '?' : devices} thiết bị đã bật nhận thông báo.
      </div>
    );
  return (
    <div className="rounded-2xl border-2 border-dashed border-peach-300/70 bg-peach-100/50 px-4 py-3 text-sm text-ink/70">
      <b className="text-ink">Thông báo đẩy (hiện cả khi đã đóng tab) chưa được kích hoạt.</b> Cần: (1) nâng project Firebase lên gói Blaze
      để chạy Cloud Functions, (2) tạo khóa VAPID trong Project settings → Cloud Messaging → Web Push certificates. Thông báo trong web vẫn
      hoạt động bình thường.
    </div>
  );
}

function NoticeRow({
  n,
  onToggle,
  onReshow,
  onResend,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  n: Notice;
  onToggle: (v: boolean) => void;
  onReshow: () => void;
  onResend: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const t = TONES[n.tone] ?? TONES.info;
  const [dismissed, setDismissed] = useState<number | null>(null);
  useEffect(() => {
    countDismissedNotice(n).then(setDismissed, () => setDismissed(-1));
  }, [n.id, n.revision]); // eslint-disable-line react-hooks/exhaustive-deps

  const ps = n.pushStatus;
  return (
    <li className={`card flex flex-col gap-3 p-4 transition ${n.active ? '' : 'opacity-75'}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 h-10 w-1.5 shrink-0 rounded-full" style={{ background: t.badge }} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`chip ${t.chip}`}>{t.label}</span>
            <span className="chip bg-ink/5 text-ink/60">{TEMPLATES.find((x) => x.k === n.template)?.label ?? 'Thẻ'}</span>
            <span className="chip bg-ink/5 text-ink/60">
              {AUDIENCE_LABEL[n.audience]}
              {n.audience === 'specific' ? ` (${n.targetUids.length})` : ''}
            </span>
            {n.active ? <span className="chip bg-mint-100 text-mint-500">Đang hiện</span> : <span className="chip bg-ink/5 text-ink/45">{n.shownAt ? 'Đã tắt' : 'Nháp'}</span>}
          </div>
          <h3 className="mt-1 font-black">{n.title.trim() || 'Thông báo từ Cú Học Bài'}</h3>
          <p className="line-clamp-2 whitespace-pre-line text-sm text-ink/60">{n.text}</p>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs font-semibold text-ink/45">
            <span>Tạo {fmtDateTime(n.createdAt)} bởi {n.createdByName || 'admin'}</span>
            {n.shownAt && <span>Hiện gần nhất {fmtDateTime(n.shownAt)}</span>}
            {n.revision > 0 && <span>Đã hiện lại {n.revision} lần</span>}
            <span>{dismissed == null ? 'Đang đếm…' : dismissed < 0 ? '' : `${dismissed} người đã đóng`}</span>
            {n.push && (
              <span>
                Đẩy:{' '}
                {!ps
                  ? 'chưa gửi'
                  : ps.state === 'pending'
                    ? pushConfigured()
                      ? 'đang gửi…'
                      : 'chờ kích hoạt'
                    : ps.state === 'sent'
                      ? `đã gửi ${ps.sent ?? 0} thiết bị${ps.failed ? `, lỗi ${ps.failed}` : ''}`
                      : `lỗi – ${ps.error ?? ''}`}
              </span>
            )}
          </div>
        </div>
        <Switch on={n.active} onChange={onToggle} label={n.active ? 'Tắt thông báo' : 'Bật thông báo'} />
      </div>
      <div className="flex flex-wrap gap-1.5 border-t border-ink/5 pt-3">
        <button className="btn-soft px-3 py-1.5 text-sm" onClick={onReshow}>
          <IconRefresh size={16} /> Hiện lại
        </button>
        {n.push && pushConfigured() && (
          <button className="btn-soft px-3 py-1.5 text-sm" onClick={onResend}>
            <IconMegaphone size={16} /> Gửi đẩy lại
          </button>
        )}
        <button className="btn-ghost px-3 py-1.5 text-sm" onClick={onEdit}>
          <IconEdit size={16} /> Sửa
        </button>
        <button className="btn-ghost px-3 py-1.5 text-sm" onClick={onDuplicate}>
          <IconCopy size={16} /> Nhân bản
        </button>
        <button className="btn-ghost ml-auto px-3 py-1.5 text-sm text-rose-500" onClick={onDelete}>
          <IconTrash size={16} /> Xóa
        </button>
      </div>
    </li>
  );
}

/* ================= Soạn thông báo ================= */

const TONE_OPTIONS: { k: Tone; label: string; cls: string }[] = [
  { k: 'info', label: 'Thông tin', cls: 'bg-sky-100 border-sky-300' },
  { k: 'success', label: 'Tin vui', cls: 'bg-mint-100 border-mint-300' },
  { k: 'warning', label: 'Lưu ý', cls: 'bg-lemon-100 border-lemon-300' },
];

/** Hình minh họa nhỏ cho từng mẫu hiển thị. */
function TemplateThumb({ k, color }: { k: NoticeTemplate; color: string }) {
  const page = <rect x="1" y="1" width="62" height="42" rx="5" fill="#fff" stroke="#E4E0EE" />;
  const lines = (
    <g fill="#EFEBF5">
      <rect x="8" y="30" width="48" height="3" rx="1.5" />
      <rect x="8" y="36" width="34" height="3" rx="1.5" />
    </g>
  );
  return (
    <svg width="64" height="44" viewBox="0 0 64 44" aria-hidden="true">
      {page}
      {k === 'card' && (
        <>
          <rect x="6" y="6" width="52" height="16" rx="4" fill={`${color}33`} stroke={color} />
          <circle cx="13" cy="14" r="4" fill={color} />
          <rect x="20" y="10" width="26" height="3" rx="1.5" fill={color} />
          <rect x="20" y="16" width="32" height="2.5" rx="1.25" fill={`${color}88`} />
          {lines}
        </>
      )}
      {k === 'banner' && (
        <>
          <rect x="6" y="6" width="52" height="7" rx="3.5" fill={color} />
          <rect x="11" y="8.5" width="30" height="2" rx="1" fill="#fff" />
          <g fill="#EFEBF5">
            <rect x="8" y="20" width="48" height="3" rx="1.5" />
            <rect x="8" y="26" width="40" height="3" rx="1.5" />
          </g>
          {lines}
        </>
      )}
      {k === 'celebrate' && (
        <>
          <rect x="6" y="6" width="52" height="20" rx="4" fill={color} />
          {[10, 20, 34, 46, 52, 27].map((x, i) => (
            <rect key={i} x={x} y={8 + (i % 3) * 5} width="2.5" height="4" rx="1" fill={['#FFE27A', '#FFA8BC', '#fff'][i % 3]} transform={`rotate(${i * 30} ${x} ${10 + (i % 3) * 5})`} />
          ))}
          <circle cx="32" cy="16" r="5" fill="#fff" />
          {lines}
        </>
      )}
      {k === 'popup' && (
        <>
          {lines}
          <rect x="1" y="1" width="62" height="42" rx="5" fill="#3B335544" />
          <rect x="18" y="7" width="28" height="30" rx="4" fill="#fff" />
          <rect x="18" y="7" width="28" height="11" rx="4" fill={color} />
          <circle cx="32" cy="18" r="4" fill="#fff" stroke={color} />
          <rect x="23" y="31" width="18" height="3.5" rx="1.75" fill={color} />
        </>
      )}
      {k === 'toast' && (
        <>
          <g fill="#EFEBF5">
            <rect x="8" y="7" width="48" height="3" rx="1.5" />
            <rect x="8" y="13" width="40" height="3" rx="1.5" />
          </g>
          <rect x="30" y="24" width="29" height="14" rx="3" fill="#fff" stroke="#E4E0EE" />
          <rect x="30" y="24" width="2.5" height="14" rx="1" fill={color} />
          <circle cx="37" cy="31" r="3" fill={color} />
          <rect x="42" y="28" width="13" height="2.5" rx="1.25" fill="#3B3355" opacity="0.5" />
          <rect x="42" y="32.5" width="10" height="2" rx="1" fill="#EFEBF5" />
        </>
      )}
    </svg>
  );
}

function NoticeEditor({
  initial,
  isNew,
  onClose,
  onSave,
}: {
  initial: NoticeInput;
  isNew: boolean;
  onClose: () => void;
  onSave: (input: NoticeInput, publish: boolean) => Promise<void>;
}) {
  const [f, setF] = useState<NoticeInput>(initial);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<NoticeInput>) => setF((x) => ({ ...x, ...patch }));
  const color = TONES[f.tone].badge;
  const valid = f.text.trim().length > 0 && (f.audience !== 'specific' || f.targetUids.length > 0);

  const save = async (publish: boolean) => {
    setBusy(true);
    try {
      await onSave({ ...f, title: f.title.trim(), text: f.text.trim() }, publish);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={isNew ? 'Tạo thông báo' : 'Sửa thông báo'} onClose={onClose} wide>
      <div className="flex flex-col gap-5">
        {isNew && (
          <div>
            <span className="label">Mẫu nội dung soạn sẵn</span>
            <div className="flex flex-wrap gap-1.5">
              {CONTENT_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className="chip border border-ink/10 bg-surface px-3 py-1.5 text-sm text-ink/70 hover:border-lilac-300 hover:text-ink"
                  onClick={() => set({ title: p.title, text: p.text, tone: p.tone, template: p.template })}
                >
                  <IconSparkle size={14} /> {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <input className="input font-bold" maxLength={80} placeholder="Tiêu đề (không bắt buộc)" value={f.title} onChange={(e) => set({ title: e.target.value })} />
          <textarea className="input min-h-[90px]" maxLength={500} placeholder="Nội dung thông báo…" value={f.text} onChange={(e) => set({ text: e.target.value })} />
          <div className="text-right text-xs font-semibold text-ink/40">{f.text.length}/500</div>
        </div>

        <div>
          <span className="label">Kiểu thông báo</span>
          <div className="flex flex-wrap gap-2">
            {TONE_OPTIONS.map((t) => (
              <button
                key={t.k}
                type="button"
                onClick={() => set({ tone: t.k })}
                className={`chip border-2 px-3 py-1.5 text-sm text-ink ${t.cls} ${f.tone === t.k ? 'ring-2 ring-ink/40' : 'opacity-70'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="label">Mẫu hiển thị</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {TEMPLATES.map((t) => {
              const active = f.template === t.k;
              return (
                <button
                  key={t.k}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set({ template: t.k })}
                  className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-2 text-center transition ${
                    active ? 'border-lilac-500 bg-lilac-100/60' : 'border-ink/10 bg-surface hover:border-lilac-300'
                  }`}
                >
                  <TemplateThumb k={t.k} color={color} />
                  <span className="text-sm font-extrabold">{t.label}</span>
                  <span className="text-[11px] font-semibold leading-tight text-ink/50">{t.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        <AudiencePicker audience={f.audience} targetUids={f.targetUids} onChange={(audience, targetUids) => set({ audience, targetUids })} />

        <div className="flex flex-col gap-2 rounded-2xl bg-ink/[0.03] p-3">
          <div className="flex items-center gap-3">
            <Switch on={f.sound} onChange={(v) => set({ sound: v })} label="Âm thanh" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-extrabold">Phát âm thanh khi thông báo hiện lên</div>
              <div className="text-xs text-ink/50">Người dùng có thể tự tắt tiếng.</div>
            </div>
            <button type="button" className="btn-soft shrink-0 px-3 py-1.5 text-sm" onClick={() => playChime(f.tone)}>
              <IconVolume size={16} /> Nghe thử
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Switch on={f.push} onChange={(v) => set({ push: v })} label="Thông báo đẩy" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-extrabold">Gửi thông báo đẩy (như thông báo ứng dụng)</div>
              <div className="text-xs text-ink/50">
                {pushConfigured()
                  ? 'Hiện trên máy cả khi đã đóng tab, với những người đã bấm “Bật thông báo”.'
                  : 'Chưa kích hoạt – thông báo sẽ được gửi đẩy ngay khi tính năng được bật.'}
              </div>
            </div>
          </div>
        </div>

        <div>
          <span className="label">Xem trước</span>
          {f.text.trim() ? (
            <NoticeView preview title={f.title} text={f.text} tone={f.tone} template={f.template} onClose={() => {}} />
          ) : (
            <p className="rounded-2xl border-2 border-dashed border-ink/10 p-4 text-center text-sm text-ink/45">Nhập nội dung để xem trước.</p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button className="btn-ghost" onClick={onClose}>
            Hủy
          </button>
          {isNew ? (
            <>
              <button className="btn-soft" disabled={busy || !valid} onClick={() => save(false)}>
                Lưu nháp
              </button>
              <button className="btn-primary" disabled={busy || !valid} onClick={() => save(true)}>
                <IconMegaphone size={18} /> Đăng ngay
              </button>
            </>
          ) : (
            <button className="btn-primary" disabled={busy || !valid} onClick={() => save(false)}>
              Lưu thay đổi
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ================= Chọn đối tượng ================= */

const AUDIENCES: { k: Audience; label: string; hint: string; Icon: typeof IconUser }[] = [
  { k: 'all', label: 'Tất cả', hint: 'Mọi người vào web', Icon: IconGlobe },
  { k: 'users', label: 'Đã đăng nhập', hint: 'Chỉ tài khoản Google', Icon: IconUser },
  { k: 'guests', label: 'Khách', hint: 'Chưa đăng nhập', Icon: IconEye },
  { k: 'specific', label: 'Chỉ định', hint: 'Chọn từng người', Icon: IconUsers },
];

/** Chọn đối tượng nhận thông báo; với “Chỉ định” thì chọn người từ danh sách tài khoản. */
export function AudiencePicker({
  audience,
  targetUids,
  onChange,
}: {
  audience: Audience;
  targetUids: string[];
  onChange: (a: Audience, uids: string[]) => void;
}) {
  const users = useAllUsers(true);
  const [q, setQ] = useState('');
  const accounts = users.data.filter((u) => u.email);
  const guests = users.data.length - accounts.length;
  const byUid = new Map(accounts.map((u) => [u.uid, u]));
  const reach =
    audience === 'all' ? users.data.length : audience === 'users' ? accounts.length : audience === 'guests' ? guests : targetUids.length;
  const matches = q.trim()
    ? accounts.filter((u) => !targetUids.includes(u.uid) && norm(`${u.displayName} ${u.email}`).includes(norm(q))).slice(0, 6)
    : [];

  return (
    <div>
      <span className="label">
        Ai sẽ thấy thông báo? <span className="font-semibold text-ink/45">– khoảng {reach} người</span>
      </span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {AUDIENCES.map((o) => {
          const active = audience === o.k;
          return (
            <button
              key={o.k}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.k, targetUids)}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center transition ${
                active ? 'border-lilac-500 bg-lilac-100/60' : 'border-ink/10 bg-surface hover:border-lilac-300'
              }`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? 'bg-lilac-500 text-white' : 'bg-ink/5 text-ink/60'}`}>
                <o.Icon size={20} />
              </span>
              <span className="text-sm font-extrabold">{o.label}</span>
              <span className="text-xs font-semibold text-ink/50">{o.hint}</span>
            </button>
          );
        })}
      </div>

      {audience === 'specific' && (
        <div className="mt-3 flex flex-col gap-2 rounded-2xl bg-ink/[0.03] p-3">
          <div className="relative">
            <IconSearch size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
            <input className="input py-2 pl-10" placeholder="Tìm tên hoặc email để thêm…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {matches.length > 0 && (
            <ul className="card divide-y divide-ink/5 p-1">
              {matches.map((u) => (
                <li key={u.uid}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-lilac-100/60"
                    onClick={() => {
                      onChange('specific', [...targetUids, u.uid]);
                      setQ('');
                    }}
                  >
                    <Avatar url={u.photoURL || null} name={u.displayName || u.email} size={28} />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      <b>{u.displayName}</b> <span className="text-ink/50">{u.email}</span>
                    </span>
                    <span className="chip bg-lilac-100 text-lilac-500">+ Thêm</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {q.trim() && matches.length === 0 && <p className="px-1 text-xs font-semibold text-ink/45">Không tìm thấy tài khoản phù hợp.</p>}
          {targetUids.length === 0 ? (
            <p className="px-1 text-sm font-semibold text-ink/50">Chưa chọn ai – thông báo sẽ không hiện cho người nào.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {targetUids.map((uid) => {
                const u = byUid.get(uid);
                return (
                  <span key={uid} className="chip gap-1.5 bg-surface py-1 pl-1 pr-1.5 text-sm text-ink shadow-sm">
                    <Avatar url={u?.photoURL || null} name={u?.displayName || u?.email || '?'} size={22} />
                    <span className="max-w-[180px] truncate">{u ? u.email : 'Tài khoản đã xóa'}</span>
                    <button
                      type="button"
                      className="rounded-full p-0.5 text-ink/40 hover:bg-rose-100 hover:text-rose-500"
                      aria-label="Bỏ người này"
                      onClick={() => onChange('specific', targetUids.filter((x) => x !== uid))}
                    >
                      <IconX size={14} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          <p className="px-1 text-xs text-ink/45">Chỉ chọn được người đã có tài khoản. Người được chọn phải đăng nhập mới thấy thông báo.</p>
        </div>
      )}
    </div>
  );
}

