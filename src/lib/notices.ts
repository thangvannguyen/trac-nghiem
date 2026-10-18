import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from './firebase';
import type { Audience, Tone } from './admin';

/*
 * Danh sách thông báo: announcements/{id}. Ai cũng đọc được, chỉ admin ghi.
 * Người dùng đóng thông báo → users/{uid}.dismissedNotices[id] = revision.
 * "Hiện lại" = tăng revision → thông báo hiện lại cho cả người đã đóng.
 */

/** Mẫu hiển thị thông báo. */
export type NoticeTemplate = 'card' | 'banner' | 'celebrate' | 'popup' | 'toast';

export const TEMPLATES: { k: NoticeTemplate; label: string; hint: string }[] = [
  { k: 'card', label: 'Thẻ', hint: 'Thẻ có chú cú, đầu trang' },
  { k: 'banner', label: 'Dải mảnh', hint: '1 dòng gọn ở đầu trang' },
  { k: 'celebrate', label: 'Ăn mừng', hint: 'Nổi bật, có pháo giấy' },
  { k: 'popup', label: 'Cửa sổ nổi', hint: 'Hiện giữa màn hình' },
  { k: 'toast', label: 'Góc màn hình', hint: 'Bật lên ở góc dưới' },
];

export interface PushStatus {
  state: 'pending' | 'sent' | 'error';
  sent?: number;
  failed?: number;
  error?: string;
  at?: Timestamp | null;
}

export interface Notice {
  id: string;
  title: string;
  text: string;
  tone: Tone;
  template: NoticeTemplate;
  audience: Audience;
  /** Với audience = 'specific': UID người nhận (không lưu email vì tài liệu này công khai). */
  targetUids: string[];
  sound: boolean;
  /** Gửi thông báo đẩy (hiện cả khi đã đóng tab) khi đăng / hiện lại. */
  push: boolean;
  active: boolean;
  revision: number;
  link: string;
  createdBy: string;
  createdByName: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  /** Lần gần nhất thông báo được đăng / hiện lại. */
  shownAt?: Timestamp | null;
  /** Đổi giá trị này → Cloud Function gửi thông báo đẩy. */
  pushRequestedAt?: Timestamp | null;
  pushStatus?: PushStatus;
}

export type NoticeInput = Pick<Notice, 'title' | 'text' | 'tone' | 'template' | 'audience' | 'targetUids' | 'sound' | 'push'>;

export const EMPTY_NOTICE: NoticeInput = {
  title: '',
  text: '',
  tone: 'info',
  template: 'card',
  audience: 'all',
  targetUids: [],
  sound: true,
  push: false,
};

const col = collection(db, 'announcements');
const toNotice = (id: string, d: Record<string, unknown>): Notice =>
  ({ template: "card", audience: "all", targetUids: [], sound: true, push: false, active: false, revision: 0, link: "/", ...d, id }) as unknown as Notice;

/** Thông báo đang bật (cho người xem). */
export function useActiveNotices() {
  const [data, setData] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(
    () =>
      onSnapshot(
        query(col, where('active', '==', true)),
        (snap) => {
          const list = snap.docs.map((d) => toNotice(d.id, d.data({ serverTimestamps: 'estimate' })));
          list.sort((a, b) => (b.shownAt?.toMillis() ?? 0) - (a.shownAt?.toMillis() ?? 0));
          setData(list);
          setLoading(false);
        },
        (e) => {
          console.error(e);
          setLoading(false);
        },
      ),
    [],
  );
  return { data, loading };
}

/** Toàn bộ thông báo (cho admin), mới nhất trước. */
export function useAllNotices() {
  const [state, setState] = useState<{ data: Notice[]; loading: boolean }>({ data: [], loading: true });
  useEffect(
    () =>
      onSnapshot(
        query(col, orderBy('createdAt', 'desc')),
        (snap) => setState({ data: snap.docs.map((d) => toNotice(d.id, d.data({ serverTimestamps: 'estimate' }))), loading: false }),
        (e) => {
          console.error(e);
          setState({ data: [], loading: false });
        },
      ),
    [],
  );
  return state;
}

export const noticeVisibleFor = (n: Notice, user: User | null) =>
  n.audience === 'users' ? !!user : n.audience === 'guests' ? !user : n.audience === 'specific' ? !!user && n.targetUids.includes(user.uid) : true;

/* ---------------- Người dùng ---------------- */

export function dismissNotice(uid: string, n: Notice) {
  return setDoc(doc(db, 'users', uid), { dismissedNotices: { [n.id]: n.revision } }, { merge: true });
}

/* ---------------- Admin ---------------- */

function adminLog(me: User, action: string, target: string) {
  return addDoc(collection(db, 'adminLogs'), { by: me.uid, byName: me.displayName ?? me.email ?? '', action, target, at: serverTimestamp() });
}

const label = (n: Pick<Notice, 'title' | 'text'>) => n.title.trim() || n.text.slice(0, 60);

/** Tạo thông báo. publish = đăng ngay (bật + gửi đẩy nếu có chọn). */
export async function createNotice(me: User, input: NoticeInput, publish: boolean) {
  const ref = await addDoc(col, {
    ...input,
    active: publish,
    revision: 0,
    link: window.location.origin,
    createdBy: me.uid,
    createdByName: me.displayName ?? '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    shownAt: publish ? serverTimestamp() : null,
    ...(publish && input.push ? { pushRequestedAt: serverTimestamp(), pushStatus: { state: 'pending' } } : {}),
  });
  await adminLog(me, publish ? 'Đăng thông báo' : 'Lưu nháp thông báo', label(input));
  return ref.id;
}

export async function updateNotice(me: User, n: Notice, input: NoticeInput) {
  await updateDoc(doc(col, n.id), { ...input, updatedAt: serverTimestamp() });
  await adminLog(me, 'Sửa thông báo', label(input));
}

export async function setNoticeActive(me: User, n: Notice, active: boolean) {
  await updateDoc(doc(col, n.id), {
    active,
    updatedAt: serverTimestamp(),
    ...(active ? { shownAt: serverTimestamp() } : {}),
    ...(active && n.push && !n.pushRequestedAt ? { pushRequestedAt: serverTimestamp(), pushStatus: { state: 'pending' } } : {}),
  });
  await adminLog(me, active ? 'Bật thông báo' : 'Tắt thông báo', label(n));
}

/** Hiện lại cho tất cả (kể cả người đã đóng); gửi đẩy lại nếu thông báo có bật đẩy. */
export async function reshowNotice(me: User, n: Notice) {
  await updateDoc(doc(col, n.id), {
    active: true,
    revision: increment(1),
    shownAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...(n.push ? { pushRequestedAt: serverTimestamp(), pushStatus: { state: 'pending' } } : {}),
  });
  await adminLog(me, 'Hiện lại thông báo', label(n));
}

export async function resendPush(me: User, n: Notice) {
  await updateDoc(doc(col, n.id), { push: true, pushRequestedAt: serverTimestamp(), pushStatus: { state: 'pending' } });
  await adminLog(me, 'Gửi lại thông báo đẩy', label(n));
}

export async function deleteNotice(me: User, n: Notice) {
  await deleteDoc(doc(col, n.id));
  await adminLog(me, 'Xóa thông báo', label(n));
}

/** Số người đã đóng lần hiện hiện tại của thông báo. */
export async function countDismissedNotice(n: Notice) {
  const snap = await getCountFromServer(query(collection(db, 'users'), where(`dismissedNotices.${n.id}`, '==', n.revision)));
  return snap.data().count;
}
