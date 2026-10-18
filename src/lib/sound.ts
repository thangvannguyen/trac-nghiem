import type { Tone } from './admin';

/*
 * Âm thanh thông báo – tạo bằng Web Audio API (không cần file âm thanh).
 * Mỗi kiểu thông báo có 1 giai điệu chuông ngắn, nhẹ nhàng.
 */

// Tần số (Hz) các nốt: C6 E6 G6 C7 / G5 D6.
const MELODY: Record<Tone, number[]> = {
  info: [1046.5, 1318.5, 1568],
  success: [1046.5, 1318.5, 1568, 2093],
  warning: [784, 1174.7, 784],
};

let ctx: AudioContext | null = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** 1 tiếng chuông: sóng sine + bồi âm triangle, bật nhanh rồi tắt dần. */
function bell(c: AudioContext, freq: number, at: number) {
  const out = c.createGain();
  out.gain.setValueAtTime(0.0001, at);
  out.gain.exponentialRampToValueAtTime(0.16, at + 0.012);
  out.gain.exponentialRampToValueAtTime(0.0001, at + 0.8);
  out.connect(c.destination);

  const base = c.createOscillator();
  base.type = 'sine';
  base.frequency.value = freq;
  base.connect(out);

  const shimmer = c.createOscillator();
  const sg = c.createGain();
  shimmer.type = 'triangle';
  shimmer.frequency.value = freq * 2;
  sg.gain.value = 0.18;
  shimmer.connect(sg).connect(out);

  for (const o of [base, shimmer]) {
    o.start(at);
    o.stop(at + 0.85);
  }
}

/** Phát ngay (chỉ thành công khi trình duyệt đã cho phép phát âm thanh). */
export function playChime(tone: Tone = 'info') {
  const c = audio();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  const start = c.currentTime + 0.03;
  (MELODY[tone] ?? MELODY.info).forEach((f, i) => bell(c, f, start + i * 0.11));
}

/**
 * Phát chuông ngay lúc thông báo xuất hiện – không phát bù về sau.
 * Trình duyệt chặn âm thanh khi người dùng chưa tương tác với trang (vd. vừa mở web): khi đó thử mở
 * khóa âm thanh, nếu không được thì bỏ qua để tránh tiếng chuông kêu lệch lúc người dùng bấm nút khác (vd. nút đóng).
 */
export function playChimeOnAppear(tone: Tone): () => void {
  const c = audio();
  if (!c) return () => {};
  if (c.state === 'running') {
    playChime(tone);
    return () => {};
  }
  let cancelled = false;
  const timer = window.setTimeout(() => {
    cancelled = true; // quá lâu: thông báo đã hiện từ trước, không phát nữa
  }, 400);
  c.resume()
    .then(() => {
      window.clearTimeout(timer);
      if (!cancelled && c.state === 'running') playChime(tone);
    })
    .catch(() => {});
  return () => {
    cancelled = true;
    window.clearTimeout(timer);
  };
}
