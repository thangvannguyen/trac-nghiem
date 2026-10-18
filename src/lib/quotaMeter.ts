import { doc, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

/*
 * Đếm ƯỚC TÍNH lượt đọc / ghi / xóa Firestore mà trình duyệt này thực hiện, rồi cộng dồn vào
 * quotaStats/{ngày quota} (ngày theo giờ Thái Bình Dương – cùng cách Google tính hạn mức ngày).
 * - Số luôn THẤP HƠN số thật: không thấy được lượt đọc do luật bảo mật (get / exists), Firebase Console, script quản trị…
 * - Mỗi lần gửi tốn 1 lượt ghi (đã tự cộng vào số đếm). Admin tắt được trong tab Tài nguyên.
 */

/** Ngày quota YYYY-MM-DD theo giờ America/Los_Angeles. */
export function quotaDayKey(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

const FLUSH_EVERY = 10 * 60 * 1000;
const MAX_PER_FLUSH = 20000; // khớp giới hạn trong firestore.rules

let enabled = false;
const counts = { reads: 0, writes: 0, deletes: 0 };

export const meter = {
  read(n = 1) {
    if (enabled && n > 0) counts.reads += n;
  },
  write(n = 1) {
    if (enabled && n > 0) counts.writes += n;
  },
  delete(n = 1) {
    if (enabled && n > 0) counts.deletes += n;
  },
};

/** Bật / tắt theo cấu hình admin (config/app.quotaTracking). Tắt thì bỏ số đang đếm, không gửi gì. */
export function setMeterEnabled(on: boolean) {
  enabled = on;
  if (!on) counts.reads = counts.writes = counts.deletes = 0;
}

let flushing = false;
async function flush() {
  if (!enabled || flushing || !auth.currentUser) return;
  const take = {
    reads: Math.min(counts.reads, MAX_PER_FLUSH),
    writes: Math.min(counts.writes + 1, MAX_PER_FLUSH), // +1 cho chính lượt ghi này
    deletes: Math.min(counts.deletes, MAX_PER_FLUSH),
  };
  if (!counts.reads && !counts.writes && !counts.deletes) return;
  flushing = true;
  counts.reads -= take.reads;
  counts.writes = Math.max(0, counts.writes - (take.writes - 1));
  counts.deletes -= take.deletes;
  try {
    // dùng setDoc gốc (không qua lớp đếm) để không tự đếm lặp
    await setDoc(
      doc(db, 'quotaStats', quotaDayKey()),
      { reads: increment(take.reads), writes: increment(take.writes), deletes: increment(take.deletes), updatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch (e) {
    console.warn('Không gửi được số đếm quota', e);
    counts.reads += take.reads;
    counts.writes += take.writes - 1;
    counts.deletes += take.deletes;
  } finally {
    flushing = false;
  }
}

if (typeof window !== 'undefined') {
  window.setInterval(flush, FLUSH_EVERY);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush());
  window.addEventListener('pagehide', () => flush());
}
