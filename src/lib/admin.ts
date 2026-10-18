import { useEffect, useState } from 'react';
import {
  collection,
  collectionGroup,
  doc,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  type Timestamp,
} from 'firebase/firestore';
import { addDoc, deleteDoc, getCountFromServer, onSnapshot, setDoc, updateDoc } from './fs'; // có đếm quota ước tính
import type { User } from 'firebase/auth';
import { db } from './firebase';
import { addDays, dayKey, type DayStat, type Session } from './stats';
import { SKINS, type SkinId, type SkinMascots, type SkinNames } from './skins';
import type { Folder } from './types';

/** Admin gốc – phải trùng với isRootAdmin() trong firestore.rules. */
export const ROOT_ADMIN_EMAIL = 'thagvip1@gmail.com';

export const isRootEmail = (email: string | null | undefined) => (email ?? '').toLowerCase() === ROOT_ADMIN_EMAIL;

/* ---------------- Cấu hình chung (ai cũng đọc) ---------------- */

export type Tone = 'info' | 'success' | 'warning';

/** Ai thấy thông báo: tất cả / đã đăng nhập Google / khách chưa đăng nhập / người được chỉ định. */
export type Audience = 'all' | 'users' | 'guests' | 'specific';

export interface AppConfig {
  readOnly: boolean;
  defaultDailyGoal: number;
  /** Hạn mức mặc định cho người dùng (0 = không giới hạn). */
  defaultMaxFolders: number;
  defaultMaxQuestions: number;
  /** Cách làm bài mặc định: từng câu hoặc cả bài trên 1 trang. */
  defaultStudyLayout: StudyLayout;
  /** Theme mặc định cho cả web và có cho người dùng tự chọn theme riêng hay không. */
  defaultSkin: SkinId;
  allowUserSkin: boolean;
  /** Tên hiển thị tùy chỉnh của từng theme (hiện ở logo, chân trang, tiêu đề tab). */
  skinNames: SkinNames;
  /** Kiểu chú cú dùng cho từng theme (màu cú vẫn theo theme). */
  skinMascots: SkinMascots;
  /** Có đếm ước tính lượt đọc / ghi / xóa Firestore hay không (tốn ~1 lượt ghi / người / 10 phút). */
  quotaTracking: boolean;
}

export type StudyLayout = 'one' | 'all';

export const DEFAULT_CONFIG: AppConfig = {
  readOnly: false,
  defaultDailyGoal: 20,
  defaultMaxFolders: 5,
  defaultMaxQuestions: 100,
  defaultStudyLayout: 'one',
  defaultSkin: 'owl',
  allowUserSkin: false,
  skinNames: {},
  skinMascots: {},
  quotaTracking: true,
};

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);
  useEffect(
    () =>
      onSnapshot(
        doc(db, 'config', 'app'),
        (snap) => {
          const d = (snap.data() ?? {}) as Partial<AppConfig>;
          setConfig({
            readOnly: d.readOnly ?? DEFAULT_CONFIG.readOnly,
            defaultDailyGoal: d.defaultDailyGoal ?? DEFAULT_CONFIG.defaultDailyGoal,
            defaultMaxFolders: d.defaultMaxFolders ?? DEFAULT_CONFIG.defaultMaxFolders,
            defaultMaxQuestions: d.defaultMaxQuestions ?? DEFAULT_CONFIG.defaultMaxQuestions,
            defaultStudyLayout: d.defaultStudyLayout === 'all' ? 'all' : 'one',
            defaultSkin: SKINS.some((x) => x.id === d.defaultSkin) ? (d.defaultSkin as SkinId) : 'owl',
            allowUserSkin: d.allowUserSkin === true,
            skinNames: (d.skinNames && typeof d.skinNames === 'object' ? d.skinNames : {}) as SkinNames,
            skinMascots: (d.skinMascots && typeof d.skinMascots === 'object' ? d.skinMascots : {}) as SkinMascots,
            quotaTracking: d.quotaTracking !== false,
          });
          setLoaded(true);
        },
        (e) => {
          console.error(e);
          setLoaded(true);
        },
      ),
    [],
  );
  return { config, loaded };
}

/* ---------------- Vai trò của người đang đăng nhập ---------------- */

export interface RoleState {
  isAdmin: boolean;
  /** Kiểm duyệt viên (admin cũng tính là có quyền kiểm duyệt). */
  isModerator: boolean;
  isRoot: boolean;
  banned: boolean;
  loading: boolean;
}

export function useMyRole(user: User | null): RoleState {
  const [state, setState] = useState<RoleState>({ isAdmin: false, isModerator: false, isRoot: false, banned: false, loading: true });
  useEffect(() => {
    if (!user) {
      setState({ isAdmin: false, isModerator: false, isRoot: false, banned: false, loading: false });
      return;
    }
    const root = isRootEmail(user.email) && user.emailVerified;
    let admin = root;
    let mod = false;
    let banned = false;
    let pending = 3;
    const push = () => setState({ isAdmin: admin, isModerator: admin || mod, isRoot: root, banned, loading: pending > 0 });
    const done = () => {
      pending = Math.max(0, pending - 1);
      push();
    };
    const u1 = onSnapshot(
      doc(db, 'admins', user.uid),
      (s) => {
        admin = root || s.exists();
        done();
      },
      done,
    );
    const u2 = onSnapshot(
      doc(db, 'bans', user.uid),
      (s) => {
        banned = s.exists();
        done();
      },
      done,
    );
    const u3 = onSnapshot(
      doc(db, 'moderators', user.uid),
      (s) => {
        mod = s.exists();
        done();
      },
      done,
    );
    return () => {
      u1();
      u2();
      u3();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, user?.email]);
  return state;
}

/* ---------------- Dữ liệu cho trang Admin ---------------- */

export interface UserRow {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  createdAt?: Timestamp | null;
  lastLoginAt?: Timestamp | null;
}

export interface AdminRow {
  uid: string;
  email: string;
  name: string;
  grantedByName?: string;
  grantedAt?: Timestamp | null;
}

export interface BanRow {
  uid: string;
  email: string;
  reason: string;
  at?: Timestamp | null;
}

export interface AdminLog {
  id: string;
  by: string;
  byName: string;
  action: string;
  target: string;
  at?: Timestamp | null;
}

function useCollection<T>(key: string | null, build: () => ReturnType<typeof query>, map: (id: string, d: any) => T) {
  const [state, setState] = useState<{ data: T[]; loading: boolean; error: string | null }>({ data: [], loading: true, error: null });
  useEffect(() => {
    if (!key) return;
    return onSnapshot(
      build(),
      (snap) => setState({ data: snap.docs.map((d) => map(d.id, d.data({ serverTimestamps: 'estimate' }))), loading: false, error: null }),
      (e) => {
        console.error(e);
        setState({ data: [], loading: false, error: e.message });
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}

export const useAllUsers = (on: boolean) =>
  useCollection<UserRow>(on ? 'users' : null, () => query(collection(db, 'users'), limit(1000)), (uid, d) => ({ uid, ...d }));

export const useAdmins = (on: boolean) =>
  useCollection<AdminRow>(on ? 'admins' : null, () => query(collection(db, 'admins')), (uid, d) => ({ uid, ...d }));

export const useBans = (on: boolean) =>
  useCollection<BanRow>(on ? 'bans' : null, () => query(collection(db, 'bans')), (uid, d) => ({ uid, ...d }));

export const useAllFolders = (on: boolean) =>
  useCollection<Folder>(on ? 'folders' : null, () => query(collection(db, 'folders'), orderBy('updatedAt', 'desc'), limit(500)), (id, d) => ({ id, ...d }));

export const useAdminLogs = (on: boolean) =>
  useCollection<AdminLog>(on ? 'logs' : null, () => query(collection(db, 'adminLogs'), orderBy('at', 'desc'), limit(100)), (id, d) => ({ id, ...d }));

/** Hoạt động học của mọi người dùng trong N ngày gần nhất (mỗi tài liệu = 1 người × 1 ngày). */
export type DayRow = DayStat & { uid: string };
export type SessionRow = Session & { uid: string };

/** Lắng nghe 1 truy vấn collection group, kèm UID chủ tài liệu (users/{uid}/...). */
function useGroup<T>(key: string | null, build: () => ReturnType<typeof query>) {
  const [state, setState] = useState<{ data: T[]; loading: boolean; error: string | null }>({ data: [], loading: true, error: null });
  useEffect(() => {
    if (!key) return;
    return onSnapshot(
      build(),
      (snap) =>
        setState({
          data: snap.docs.map((d) => ({ id: d.id, ...(d.data() as object), uid: d.ref.parent.parent?.id ?? '' }) as T),
          loading: false,
          error: null,
        }),
      (e) => {
        console.error(e);
        setState({ data: [], loading: false, error: e.message });
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}

/** Hoạt động học của mọi người dùng trong N ngày gần nhất (mỗi tài liệu = 1 người × 1 ngày). */
export function useAllDays(on: boolean, days = 30) {
  const since = dayKey(addDays(new Date(), -(days - 1)));
  return useGroup<DayRow>(on ? `days:${since}` : null, () => query(collectionGroup(db, 'days'), where('date', '>=', since)));
}

/** Các lượt học / kiểm tra đã hoàn thành của mọi người trong N ngày gần nhất. */
export function useAllSessions(on: boolean, days = 30) {
  const since = addDays(new Date(), -(days - 1));
  since.setHours(0, 0, 0, 0);
  const ms = since.getTime();
  return useGroup<SessionRow>(on ? `sessions:${ms}` : null, () =>
    query(collectionGroup(db, 'sessions'), where('endedAt', '>=', ms)),
  );
}

export async function countAll() {
  const [users, folders, questions, publicFolders] = await Promise.all([
    getCountFromServer(collection(db, 'users')),
    getCountFromServer(collection(db, 'folders')),
    getCountFromServer(collectionGroup(db, 'questions')),
    getCountFromServer(query(collection(db, 'folders'), where('visibility', '==', 'public'))),
  ]);
  return {
    users: users.data().count,
    folders: folders.data().count,
    questions: questions.data().count,
    publicFolders: publicFolders.data().count,
  };
}

/* ---------------- Thao tác của admin (có ghi nhật ký) ---------------- */

function log(me: User, action: string, target: string) {
  return addDoc(collection(db, 'adminLogs'), {
    by: me.uid,
    byName: me.displayName ?? me.email ?? '',
    action,
    target,
    at: serverTimestamp(),
  });
}

export async function grantAdmin(me: User, target: UserRow) {
  await setDoc(doc(db, 'admins', target.uid), {
    email: target.email,
    name: target.displayName,
    grantedBy: me.uid,
    grantedByName: me.displayName ?? '',
    grantedAt: serverTimestamp(),
  });
  await log(me, 'Cấp quyền admin', target.email);
}

export async function revokeAdmin(me: User, target: { uid: string; email: string }) {
  await deleteDoc(doc(db, 'admins', target.uid));
  await log(me, 'Thu hồi quyền admin', target.email);
}

export async function banUser(me: User, target: UserRow, reason: string) {
  await setDoc(doc(db, 'bans', target.uid), { email: target.email, reason, by: me.uid, at: serverTimestamp() });
  await log(me, 'Khóa tài khoản', `${target.email}${reason ? ` – ${reason}` : ''}`);
}

export async function unbanUser(me: User, target: { uid: string; email: string }) {
  await deleteDoc(doc(db, 'bans', target.uid));
  await log(me, 'Mở khóa tài khoản', target.email);
}

export async function moderateFolder(me: User, f: Folder, patch: Partial<Pick<Folder, 'visibility' | 'featured'>>, action: string) {
  await updateDoc(doc(db, 'folders', f.id), patch);
  await log(me, action, f.name);
}

export async function logFolderDelete(me: User, f: Folder) {
  await log(me, 'Xóa thư mục', `${f.name} (${f.questionCount} câu)`);
}

export async function saveConfig(me: User, config: AppConfig) {
  await setDoc(doc(db, 'config', 'app'), { ...config, updatedAt: serverTimestamp(), updatedBy: me.uid }, { merge: true });
  await log(me, 'Cập nhật cài đặt', config.readOnly ? 'Bật chế độ bảo trì' : 'Cài đặt chung');
}
