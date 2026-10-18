/*
 * Các hàm Firestore có đếm lượt đọc / ghi / xóa (xem quotaMeter.ts). Dùng y như hàm gốc của 'firebase/firestore'.
 * Cách tính gần giống Google: tài liệu lấy từ bộ nhớ đệm trên máy không tính; truy vấn rỗng tính 1 lượt đọc;
 * phép đếm (count) tính 1 lượt / 1.000 tài liệu.
 */
import * as F from 'firebase/firestore';
import { meter } from './quotaMeter';

type AnySnap = F.DocumentSnapshot | F.QuerySnapshot;

function snapReads(snap: AnySnap, firstFromServer: boolean) {
  if ('docChanges' in snap) {
    if (firstFromServer) return Math.max(1, snap.size);
    return snap.docChanges().filter((c) => c.type !== 'removed').length;
  }
  return 1;
}

export const onSnapshot = ((...args: unknown[]) => {
  const i = args.findIndex((a) => typeof a === 'function');
  if (i >= 0) {
    const cb = args[i] as (s: AnySnap) => void;
    let sawServer = false;
    args[i] = (snap: AnySnap) => {
      if (!snap.metadata.fromCache) {
        meter.read(snapReads(snap, !sawServer));
        sawServer = true;
      }
      cb(snap);
    };
  }
  return (F.onSnapshot as (...a: unknown[]) => F.Unsubscribe)(...args);
}) as typeof F.onSnapshot;

export const getDoc = (async (...args: unknown[]) => {
  const s = await (F.getDoc as (...a: unknown[]) => Promise<F.DocumentSnapshot>)(...args);
  if (!s.metadata.fromCache) meter.read(1);
  return s;
}) as typeof F.getDoc;

export const getDocs = (async (...args: unknown[]) => {
  const s = await (F.getDocs as (...a: unknown[]) => Promise<F.QuerySnapshot>)(...args);
  if (!s.metadata.fromCache) meter.read(Math.max(1, s.size));
  return s;
}) as typeof F.getDocs;

export const getCountFromServer = (async (...args: unknown[]) => {
  const s = await (F.getCountFromServer as (...a: unknown[]) => Promise<F.AggregateQuerySnapshot<{ count: F.AggregateField<number> }>>)(...args);
  meter.read(Math.max(1, Math.ceil(s.data().count / 1000)));
  return s;
}) as typeof F.getCountFromServer;

const wrapWrite = <T extends (...a: never[]) => Promise<unknown>>(fn: T, kind: 'write' | 'delete') =>
  (async (...args: Parameters<T>) => {
    const r = await fn(...args);
    meter[kind](1);
    return r;
  }) as unknown as T;

export const setDoc = wrapWrite(F.setDoc as (...a: never[]) => Promise<void>, 'write') as typeof F.setDoc;
export const updateDoc = wrapWrite(F.updateDoc as (...a: never[]) => Promise<void>, 'write') as typeof F.updateDoc;
export const addDoc = wrapWrite(F.addDoc as unknown as (...a: never[]) => Promise<unknown>, 'write') as unknown as typeof F.addDoc;
export const deleteDoc = wrapWrite(F.deleteDoc as (...a: never[]) => Promise<void>, 'delete') as typeof F.deleteDoc;

/** Batch có đếm: mỗi set / update = 1 ghi, mỗi delete = 1 xóa; chỉ tính khi commit thành công. */
export function writeBatch(db: F.Firestore): F.WriteBatch {
  const b = F.writeBatch(db);
  let w = 0;
  let d = 0;
  const wrapped = {
    set: (...a: unknown[]) => {
      w++;
      (b.set as (...x: unknown[]) => unknown)(...a);
      return wrapped;
    },
    update: (...a: unknown[]) => {
      w++;
      (b.update as (...x: unknown[]) => unknown)(...a);
      return wrapped;
    },
    delete: (...a: unknown[]) => {
      d++;
      (b.delete as (...x: unknown[]) => unknown)(...a);
      return wrapped;
    },
    commit: async () => {
      await b.commit();
      meter.write(w);
      meter.delete(d);
    },
  };
  return wrapped as unknown as F.WriteBatch;
}
