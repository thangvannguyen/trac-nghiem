import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  increment,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from './firebase';
import type { Folder, Question } from './types';

/*
 * Kiểm duyệt nội dung (kiểm duyệt viên + admin):
 *  - Ẩn câu hỏi: hidden = true → không hiện cho người học (chủ / người sửa vẫn thấy kèm lý do).
 *  - Ẩn thư mục: hidden = true + chuyển về Riêng tư; chủ không tự công khai lại được cho tới khi bỏ ẩn.
 * Luật bảo mật chỉ cho kiểm duyệt viên / admin thay đổi các trường hidden*.
 */

export type ModQuestion = Question & { folderId: string };

function log(me: User, action: string, target: string) {
  return addDoc(collection(db, 'adminLogs'), { by: me.uid, byName: me.displayName ?? me.email ?? '', action, target, at: serverTimestamp() });
}

const short = (t: string) => (t.length > 70 ? `${t.slice(0, 70)}…` : t);

/** Câu hỏi mới nhất trên toàn hệ thống (realtime). */
export function useAllQuestions(on: boolean, max: number) {
  const [state, setState] = useState<{ data: ModQuestion[]; loading: boolean; error: string | null }>({ data: [], loading: true, error: null });
  useEffect(() => {
    if (!on) return;
    return onSnapshot(
      query(collectionGroup(db, 'questions'), orderBy('createdAt', 'desc'), limit(max)),
      (snap) =>
        setState({
          data: snap.docs.map((d) => ({ ...(d.data({ serverTimestamps: 'estimate' }) as Question), id: d.id, folderId: d.ref.parent.parent?.id ?? '' })),
          loading: false,
          error: null,
        }),
      (e) => {
        console.error(e);
        setState({ data: [], loading: false, error: e.message });
      },
    );
  }, [on, max]);
  return state;
}

export async function hideQuestion(me: User, q: ModQuestion, reason: string) {
  await updateDoc(doc(db, 'folders', q.folderId, 'questions', q.id), {
    hidden: true,
    hiddenReason: reason,
    hiddenBy: me.uid,
    hiddenAt: serverTimestamp(),
  });
  await log(me, 'Ẩn câu hỏi', `${short(q.text)}${reason ? ` – ${reason}` : ''}`);
}

export async function unhideQuestion(me: User, q: ModQuestion) {
  await updateDoc(doc(db, 'folders', q.folderId, 'questions', q.id), { hidden: false, hiddenReason: '', hiddenBy: me.uid, hiddenAt: serverTimestamp() });
  await log(me, 'Bỏ ẩn câu hỏi', short(q.text));
}

/** Xóa câu hỏi + trả lại hạn mức cho chủ thư mục. */
export async function removeQuestion(me: User, q: ModQuestion, folder?: Folder) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'folders', q.folderId, 'questions', q.id));
  if (folder) {
    batch.update(doc(db, 'folders', q.folderId), { questionCount: increment(-1), updatedAt: serverTimestamp() });
    batch.set(doc(db, 'usage', folder.ownerId), { questions: increment(-1), lastQFolder: q.folderId }, { merge: true });
  }
  await batch.commit();
  await log(me, 'Xóa câu hỏi (kiểm duyệt)', short(q.text));
}

export async function hideFolder(me: User, f: Folder, reason: string) {
  await updateDoc(doc(db, 'folders', f.id), {
    hidden: true,
    hiddenReason: reason,
    hiddenBy: me.uid,
    hiddenAt: serverTimestamp(),
    visibility: 'private',
    featured: false,
  });
  await log(me, 'Ẩn thư mục', `${f.name}${reason ? ` – ${reason}` : ''}`);
}

export async function unhideFolder(me: User, f: Folder) {
  await updateDoc(doc(db, 'folders', f.id), { hidden: false, hiddenReason: '', hiddenBy: me.uid, hiddenAt: serverTimestamp() });
  await log(me, 'Bỏ ẩn thư mục', f.name);
}

/* ---------------- Cấp quyền kiểm duyệt viên (admin) ---------------- */

export function useModerators(on: boolean) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!on) return;
    return onSnapshot(collection(db, 'moderators'), (s) => setIds(new Set(s.docs.map((d) => d.id))), console.error);
  }, [on]);
  return ids;
}

export async function grantModerator(me: User, target: { uid: string; email: string; displayName?: string }) {
  await setDoc(doc(db, 'moderators', target.uid), { email: target.email, name: target.displayName ?? '', grantedBy: me.uid, grantedAt: serverTimestamp() });
  await log(me, 'Cấp quyền kiểm duyệt', target.email);
}

export async function revokeModerator(me: User, target: { uid: string; email: string }) {
  await deleteDoc(doc(db, 'moderators', target.uid));
  await log(me, 'Thu hồi quyền kiểm duyệt', target.email);
}
