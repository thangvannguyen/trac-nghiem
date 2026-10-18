import { useEffect, useState } from 'react';
import { addDoc, collection, doc, onSnapshot, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from './firebase';
import { useSite } from './site';
import type { Folder } from './types';

/*
 * Hạn mức tạo nội dung của mỗi người dùng (kiểm tra cả trong firestore.rules):
 *  - limits/{uid}: hạn mức riêng do admin đặt (-1 = theo mặc định, 0 = không giới hạn)
 *  - config/app.defaultMaxFolders / defaultMaxQuestions: mặc định cho người dùng mới
 *  - usage/{uid}: số thư mục / tổng số câu hỏi đã dùng
 */

export const DEFAULT_MAX_FOLDERS = 5;
export const DEFAULT_MAX_QUESTIONS = 100;

export interface Limits {
  maxFolders?: number;
  maxQuestions?: number;
}

export interface Usage {
  folders?: number;
  questions?: number;
}

export interface Quota {
  maxFolders: number; // 0 = không giới hạn
  maxQuestions: number;
  folders: number;
  questions: number;
  custom: boolean; // admin đặt riêng cho người này
  loading: boolean;
}

export const effective = (own: number | undefined, def: number) => (own != null && own >= 0 ? own : def);
export const remaining = (max: number, used: number) => (max === 0 ? Infinity : Math.max(0, max - used));
export const fmtMax = (n: number) => (n === 0 ? '∞' : String(n));

/** Hạn mức + đã dùng của người đang đăng nhập (realtime). */
export function useMyQuota(uid: string | undefined): Quota {
  const { config } = useSite();
  const [limits, setLimits] = useState<Limits | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);

  useEffect(() => {
    setLimits(null);
    setUsage(null);
    if (!uid) return;
    const a = onSnapshot(doc(db, 'limits', uid), (s) => setLimits((s.data() as Limits) ?? {}), () => setLimits({}));
    const b = onSnapshot(doc(db, 'usage', uid), (s) => setUsage((s.data() as Usage) ?? {}), () => setUsage({}));
    return () => {
      a();
      b();
    };
  }, [uid]);

  return {
    maxFolders: effective(limits?.maxFolders, config.defaultMaxFolders),
    maxQuestions: effective(limits?.maxQuestions, config.defaultMaxQuestions),
    folders: Math.max(0, usage?.folders ?? 0),
    questions: Math.max(0, usage?.questions ?? 0),
    custom: (limits?.maxFolders ?? -1) >= 0 || (limits?.maxQuestions ?? -1) >= 0,
    loading: !!uid && (limits == null || usage == null),
  };
}

/* ---------------- Admin ---------------- */

function useAdminMap<T>(name: 'limits' | 'usage', on: boolean) {
  const [map, setMap] = useState<Map<string, T>>(new Map());
  useEffect(() => {
    if (!on) return;
    return onSnapshot(
      collection(db, name),
      (snap) => setMap(new Map(snap.docs.map((d) => [d.id, d.data() as T]))),
      (e) => console.error(e),
    );
  }, [name, on]);
  return map;
}

export const useAllLimits = (on: boolean) => useAdminMap<Limits>('limits', on);
export const useAllUsage = (on: boolean) => useAdminMap<Usage>('usage', on);

export async function setUserLimits(me: User, target: { uid: string; email: string }, limits: Required<Limits>) {
  await setDoc(doc(db, 'limits', target.uid), { ...limits, updatedAt: serverTimestamp(), updatedBy: me.uid });
  const show = (n: number) => (n < 0 ? 'mặc định' : n === 0 ? 'không giới hạn' : n);
  await addDoc(collection(db, 'adminLogs'), {
    by: me.uid,
    byName: me.displayName ?? '',
    action: 'Đặt hạn mức',
    target: `${target.email}: ${show(limits.maxFolders)} thư mục, ${show(limits.maxQuestions)} câu`,
    at: serverTimestamp(),
  });
}

/** Tính lại bộ đếm đã dùng của mọi người từ dữ liệu thư mục thực tế. */
export async function syncAllUsage(me: User, folders: Folder[], userIds: string[]) {
  const per = new Map<string, { folders: number; questions: number }>();
  for (const uid of userIds) per.set(uid, { folders: 0, questions: 0 });
  for (const f of folders) {
    const u = per.get(f.ownerId) ?? { folders: 0, questions: 0 };
    u.folders += 1;
    u.questions += Math.max(0, f.questionCount ?? 0);
    per.set(f.ownerId, u);
  }
  const entries = [...per.entries()];
  for (let i = 0; i < entries.length; i += 400) {
    const batch = writeBatch(db);
    entries.slice(i, i + 400).forEach(([uid, u]) => batch.set(doc(db, 'usage', uid), u));
    await batch.commit();
  }
  await addDoc(collection(db, 'adminLogs'), {
    by: me.uid,
    byName: me.displayName ?? '',
    action: 'Đồng bộ bộ đếm hạn mức',
    target: `${entries.length} người dùng`,
    at: serverTimestamp(),
  });
  return entries.length;
}
