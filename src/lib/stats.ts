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
} from 'firebase/firestore';
import { addDoc, getDoc, onSnapshot, setDoc } from './fs'; // có đếm quota ước tính
import { db } from './firebase';
import { track } from './analytics';
import type { ProgressStats } from './types';

/* ---------------- Kiểu dữ liệu ---------------- */

/** users/{uid}/days/{YYYY-MM-DD} – tổng hợp hoạt động trong 1 ngày. */
export interface DayStat {
  date: string;
  answered: number;
  correct: number;
  hours?: Record<string, number>;
  folders?: Record<string, number>;
}

/** users/{uid}/sessions/{id} – 1 lượt học / kiểm tra đã hoàn thành. */
export interface Session {
  id: string;
  folderId: string;
  folderName: string;
  mode: 'learn' | 'test' | 'review';
  total: number;
  correct: number;
  durationSec: number;
  endedAt: number;
}

export interface UserDoc {
  dailyGoal?: number;
  sessionCount?: number;
  perfectCount?: number;
  /** Thông báo đã đóng: id → revision lúc đóng. */
  dismissedNotices?: Record<string, number>;
  /** Người dùng tắt âm thanh thông báo. */
  muteNotice?: boolean;
  /** Cách làm bài riêng của người dùng (không có = theo mặc định hệ thống). */
  studyLayout?: 'one' | 'all';
  /** Kiểu hiển thị khi làm cả bài: từng thẻ hoặc trang giấy. */
  sheetStyle?: 'cards' | 'paper';
  /** Giao diện: sáng / tối / theo hệ thống. */
  theme?: 'light' | 'dark' | 'system';
  /** Theme riêng (chỉ có tác dụng khi admin cho phép người dùng tự chọn). */
  skin?: string;
}

export interface FolderProgress {
  folderId: string;
  folderName: string;
  stats: ProgressStats;
  questionCount: number | null;
}

/* ---------------- Ngày tháng ---------------- */

export const dayKey = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const parseDay = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/* ---------------- Ghi nhận ---------------- */

/** Gọi mỗi khi người dùng (đã đăng nhập) trả lời 1 câu. */
export function recordActivity(uid: string, folderId: string, correct: boolean) {
  const now = new Date();
  return setDoc(
    doc(db, 'users', uid, 'days', dayKey(now)),
    {
      date: dayKey(now),
      answered: increment(1),
      correct: increment(correct ? 1 : 0),
      hours: { [String(now.getHours())]: increment(1) },
      folders: { [folderId]: increment(1) },
    },
    { merge: true },
  ).catch(console.error);
}

export async function logSession(uid: string, s: Omit<Session, 'id'>) {
  track('study_complete', {
    mode: s.mode,
    total: s.total,
    score_pct: s.total ? Math.round((s.correct / s.total) * 100) : 0,
    duration_sec: s.durationSec,
  });
  try {
    await addDoc(collection(db, 'users', uid, 'sessions'), { ...s, createdAt: serverTimestamp() });
    const perfect = s.total >= 5 && s.correct === s.total;
    await setDoc(
      doc(db, 'users', uid),
      { sessionCount: increment(1), perfectCount: increment(perfect ? 1 : 0) },
      { merge: true },
    );
  } catch (e) {
    console.error(e);
  }
}

export const setDailyGoal = (uid: string, goal: number) =>
  setDoc(doc(db, 'users', uid), { dailyGoal: goal }, { merge: true });

/* ---------------- Đọc dữ liệu (realtime) ---------------- */

function useLive<T>(key: string | null, subscribe: (set: (v: T) => void) => () => void, initial: T) {
  // Ghi nhớ dữ liệu thuộc về key nào: khi key đổi (vd. vừa có UID) thì coi là đang tải lại,
  // tránh hiện dữ liệu rỗng trong chốc lát.
  const [state, setState] = useState<{ key: string | null; data: T }>({ key: null, data: initial });
  useEffect(() => {
    if (!key) return;
    return subscribe((data) => setState({ key, data }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const ready = !key || state.key === key;
  return { data: ready && key ? state.data : initial, loading: !!key && !ready };
}

export function useDays(uid: string | undefined) {
  const since = dayKey(addDays(new Date(), -400));
  return useLive<DayStat[]>(
    uid ? `days:${uid}` : null,
    (set) =>
      onSnapshot(
        query(collection(db, 'users', uid!, 'days'), where('date', '>=', since), orderBy('date', 'asc')),
        (snap) => set(snap.docs.map((d) => d.data() as DayStat)),
        (e) => {
          console.error(e);
          set([]);
        },
      ),
    [],
  );
}

export function useSessions(uid: string | undefined) {
  return useLive<Session[]>(
    uid ? `sessions:${uid}` : null,
    (set) =>
      onSnapshot(
        query(collection(db, 'users', uid!, 'sessions'), orderBy('endedAt', 'desc'), limit(30)),
        (snap) => set(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Session, 'id'>) }))),
        (e) => {
          console.error(e);
          set([]);
        },
      ),
    [],
  );
}

export function useUserDoc(uid: string | undefined) {
  return useLive<UserDoc>(
    uid ? `user:${uid}` : null,
    (set) =>
      onSnapshot(
        doc(db, 'users', uid!),
        (snap) => set((snap.data() as UserDoc) ?? {}),
        () => set({}),
      ),
    {},
  );
}

/** Tiến độ của mọi thư mục đã học, kèm tổng số câu của thư mục (nếu còn quyền xem). */
export function useAllProgress(uid: string | undefined) {
  return useLive<FolderProgress[]>(
    uid ? `progress:${uid}` : null,
    (set) => {
      const counts = new Map<string, { name: string; count: number | null }>();
      return onSnapshot(
        collection(db, 'users', uid!, 'progress'),
        async (snap) => {
          await Promise.all(
            snap.docs
              .filter((d) => !counts.has(d.id))
              .map(async (d) => {
                try {
                  const f = await getDoc(doc(db, 'folders', d.id));
                  counts.set(d.id, f.exists() ? { name: f.data().name, count: f.data().questionCount } : { name: '', count: null });
                } catch {
                  counts.set(d.id, { name: '', count: null });
                }
              }),
          );
          set(
            snap.docs.map((d) => {
              const data = d.data();
              const info = counts.get(d.id);
              return {
                folderId: d.id,
                folderName: info?.name || data.folderName || 'Thư mục đã xóa',
                stats: (data.stats as ProgressStats) ?? {},
                questionCount: info?.count ?? null,
              };
            }),
          );
        },
        (e) => {
          console.error(e);
          set([]);
        },
      );
    },
    [],
  );
}

/* ---------------- Tính toán ---------------- */

export function masteryOf(s: { right: number; wrong: number } | undefined): 'mastered' | 'learning' | 'new' {
  if (!s || s.right + s.wrong === 0) return 'new';
  return s.right >= 2 && s.right > s.wrong ? 'mastered' : 'learning';
}

export function streaks(days: DayStat[]) {
  const active = new Set(days.filter((d) => d.answered > 0).map((d) => d.date));
  // Chuỗi hiện tại: tính đến hôm nay, hoặc hôm qua nếu hôm nay chưa học (chuỗi vẫn còn giữ được).
  let cur = 0;
  let d = new Date();
  if (!active.has(dayKey(d))) d = addDays(d, -1);
  while (active.has(dayKey(d))) {
    cur++;
    d = addDays(d, -1);
  }
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of [...active].sort()) {
    const day = parseDay(k);
    run = prev && dayKey(addDays(prev, 1)) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return { current: cur, best: Math.max(best, cur), studiedToday: active.has(dayKey()) };
}

/** XP: 10 điểm mỗi câu đúng, 3 điểm mỗi câu sai (vẫn được thưởng vì đã cố gắng). */
export const xpOf = (answered: number, correct: number) => correct * 10 + (answered - correct) * 3;

/** Cấp độ: lên từ cấp n sang n+1 cần 150·n XP (càng lên cao càng khó). */
export function levelOf(xp: number) {
  let level = 1;
  let need = 150;
  let rest = xp;
  while (rest >= need) {
    rest -= need;
    level++;
    need = 150 * level;
  }
  return { level, into: rest, need };
}

export function titleOf(level: number) {
  if (level >= 15) return 'Cú Giáo Sư';
  if (level >= 10) return 'Cú Thông Thái';
  if (level >= 6) return 'Cú Chăm Chỉ';
  if (level >= 3) return 'Cú Tập Sự';
  return 'Cú Non';
}
