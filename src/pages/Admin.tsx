import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import type { User } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';
import { useAuth } from '../lib/auth';
import { useSite } from '../lib/site';
import {
  banUser,
  grantAdmin,
  isRootEmail,
  logFolderDelete,
  moderateFolder,
  revokeAdmin,
  saveConfig,
  unbanUser,
  useAdminLogs,
  useAdmins,
  useAllFolders,
  useAllUsers,
  useBans,
  ROOT_ADMIN_EMAIL,
  type AppConfig,
  type UserRow,
} from '../lib/admin';
import { deleteFolder, useSharing } from '../lib/folders';
import type { Folder, Visibility } from '../lib/types';
import { LoginPrompt } from '../components/LoginButton';
import NotFound from './NotFound';
import AdminOverview from './AdminOverview';
import QuestionsTab from './AdminQuestions';
import AdminResources from './AdminResources';
import { grantModerator, hideFolder, revokeModerator, unhideFolder, useModerators } from '../lib/moderation';
import Switch from '../components/Switch';
import SkinPicker from '../components/SkinPicker';
import { DEFAULT_MASCOT, MASCOTS, SKINS, mascotFor } from '../lib/skins';
import Modal from '../components/Modal';
import { effective, fmtMax, setUserLimits, syncAllUsage, useAllLimits, useAllUsage, type Limits, type Usage } from '../lib/quota';
import NoticesTab from './AdminNotices';
import { Avatar } from '../components/Navbar';
import VisibilityBadge from '../components/VisibilityBadge';
import { useToast } from '../components/Toast';
import { ChartCard } from '../components/charts';
import {
  IconBan,
  IconChart,
  IconDatabase,
  IconEye,
  IconFolder,
  IconList,
  IconMegaphone,
  IconRefresh,
  IconSearch,
  IconSettings,
  IconShield,
  IconSparkle,
  IconTrash,
  IconUser,
  IconUsers,
  Owl,
  PALETTE,
  TopicIcon,
} from '../icons';

const fmtDate = (t?: Timestamp | Date | null) => {
  if (!t) return '—';
  const d = t instanceof Date ? t : t.toDate();
  return d.toLocaleDateString('vi-VN');
};
const toDate = (t?: Timestamp | Date | null) => (!t ? null : t instanceof Date ? t : t.toDate());
const fmtDateTime = (t?: Timestamp | Date | null) => {
  const d = toDate(t);
  return d ? d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
};
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

export default function Admin() {
  const { user, loading } = useAuth();
  const { role } = useSite();
  if (loading || (user && role.loading)) return <div className="card h-64 animate-pulse bg-surface/60" />;
  if (!user) return <LoginPrompt message="Trang quản trị chỉ dành cho admin và kiểm duyệt viên. Hãy đăng nhập." />;
  if (!role.isModerator) return <NotFound title="Bạn không có quyền truy cập" message="Trang này chỉ dành cho admin và kiểm duyệt viên." />;
  return <AdminShell me={user} />;
}

// adminOnly: kiểm duyệt viên chỉ thấy các tab Câu hỏi & Thư mục.
const TABS = [
  { to: '', label: 'Tổng quan', Icon: IconChart, adminOnly: true },
  { to: 'resources', label: 'Tài nguyên', Icon: IconDatabase, adminOnly: true },
  { to: 'users', label: 'Người dùng', Icon: IconUsers, adminOnly: true },
  { to: 'questions', label: 'Câu hỏi', Icon: IconShield, adminOnly: false },
  { to: 'folders', label: 'Thư mục', Icon: IconFolder, adminOnly: false },
  { to: 'notices', label: 'Thông báo', Icon: IconMegaphone, adminOnly: true },
  { to: 'settings', label: 'Cài đặt', Icon: IconSettings, adminOnly: true },
  { to: 'logs', label: 'Nhật ký', Icon: IconList, adminOnly: true },
];

function AdminShell({ me }: { me: User }) {
  const { role } = useSite();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lilac-500 text-white shadow-soft">
          <IconShield size={26} />
        </span>
        <div>
          <h1 className="text-2xl font-black">{role.isAdmin ? 'Quản trị' : 'Kiểm duyệt'}</h1>
          <p className="text-sm font-semibold text-ink/55">
            {me.displayName} · <span className="text-lilac-500">{role.isRoot ? 'Admin gốc' : role.isAdmin ? 'Admin' : 'Kiểm duyệt viên'}</span>
          </p>
        </div>
      </div>
      <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1">
        {TABS.filter((t) => role.isAdmin || !t.adminOnly).map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end
            className={({ isActive }) =>
              `btn shrink-0 px-3 py-2 text-sm ${isActive ? 'bg-lilac-500 text-white shadow-[0_3px_0_0_rgb(var(--primary-shadow))]' : 'bg-surface text-ink/60 hover:text-ink'}`
            }
          >
            <t.Icon size={18} /> {t.label}
          </NavLink>
        ))}
      </nav>
      <Routes>
        <Route path="questions" element={<QuestionsTab me={me} />} />
        <Route path="folders" element={<FoldersTab me={me} />} />
        {role.isAdmin ? (
          <>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<UsersTab me={me} />} />
            <Route path="notices" element={<NoticesTab me={me} />} />
            <Route path="settings" element={<SettingsTab me={me} />} />
            <Route path="logs" element={<LogsTab />} />
            <Route path="resources" element={<AdminResources />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="questions" replace />} />
        )}
      </Routes>
    </div>
  );
}

/* ================= Người dùng ================= */

type UserFilter = 'accounts' | 'admins' | 'mods' | 'banned' | 'guests';

function UsersTab({ me }: { me: User }) {
  const toast = useToast();
  const users = useAllUsers(true);
  const admins = useAdmins(true);
  const bans = useBans(true);
  const mods = useModerators(true);
  const limits = useAllLimits(true);
  const usage = useAllUsage(true);
  const allFolders = useAllFolders(true);
  const { config } = useSite();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<UserFilter>('accounts');
  const [busy, setBusy] = useState<string | null>(null);
  const [limitFor, setLimitFor] = useState<UserRow | null>(null);

  const adminSet = new Set(admins.data.map((a) => a.uid));
  const banMap = new Map(bans.data.map((b) => [b.uid, b]));
  const isAdminRow = (u: UserRow) => adminSet.has(u.uid) || isRootEmail(u.email);

  const rows = users.data
    .filter((u) => {
      if (filter === 'guests') return !u.email;
      if (!u.email) return false;
      if (filter === 'admins') return isAdminRow(u);
      if (filter === 'mods') return mods.has(u.uid) && !isAdminRow(u);
      if (filter === 'banned') return banMap.has(u.uid);
      return true;
    })
    .filter((u) => !q || norm(`${u.displayName} ${u.email}`).includes(norm(q)))
    .sort((a, b) => (toDate(b.lastLoginAt)?.getTime() ?? 0) - (toDate(a.lastLoginAt)?.getTime() ?? 0));

  const run = async (key: string, fn: () => Promise<void>, ok: string) => {
    setBusy(key);
    try {
      await fn();
      toast(ok);
    } catch (e) {
      console.error(e);
      toast('Không thực hiện được', 'error');
    } finally {
      setBusy(null);
    }
  };

  const counts = {
    accounts: users.data.filter((u) => u.email).length,
    admins: users.data.filter((u) => u.email && isAdminRow(u)).length,
    mods: users.data.filter((u) => u.email && mods.has(u.uid) && !isAdminRow(u)).length,
    banned: bans.data.length,
    guests: users.data.filter((u) => !u.email).length,
  };
  const FILTERS: [UserFilter, string][] = [
    ['accounts', 'Tài khoản'],
    ['admins', 'Admin'],
    ['mods', 'Kiểm duyệt'],
    ['banned', 'Bị khóa'],
    ['guests', 'Khách'],
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`chip px-3 py-1.5 text-sm ${filter === k ? 'bg-ink text-cream' : 'bg-surface text-ink/60 hover:text-ink'}`}
            >
              {label} <span className="opacity-60">{counts[k]}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            className="btn-soft shrink-0 px-3 py-2 text-sm"
            title="Tính lại số thư mục / câu hỏi đã dùng của mọi người từ dữ liệu thực tế"
            disabled={busy === 'sync' || allFolders.loading}
            onClick={() =>
              run('sync', async () => {
                await syncAllUsage(me, allFolders.data, users.data.filter((u) => u.email).map((u) => u.uid));
              }, 'Đã đồng bộ bộ đếm hạn mức')
            }
          >
            <IconRefresh size={16} /> Đồng bộ hạn mức
          </button>
          <label className="relative min-w-0 flex-1 sm:w-64">
            <IconSearch size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
            <input className="input py-2 pl-10" placeholder="Tìm tên, email…" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
        </div>
      </div>

      {!users.loading && users.data.some((u) => u.email && !usage.has(u.uid)) && (
        <div className="rounded-2xl border-2 border-dashed border-peach-300/70 bg-peach-100/50 px-4 py-3 text-sm font-bold text-ink/70">
          {users.data.filter((u) => u.email && !usage.has(u.uid)).length} tài khoản chưa có bộ đếm hạn mức (dữ liệu tạo trước khi có tính
          năng này). Bấm <b>Đồng bộ hạn mức</b> để tính lại từ dữ liệu thực tế.
        </div>
      )}

      <div className="card divide-y divide-ink/5">
        {users.loading ? (
          <div className="h-40 animate-pulse" />
        ) : users.error ? (
          <p className="p-4 text-sm font-bold text-rose-500">{users.error}</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-ink/50">Không có người dùng nào.</p>
        ) : (
          rows.map((u) => {
            const root = isRootEmail(u.email);
            const admin = isAdminRow(u);
            const ban = banMap.get(u.uid);
            const self = u.uid === me.uid;
            const guest = !u.email;
            return (
              <div key={u.uid} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {guest ? (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lilac-100">
                      <Owl size={30} />
                    </span>
                  ) : (
                    <Avatar url={u.photoURL || null} name={u.displayName || u.email} size={36} />
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate font-extrabold">{guest ? 'Khách ẩn danh' : u.displayName || '(chưa đặt tên)'}</span>
                      {root ? (
                        <span className="chip bg-lilac-500 text-white">Admin gốc</span>
                      ) : admin ? (
                        <span className="chip bg-lilac-100 text-lilac-500">Admin</span>
                      ) : guest ? (
                        <span className="chip bg-ink/5 text-ink/50">Khách</span>
                      ) : (
                        mods.has(u.uid) ? (
                          <span className="chip bg-sky-100 text-sky-500">Kiểm duyệt viên</span>
                        ) : (
                          <span className="chip bg-ink/5 text-ink/60">User</span>
                        )
                      )}
                      {ban && (
                        <span className="chip bg-rose-100 text-rose-500" title={ban.reason}>
                          Bị khóa
                        </span>
                      )}
                      {self && <span className="chip bg-mint-100 text-mint-500">Bạn</span>}
                    </div>
                    <div className="break-words text-xs font-semibold text-ink/50">
                      {guest ? u.uid.slice(0, 10) + '…' : u.email} · tham gia {fmtDateTime(u.createdAt)} · gần nhất {fmtDateTime(u.lastLoginAt)}
                    </div>
                    {!guest && (
                      <UsageLine
                        admin={admin}
                        usage={usage.get(u.uid)}
                        maxFolders={effective(limits.get(u.uid)?.maxFolders, config.defaultMaxFolders)}
                        maxQuestions={effective(limits.get(u.uid)?.maxQuestions, config.defaultMaxQuestions)}
                        custom={(limits.get(u.uid)?.maxFolders ?? -1) >= 0 || (limits.get(u.uid)?.maxQuestions ?? -1) >= 0}
                      />
                    )}
                  </div>
                </div>
                {!guest && !admin && (
                  <button className="btn-soft shrink-0 px-3 py-1.5 text-sm" onClick={() => setLimitFor(u)}>
                    <IconFolder size={16} /> Hạn mức
                  </button>
                )}
                {!guest && !root && !self && (
                  <div className="flex shrink-0 gap-1.5 sm:justify-end">
                    {admin ? (
                      <button
                        className="btn-soft px-3 py-1.5 text-sm"
                        disabled={busy === u.uid}
                        onClick={() =>
                          confirm(`Thu hồi quyền admin của ${u.email}?`) &&
                          run(u.uid, () => revokeAdmin(me, u), 'Đã thu hồi quyền admin')
                        }
                      >
                        <IconUser size={16} /> Hạ về User
                      </button>
                    ) : (
                      <>
                        <button
                          className="btn-soft px-3 py-1.5 text-sm"
                          disabled={busy === u.uid || !!ban}
                          onClick={() =>
                            confirm(`Cấp quyền ADMIN cho ${u.email}? Người này sẽ quản lý được toàn bộ hệ thống.`) &&
                            run(u.uid, () => grantAdmin(me, u), 'Đã cấp quyền admin')
                          }
                        >
                          <IconShield size={16} /> Cấp admin
                        </button>
                        {mods.has(u.uid) ? (
                          <button
                            className="btn-soft px-3 py-1.5 text-sm"
                            disabled={busy === u.uid}
                            onClick={() =>
                              confirm(`Thu hồi quyền kiểm duyệt của ${u.email}?`) &&
                              run(u.uid, () => revokeModerator(me, u), 'Đã thu hồi quyền kiểm duyệt')
                            }
                          >
                            Bỏ kiểm duyệt
                          </button>
                        ) : (
                          <button
                            className="btn-soft px-3 py-1.5 text-sm"
                            disabled={busy === u.uid || !!ban}
                            onClick={() =>
                              confirm(`Cấp quyền KIỂM DUYỆT cho ${u.email}? Người này xem được mọi thư mục / câu hỏi và có thể ẩn hoặc xóa câu hỏi.`) &&
                              run(u.uid, () => grantModerator(me, u), 'Đã cấp quyền kiểm duyệt')
                            }
                          >
                            <IconEye size={16} /> Cấp kiểm duyệt
                          </button>
                        )}
                        {ban ? (
                          <button className="btn-soft px-3 py-1.5 text-sm" disabled={busy === u.uid} onClick={() => run(u.uid, () => unbanUser(me, u), 'Đã mở khóa')}>
                            Mở khóa
                          </button>
                        ) : (
                          <button
                            className="btn-danger px-3 py-1.5 text-sm"
                            disabled={busy === u.uid}
                            onClick={() => {
                              const reason = prompt(`Khóa quyền tạo / sửa nội dung của ${u.email}?\nLý do (không bắt buộc):`);
                              if (reason !== null) run(u.uid, () => banUser(me, u, reason.trim()), 'Đã khóa tài khoản');
                            }}
                          >
                            <IconBan size={16} /> Khóa
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      {limitFor && (
        <LimitDialog
          user={limitFor}
          current={limits.get(limitFor.uid)}
          onClose={() => setLimitFor(null)}
          onSave={(l) =>
            run(limitFor.uid, async () => {
              await setUserLimits(me, limitFor, l);
              setLimitFor(null);
            }, 'Đã lưu hạn mức')
          }
        />
      )}
      <p className="text-xs font-semibold text-ink/45">
        Mặc định mỗi người được tạo {fmtMax(config.defaultMaxFolders)} thư mục và {fmtMax(config.defaultMaxQuestions)} câu hỏi (đổi ở tab Cài
        đặt). Admin không bị giới hạn. Người dùng mới đăng ký luôn là <b>User</b>. Chỉ admin mới cấp được quyền admin. Admin gốc ({ROOT_ADMIN_EMAIL}) không thể bị thu hồi.
        Tài khoản bị khóa vẫn học được nhưng không tạo / sửa được thư mục và câu hỏi.
      </p>
    </div>
  );
}

/** Dòng "đã dùng / hạn mức" nhỏ dưới mỗi người dùng. */
function UsageLine({ admin, usage, maxFolders, maxQuestions, custom }: { admin: boolean; usage?: Usage; maxFolders: number; maxQuestions: number; custom: boolean }) {
  if (admin) return <div className="mt-1 text-xs font-bold text-lilac-500">Không giới hạn (admin)</div>;
  const bar = (used: number, max: number, label: string) => {
    const pct = max === 0 ? 0 : Math.min(100, (used / max) * 100);
    const full = max !== 0 && used >= max;
    return (
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-14 overflow-hidden rounded-full bg-ink/10">
          <span className={`block h-full rounded-full ${full ? 'bg-peach-500' : 'bg-lilac-500'}`} style={{ width: max === 0 ? '100%' : `${pct}%`, opacity: max === 0 ? 0.25 : 1 }} />
        </span>
        <span className={full ? 'text-peach-500' : ''}>
          {used}/{fmtMax(max)} {label}
        </span>
      </span>
    );
  };
  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-ink/55">
      {bar(Math.max(0, usage?.folders ?? 0), maxFolders, 'thư mục')}
      {bar(Math.max(0, usage?.questions ?? 0), maxQuestions, 'câu')}
      {custom && <span className="chip bg-lemon-100 text-lemonink">riêng</span>}
    </div>
  );
}

/** Đặt hạn mức riêng cho 1 người: "theo mặc định", "không giới hạn" hoặc 1 con số. */
function LimitDialog({ user, current, onClose, onSave }: { user: UserRow; current?: Limits; onClose: () => void; onSave: (l: Required<Limits>) => void }) {
  const { config } = useSite();
  type Mode = 'default' | 'unlimited' | 'custom';
  const init = (v: number | undefined, def: number): [Mode, number] =>
    v == null || v < 0 ? ['default', def] : v === 0 ? ['unlimited', def] : ['custom', v];
  const [fm, setFm] = useState(init(current?.maxFolders, config.defaultMaxFolders));
  const [qm, setQm] = useState(init(current?.maxQuestions, config.defaultMaxQuestions));
  const value = ([m, n]: [Mode, number]) => (m === 'default' ? -1 : m === 'unlimited' ? 0 : Math.max(1, Math.floor(n) || 1));

  const row = (label: string, def: number, [m, n]: [Mode, number], set: (v: [Mode, number]) => void) => (
    <div>
      <span className="label">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ['default', `Mặc định (${fmtMax(def)})`],
            ['unlimited', 'Không giới hạn'],
            ['custom', 'Tùy chỉnh'],
          ] as [Mode, string][]
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => set([k, n])}
            className={`chip border-2 px-3 py-1.5 text-sm ${m === k ? 'border-lilac-500 bg-lilac-100 text-ink' : 'border-ink/10 bg-surface text-ink/60'}`}
          >
            {l}
          </button>
        ))}
        {m === 'custom' && (
          <input type="number" min={1} className="input w-28 py-1.5 font-bold" value={n} onChange={(e) => set(['custom', Number(e.target.value)])} />
        )}
      </div>
    </div>
  );

  return (
    <Modal title="Hạn mức của người dùng" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-2xl bg-ink/[0.03] p-3">
          <Avatar url={user.photoURL || null} name={user.displayName || user.email} size={36} />
          <div className="min-w-0">
            <div className="truncate font-extrabold">{user.displayName}</div>
            <div className="truncate text-xs text-ink/50">{user.email}</div>
          </div>
        </div>
        {row('Số thư mục tối đa', config.defaultMaxFolders, fm, setFm)}
        {row('Tổng số câu hỏi tối đa', config.defaultMaxQuestions, qm, setQm)}
        <p className="text-xs text-ink/50">
          Giảm hạn mức xuống thấp hơn số đã dùng sẽ không xóa dữ liệu cũ, chỉ chặn tạo thêm.
        </p>
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Hủy
          </button>
          <button className="btn-primary" onClick={() => onSave({ maxFolders: value(fm), maxQuestions: value(qm) })}>
            Lưu hạn mức
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ================= Thư mục ================= */

function FoldersTab({ me }: { me: User }) {
  const toast = useToast();
  const { role } = useSite();
  const folders = useAllFolders(true);
  const users = useAllUsers(role.isAdmin); // kiểm duyệt viên không đọc danh sách người dùng
  const [q, setQ] = useState('');
  const [vis, setVis] = useState<Visibility | 'all' | 'featured' | 'hidden'>('all');

  const emailOf = new Map(users.data.map((u) => [u.uid, u.email || u.displayName]));
  const rows = folders.data
    .filter((f) => (vis === 'all' ? true : vis === 'featured' ? f.featured : vis === 'hidden' ? f.hidden : f.visibility === vis))
    .filter((f) => !q || norm(`${f.name} ${f.ownerName} ${emailOf.get(f.ownerId) ?? ''}`).includes(norm(q)));

  const act = async (fn: () => Promise<void>, ok: string) => {
    try {
      await fn();
      toast(ok);
    } catch (e) {
      console.error(e);
      toast('Không thực hiện được', 'error');
    }
  };

  const FILTERS: [typeof vis, string][] = [
    ['all', 'Tất cả'],
    ['public', 'Công khai'],
    ['link', 'Có link'],
    ['private', 'Riêng tư'],
    ['featured', 'Nổi bật'],
    ['hidden', 'Bị ẩn'],
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(([k, label]) => (
            <button
              key={k}
              onClick={() => setVis(k)}
              className={`chip px-3 py-1.5 text-sm ${vis === k ? 'bg-ink text-cream' : 'bg-surface text-ink/60 hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="relative sm:w-64">
          <IconSearch size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
          <input className="input py-2 pl-10" placeholder="Tìm thư mục, chủ sở hữu…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      <div className="card divide-y divide-ink/5">
        {folders.loading ? (
          <div className="h-40 animate-pulse" />
        ) : folders.error ? (
          <p className="p-4 text-sm font-bold text-rose-500">{folders.error}</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-ink/50">Không có thư mục nào.</p>
        ) : (
          rows.map((f: Folder) => (
            <div key={f.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: PALETTE[f.color]?.light }}>
                  <TopicIcon name={f.icon} color={f.color} size={26} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link to={`/f/${f.id}`} className="truncate font-extrabold hover:text-lilac-500">
                      {f.name}
                    </Link>
                    <VisibilityBadge visibility={f.visibility} />
                    {f.featured && <span className="chip bg-lemon-100 text-lemonink">Nổi bật</span>}
                    {f.hidden && (
                      <span className="chip bg-peach-500 text-white" title={f.hiddenReason}>
                        Bị ẩn{f.hiddenReason ? `: ${f.hiddenReason}` : ''}
                      </span>
                    )}
                  </div>
                  <div className="truncate text-xs font-semibold text-ink/50">
                    {emailOf.get(f.ownerId) ?? f.ownerName ?? f.ownerId} · {f.questionCount} câu · cập nhật {fmtDate(f.updatedAt)}
                  </div>
                  {role.isAdmin && <InvitedPeek folder={f} />}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-1.5">
                {f.hidden ? (
                  <button className="btn-soft px-3 py-1.5 text-sm" onClick={() => act(() => unhideFolder(me, f), 'Đã bỏ ẩn – chủ thư mục có thể công khai lại')}>
                    <IconEye size={16} /> Bỏ ẩn
                  </button>
                ) : (
                  <button
                    className="btn-soft px-3 py-1.5 text-sm"
                    onClick={() => {
                      const reason = prompt(`Ẩn “${f.name}”? Thư mục sẽ chuyển về Riêng tư và chủ không tự công khai lại được.\nLý do:`, 'Nội dung không phù hợp');
                      if (reason !== null) act(() => hideFolder(me, f, reason.trim()), 'Đã ẩn thư mục');
                    }}
                  >
                    <IconBan size={16} /> Ẩn
                  </button>
                )}
                {role.isAdmin && f.visibility === 'public' && (
                  <button
                    className="btn-soft px-3 py-1.5 text-sm"
                    onClick={() =>
                      act(
                        () => moderateFolder(me, f, { featured: !f.featured }, f.featured ? 'Bỏ nổi bật' : 'Đánh dấu nổi bật'),
                        f.featured ? 'Đã bỏ nổi bật' : 'Đã đưa lên Nổi bật',
                      )
                    }
                  >
                    <IconSparkle size={16} /> {f.featured ? 'Bỏ nổi bật' : 'Nổi bật'}
                  </button>
                )}
                {f.visibility !== 'private' && (
                  <button
                    className="btn-soft px-3 py-1.5 text-sm"
                    onClick={() =>
                      confirm(`Chuyển “${f.name}” về Riêng tư? Người khác sẽ không xem được qua link / Khám phá.`) &&
                      act(() => moderateFolder(me, f, { visibility: 'private', featured: false }, 'Gỡ công khai'), 'Đã chuyển về riêng tư')
                    }
                  >
                    Gỡ công khai
                  </button>
                )}
                {role.isAdmin && <button
                  className="btn-danger px-3 py-1.5 text-sm"
                  onClick={() =>
                    confirm(`XÓA vĩnh viễn “${f.name}” và ${f.questionCount} câu hỏi? Không thể hoàn tác.`) &&
                    act(async () => {
                      await deleteFolder(f);
                      await logFolderDelete(me, f);
                    }, 'Đã xóa thư mục')
                  }
                >
                  <IconTrash size={16} />
                </button>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/** Admin xem email thật của người được mời (thư mục chỉ lưu mã băm; email nằm ở tài liệu riêng chỉ chủ / admin đọc). */
function InvitedPeek({ folder }: { folder: Folder }) {
  const [open, setOpen] = useState(false);
  const n = (folder.viewerKeys?.length ?? 0) + (folder.editorKeys?.length ?? 0);
  if (!n) return null;
  return (
    <div className="mt-1">
      <button className="text-xs font-extrabold text-lilac-500 hover:underline" onClick={() => setOpen((o) => !o)}>
        <IconUsers size={13} className="mr-1 inline" />
        Người được mời ({n}) {open ? '▲' : '▼'}
      </button>
      {open && <InvitedList folderId={folder.id} />}
    </div>
  );
}

function InvitedList({ folderId }: { folderId: string }) {
  const s = useSharing(folderId);
  const rows = [
    ...s.editorEmails.map((e) => ({ e, r: 'Sửa' })),
    ...s.viewerEmails.map((e) => ({ e, r: 'Xem' })),
  ];
  return (
    <ul className="mt-1 flex flex-wrap gap-1.5">
      {rows.map((x) => (
        <li key={x.e} className="chip bg-ink/5 text-ink/70">
          {x.e} <span className="text-ink/40">· {x.r}</span>
        </li>
      ))}
    </ul>
  );
}

/* ================= Cài đặt ================= */

function SettingsTab({ me }: { me: User }) {
  const { config } = useSite();
  const toast = useToast();
  const [form, setForm] = useState<AppConfig>(config);
  const [busy, setBusy] = useState(false);
  useEffect(() => setForm(config), [config]);
  const dirty = JSON.stringify(form) !== JSON.stringify(config);

  return (
    <div className="flex flex-col gap-4">
      <section className="card flex items-center justify-between gap-3 p-5">
        <div>
          <h3 className="flex items-center gap-2 font-black">
            <IconSettings size={18} className="text-peach-500" /> Chế độ bảo trì
          </h3>
          <p className="text-sm text-ink/55">
            Khi bật, người dùng thường chỉ học được, <b>không tạo / sửa</b> thư mục và câu hỏi. Admin vẫn sửa bình thường. Được kiểm tra ở cả
            luật bảo mật của database.
          </p>
        </div>
        <Switch on={form.readOnly} onChange={(v) => setForm((f) => ({ ...f, readOnly: v }))} label="Chế độ bảo trì" />
      </section>

      <section className="card flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-black">Mục tiêu mặc định mỗi ngày</h3>
          <p className="text-sm text-ink/55">Áp dụng cho người chưa tự chọn mục tiêu ở trang Thống kê.</p>
        </div>
        <select
          className="input w-auto pr-8 font-bold"
          value={form.defaultDailyGoal}
          onChange={(e) => setForm((f) => ({ ...f, defaultDailyGoal: Number(e.target.value) }))}
        >
          {[10, 20, 30, 50, 100].map((g) => (
            <option key={g} value={g}>
              {g} câu / ngày
            </option>
          ))}
        </select>
      </section>

      <section className="card flex flex-col gap-4 p-5">
        <div>
          <h3 className="flex items-center gap-2 font-black">
            <IconSparkle size={18} className="text-lilac-500" /> Theme giao diện
          </h3>
          <p className="text-sm text-ink/55">Đổi màu chủ đạo, nền và chú cú trên toàn web. Áp dụng ngay cho mọi người sau khi lưu.</p>
        </div>
        <SkinPicker
          value={form.defaultSkin}
          names={form.skinNames}
          onChange={(id) => id && setForm((f) => ({ ...f, defaultSkin: id as AppConfig['defaultSkin'] }))}
        />
        <div>
          <span className="label">Tên & kiểu chú cú của từng theme</span>
          <p className="mb-2 text-xs text-ink/50">
            Tên hiện ở logo, chân trang và tiêu đề tab (để trống = tên gốc). Kiểu cú dùng chung được giữa các theme – màu cú luôn theo màu theme.
          </p>
          <div className="flex flex-col gap-2">
            {SKINS.map((sk) => {
              const current = mascotFor(sk.id, form.skinMascots);
              return (
                <div key={sk.id} className="flex flex-col gap-2 rounded-2xl border border-ink/10 p-3 lg:flex-row lg:items-center">
                  <label className="flex items-center gap-2 lg:w-64">
                    <span className="h-4 w-4 shrink-0 rounded-full" style={{ background: sk.swatch[0] }} />
                    <input
                      className="input py-2 text-sm font-bold"
                      maxLength={30}
                      placeholder={sk.name}
                      value={form.skinNames[sk.id] ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, skinNames: { ...f.skinNames, [sk.id]: e.target.value } }))}
                    />
                  </label>
                  <div
                    className="flex flex-wrap gap-1.5"
                    role="radiogroup"
                    aria-label={`Kiểu cú cho ${sk.name}`}
                    style={{ '--owl-body': sk.owl[0], '--owl-wing': sk.owl[1], '--owl-belly': sk.owl[2] } as React.CSSProperties}
                  >
                    {MASCOTS.map((m) => {
                      const active = current === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          title={m.label + (DEFAULT_MASCOT[sk.id] === m.id ? ' (mặc định của theme)' : '')}
                          onClick={() => setForm((f) => ({ ...f, skinMascots: { ...f.skinMascots, [sk.id]: m.id } }))}
                          className={`relative rounded-xl border-2 p-0.5 transition ${active ? 'border-lilac-500 bg-lilac-100/60' : 'border-transparent hover:border-lilac-300'}`}
                        >
                          <Owl size={40} mascot={m.id} />
                          {DEFAULT_MASCOT[sk.id] === m.id && <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-ink/30" />}
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs font-semibold text-ink/45 lg:ml-auto">{MASCOTS.find((m) => m.id === current)?.label}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-ink/[0.03] p-3">
          <Switch on={form.allowUserSkin} onChange={(v) => setForm((f) => ({ ...f, allowUserSkin: v }))} label="Cho người dùng tự chọn theme" />
          <div>
            <div className="text-sm font-extrabold">Cho phép người dùng tự chọn theme riêng</div>
            <div className="text-xs text-ink/50">Khi tắt, mọi người đều dùng theme mặc định ở trên.</div>
          </div>
        </div>
      </section>

      <section className="card flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-black">Cách làm bài mặc định</h3>
          <p className="text-sm text-ink/55">Áp dụng cho người chưa tự chọn trong trang Cài đặt cá nhân.</p>
        </div>
        <div className="flex rounded-2xl bg-ink/5 p-1">
          {(
            [
              ['one', 'Từng câu'],
              ['all', 'Cả bài'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              aria-pressed={form.defaultStudyLayout === k}
              onClick={() => setForm((f) => ({ ...f, defaultStudyLayout: k }))}
              className={`rounded-xl px-4 py-1.5 text-sm font-extrabold transition ${form.defaultStudyLayout === k ? 'bg-surface text-ink shadow-soft' : 'text-ink/55'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="card flex flex-col gap-3 p-5">
        <div>
          <h3 className="flex items-center gap-2 font-black">
            <IconFolder size={18} className="text-lilac-500" /> Hạn mức mặc định cho người dùng
          </h3>
          <p className="text-sm text-ink/55">
            Áp dụng cho mọi người (kể cả người mới đăng ký) trừ khi admin đặt hạn mức riêng ở tab Người dùng. Nhập 0 = không giới hạn.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="label">Số thư mục tối đa</span>
            <input
              type="number"
              min={0}
              className="input font-bold"
              value={form.defaultMaxFolders}
              onChange={(e) => setForm((f) => ({ ...f, defaultMaxFolders: Math.max(0, Math.floor(Number(e.target.value)) || 0) }))}
            />
          </label>
          <label>
            <span className="label">Tổng số câu hỏi tối đa</span>
            <input
              type="number"
              min={0}
              className="input font-bold"
              value={form.defaultMaxQuestions}
              onChange={(e) => setForm((f) => ({ ...f, defaultMaxQuestions: Math.max(0, Math.floor(Number(e.target.value)) || 0) }))}
            />
          </label>
        </div>
      </section>

      <p className="text-sm font-semibold text-ink/50">
        Thông báo chung đã chuyển sang tab <Link to="/admin/notices" className="font-extrabold text-lilac-500 underline">Thông báo</Link>.
      </p>

      <div className="sticky bottom-4 flex justify-end gap-2">
        {dirty && (
          <button className="btn-soft" onClick={() => setForm(config)}>
            Hoàn tác
          </button>
        )}
        <button
          className="btn-primary"
          disabled={!dirty || busy}
          onClick={async () => {
            setBusy(true);
            try {
              await saveConfig(me, form);
              toast('Đã lưu cài đặt');
            } catch (e) {
              console.error(e);
              toast('Không lưu được', 'error');
            } finally {
              setBusy(false);
            }
          }}
        >
          Lưu cài đặt
        </button>
      </div>
    </div>
  );
}

/* ================= Nhật ký ================= */

function LogsTab() {
  const logs = useAdminLogs(true);
  return (
    <ChartCard
      title="Nhật ký quản trị"
      subtitle="100 thao tác gần nhất của các admin"
      table={{ head: ['Thời gian', 'Admin', 'Thao tác', 'Đối tượng'], rows: logs.data.map((l) => [fmtDateTime(l.at), l.byName, l.action, l.target]) }}
    >
      {logs.loading ? (
        <div className="h-32 animate-pulse" />
      ) : logs.data.length === 0 ? (
        <p className="text-sm text-ink/50">Chưa có thao tác nào.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {logs.data.map((l) => (
            <li key={l.id} className="flex items-start gap-3 rounded-2xl bg-ink/[0.03] px-3 py-2">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-lilac-500" />
              <div className="min-w-0 flex-1 text-sm">
                <b>{l.byName}</b> · {l.action} <span className="font-bold text-ink/70">{l.target}</span>
                <div className="text-xs font-semibold text-ink/45">{fmtDateTime(l.at)}</div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </ChartCard>
  );
}
