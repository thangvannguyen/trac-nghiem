import { getAnalytics, isSupported, logEvent, type Analytics } from 'firebase/analytics';
import { app } from './firebase';

/*
 * Google Analytics (GA4 qua Firebase, mã G-336S3TVNJW trong firebaseConfig).
 * - Không gửi gì khi chạy trên máy (localhost) để số liệu thật không bị lẫn.
 * - Web là 1 trang (SPA): lượt xem trang được ghi thủ công mỗi lần đổi đường dẫn (xem RouteTracker).
 */

const enabled = typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname);

const ready: Promise<Analytics | null> = enabled
  ? isSupported()
      .then((ok) => (ok ? getAnalytics(app) : null))
      .catch(() => null)
  : Promise.resolve(null);

/** Ghi 1 sự kiện; lỗi Analytics không bao giờ làm hỏng chức năng chính. */
export function track(name: string, params?: Record<string, string | number | boolean>) {
  ready.then((a) => a && logEvent(a, name, params)).catch(() => {});
}

export function trackPageView(path: string) {
  track('page_view', { page_path: path, page_location: window.location.href, page_title: document.title });
}
