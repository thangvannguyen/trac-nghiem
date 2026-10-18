import { getAnalytics, isSupported, logEvent } from 'firebase/analytics';
import { app } from './firebase';

/*
 * Google Analytics – mỗi nơi chạy web gửi về property riêng:
 * - Firebase Hosting (trac-nghiem-4804e.web.app): Firebase Analytics, mã G-336S3TVNJW trong firebaseConfig.
 * - GitHub Pages (thangvannguyen.github.io): thẻ Google (gtag.js) trực tiếp với mã G-1CCFCZQHZZ.
 *   (Không dùng Firebase Analytics ở đây vì SDK tự lấy mã đo lường của project từ máy chủ và ghi đè mã riêng.)
 * - Không gửi gì khi chạy trên máy (localhost) để số liệu thật không bị lẫn.
 * - Web là 1 trang (SPA): lượt xem trang được ghi thủ công mỗi lần đổi đường dẫn (xem RouteTracker).
 */

const GITHUB_PAGES_ID = 'G-1CCFCZQHZZ';

type Params = Record<string, string | number | boolean>;
type Sender = (name: string, params?: Params) => void;

const host = typeof window !== 'undefined' ? window.location.hostname : '';
const enabled = host !== '' && !['localhost', '127.0.0.1'].includes(host);
const onGithubPages = host.endsWith('github.io');

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

/** Nạp thẻ Google (gtag.js) cho GitHub Pages. */
function loadGtag(id: string): Sender {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // gtag.js cần đúng đối tượng `arguments`
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', id); // tự ghi lượt xem trang đầu tiên
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s);
  return (name, params) => window.gtag('event', name, { send_to: id, ...params });
}

const ready: Promise<Sender | null> = !enabled
  ? Promise.resolve(null)
  : onGithubPages
    ? Promise.resolve(loadGtag(GITHUB_PAGES_ID))
    : isSupported()
        .then((ok) => {
          if (!ok) return null;
          const a = getAnalytics(app);
          return ((name, params) => logEvent(a, name, params)) as Sender;
        })
        .catch(() => null);

/** Ghi 1 sự kiện; lỗi Analytics không bao giờ làm hỏng chức năng chính. */
export function track(name: string, params?: Params) {
  ready.then((send) => send?.(name, params)).catch(() => {});
}

export function trackPageView(path: string) {
  track('page_view', { page_path: path, page_location: window.location.href, page_title: document.title });
}
