import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  type DocumentSnapshot,
  type Query,
} from 'firebase/firestore';
import { getDoc, getDocs, onSnapshot, updateDoc, writeBatch } from './fs'; // có đếm quota ước tính
import type { User } from 'firebase/auth';
import { db } from './firebase';
import { track } from './analytics';
import { emailKey } from './emailKey';
import type { Folder, FolderColor, FolderIconName, Role, Visibility } from './types';

export const foldersCol = collection(db, 'folders');

function toFolder(snap: DocumentSnapshot): Folder {
  return { id: snap.id, ...(snap.data({ serverTimestamps: 'estimate' }) as Omit<Folder, 'id'>) };
}

export interface ListState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

// `key` đại diện cho query (Query không so sánh bằng === được); null = không truy vấn.
function useFolderQuery(key: string | null, build: () => Query): ListState<Folder> {
  const [state, setState] = useState<ListState<Folder>>({ data: [], loading: !!key, error: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!key) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    let retry: ReturnType<typeof setTimeout> | undefined;
    const unsub = onSnapshot(
      build(),
      (snap) => setState({ data: snap.docs.map(toFolder), loading: false, error: null }),
      (err) => {
        console.error(err);
        // Index Firestore đang được tạo (sau lần deploy đầu): báo dễ hiểu và tự thử lại.
        if (err.code === 'failed-precondition') {
          setState({ data: [], loading: false, error: 'Dữ liệu đang được chuẩn bị, vài phút nữa sẽ tự hiện. Đang tự thử lại…' });
          retry = setTimeout(() => setAttempt((a) => a + 1), 20000);
        } else {
          setState({ data: [], loading: false, error: err.message });
        }
      },
    );
    return () => {
      unsub();
      clearTimeout(retry);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);
  return state;
}

export function usePublicFolders() {
  return useFolderQuery('public', () =>
    query(foldersCol, where('visibility', '==', 'public'), orderBy('updatedAt', 'desc'), limit(100)),
  );
}

export function useFeaturedFolders() {
  return useFolderQuery('featured', () =>
    query(foldersCol, where('visibility', '==', 'public'), where('featured', '==', true), limit(12)),
  );
}

export function useMyFolders(uid: string | undefined) {
  return useFolderQuery(uid ? `mine:${uid}` : null, () =>
    query(foldersCol, where('ownerId', '==', uid), orderBy('updatedAt', 'desc')),
  );
}

/** Thư mục được chia sẻ với tôi – tra theo mã băm email (emailKey), không theo email thật. */
export function useSharedFolders(key: string) {
  const asViewer = useFolderQuery(key ? `v:${key}` : null, () =>
    query(foldersCol, where('viewerKeys', 'array-contains', key), orderBy('updatedAt', 'desc')),
  );
  const asEditor = useFolderQuery(key ? `e:${key}` : null, () =>
    query(foldersCol, where('editorKeys', 'array-contains', key), orderBy('updatedAt', 'desc')),
  );
  const seen = new Set<string>();
  const data = [...asEditor.data, ...asViewer.data].filter((f) => (seen.has(f.id) ? false : seen.add(f.id)));
  return { data, loading: asViewer.loading || asEditor.loading, error: asViewer.error || asEditor.error };
}

export type FolderState =
  | { status: 'loading' }
  | { status: 'ok'; folder: Folder }
  | { status: 'notfound' }
  | { status: 'denied' };

export function useFolder(id: string | undefined, authKey: string): FolderState {
  const [state, setState] = useState<FolderState>({ status: 'loading' });
  useEffect(() => {
    if (!id) return;
    setState({ status: 'loading' });
    return onSnapshot(
      doc(db, 'folders', id),
      (snap) => setState(snap.exists() ? { status: 'ok', folder: toFolder(snap) } : { status: 'notfound' }),
      (err) => setState(err.code === 'permission-denied' ? { status: 'denied' } : { status: 'notfound' }),
    );
    // authKey: đăng nhập/đăng xuất thì đăng ký lại để quyền được tính lại.
  }, [id, authKey]);
  return state;
}

export function roleOf(folder: Folder, user: User | null, key = ''): Role {
  if (!user) return 'guest';
  if (folder.ownerId === user.uid) return 'owner';
  if (key && (folder.editorKeys ?? []).includes(key)) return 'editor';
  if (key && (folder.viewerKeys ?? []).includes(key)) return 'viewer';
  return 'guest';
}

/* ---------------- Danh sách email được mời (chỉ chủ thư mục / admin đọc được) ---------------- */

export interface Sharing {
  viewerEmails: string[];
  editorEmails: string[];
}

const sharingRef = (folderId: string) => doc(db, 'folders', folderId, 'private', 'sharing');

export function useSharing(folderId: string) {
  const [state, setState] = useState<Sharing>({ viewerEmails: [], editorEmails: [] });
  useEffect(
    () =>
      onSnapshot(
        sharingRef(folderId),
        (s) => setState({ viewerEmails: s.data()?.viewerEmails ?? [], editorEmails: s.data()?.editorEmails ?? [] }),
        (e) => console.error(e),
      ),
    [folderId],
  );
  return state;
}

/** Lưu danh sách mời: email thật vào tài liệu riêng, mã băm vào thư mục – trong cùng 1 batch. */
export async function saveSharing(folderId: string, s: Sharing) {
  const [viewerKeys, editorKeys] = await Promise.all([
    Promise.all(s.viewerEmails.map(emailKey)),
    Promise.all(s.editorEmails.map(emailKey)),
  ]);
  const batch = writeBatch(db);
  batch.set(sharingRef(folderId), s);
  batch.update(doc(db, 'folders', folderId), { viewerKeys, editorKeys, updatedAt: serverTimestamp() });
  await batch.commit();
}

export interface FolderInput {
  name: string;
  description: string;
  color: FolderColor;
  icon: FolderIconName;
  visibility: Visibility;
  showOwner: boolean;
}

/** Bộ đếm hạn mức của 1 người dùng (xem luật usage/{uid} trong firestore.rules). */
export const usageRef = (uid: string) => doc(db, 'usage', uid);

export async function createFolder(user: User, input: FolderInput) {
  // Tạo thư mục + tăng bộ đếm thư mục trong cùng 1 batch (luật bảo mật kiểm tra hạn mức).
  const ref = doc(foldersCol);
  const batch = writeBatch(db);
  batch.set(usageRef(user.uid), { folders: increment(1), lastFolder: ref.id }, { merge: true });
  batch.set(ref, {
    ...input,
    ownerId: user.uid,
    // Ẩn danh thì không lưu tên/ảnh vào thư mục, để người xem không đọc được.
    ownerName: input.showOwner ? (user.displayName ?? '') : '',
    ownerPhoto: input.showOwner ? (user.photoURL ?? '') : '',
    viewerKeys: [],
    editorKeys: [],
    questionCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
  track('create_folder', { visibility: input.visibility });
  return ref.id;
}

export function updateFolder(
  id: string,
  patch: Partial<FolderInput & { ownerName: string; ownerPhoto: string }>,
) {
  return updateDoc(doc(db, 'folders', id), { ...patch, updatedAt: serverTimestamp() });
}

export function setShowOwner(id: string, user: User, show: boolean) {
  return updateFolder(id, {
    showOwner: show,
    ownerName: show ? (user.displayName ?? '') : '',
    ownerPhoto: show ? (user.photoURL ?? '') : '',
  });
}

/** Thông tin người chia sẻ để hiển thị, hoặc null nếu chủ thư mục chọn ẩn danh. */
export function ownerInfo(f: Folder) {
  return f.showOwner === false || !f.ownerName ? null : { name: f.ownerName, photo: f.ownerPhoto };
}

export async function deleteFolder(folder: Pick<Folder, 'id' | 'ownerId'>) {
  const qs = await getDocs(collection(db, 'folders', folder.id, 'questions'));
  for (let i = 0; i < qs.docs.length; i += 450) {
    const batch = writeBatch(db);
    qs.docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  // Xóa thư mục + trả lại hạn mức (1 thư mục và số câu hỏi đã xóa) trong cùng 1 batch.
  // Dữ liệu cũ có thể chưa có bộ đếm (chưa đồng bộ): khi đó không trừ để tránh số âm.
  const usage = await getDoc(usageRef(folder.ownerId)).catch(() => null);
  const batch = writeBatch(db);
  batch.delete(doc(db, 'folders', folder.id));
  if ((usage?.data()?.folders ?? 0) >= 1)
    batch.set(
      usageRef(folder.ownerId),
      { folders: increment(-1), questions: increment(-qs.docs.length), lastFolder: folder.id },
      { merge: true },
    );
  await batch.commit();
}
