import { useCallback, useEffect, useState } from 'react';
import {
  doc,
  increment,
} from 'firebase/firestore';
import { onSnapshot, setDoc } from './fs'; // có đếm quota ước tính
import { db } from './firebase';
import type { ProgressStats, Question } from './types';
import { recordActivity } from './stats';

/**
 * Tiến độ học – luôn lưu trên Firestore (users/{uid}/progress/{folderId}).
 * Khách chưa đăng nhập Google cũng có UID riêng (tài khoản ẩn danh), nên không dùng bộ nhớ trình duyệt.
 */
export function useProgress(folderId: string | undefined, uid: string | undefined, folderName = '') {
  const [stats, setStats] = useState<ProgressStats>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!folderId) return;
    if (!uid) {
      // Chưa có UID (đang khởi tạo tài khoản khách): chưa có gì để hiện.
      setStats({});
      setLoaded(true);
      return;
    }
    setLoaded(false);
    return onSnapshot(
      doc(db, 'users', uid, 'progress', folderId),
      (snap) => {
        setStats((snap.data()?.stats as ProgressStats) ?? {});
        setLoaded(true);
      },
      (err) => {
        console.error(err);
        setLoaded(true);
      },
    );
  }, [folderId, uid]);

  const record = useCallback(
    (questionId: string, correct: boolean) => {
      if (!folderId) return;
      if (!uid) return;
      recordActivity(uid, folderId, correct);
      setDoc(
        doc(db, 'users', uid, 'progress', folderId),
        {
          folderName,
          stats: {
            [questionId]: {
              right: increment(correct ? 1 : 0),
              wrong: increment(correct ? 0 : 1),
              lastAt: Date.now(),
            },
          },
        },
        { merge: true },
      ).catch(console.error);
    },
    [folderId, uid, folderName],
  );

  const reset = useCallback(() => {
    if (!folderId || !uid) return;
    setDoc(doc(db, 'users', uid, 'progress', folderId), { stats: {} }).catch(console.error);
  }, [folderId, uid]);

  return { stats, loaded, record, reset };
}

/** Câu cần ôn: đã từng sai và số lần sai >= số lần đúng gần đây. Sắp xếp câu sai nhiều lên trước. */
export function reviewQueue(questions: Question[], stats: ProgressStats) {
  return questions
    .filter((q) => {
      const s = stats[q.id];
      return s && s.wrong > 0 && s.wrong >= s.right;
    })
    .sort((a, b) => stats[b.id].wrong - stats[b.id].right - (stats[a.id].wrong - stats[a.id].right));
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
