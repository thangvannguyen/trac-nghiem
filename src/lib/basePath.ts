/** Đường dẫn gốc của web: '/' trên Firebase Hosting, '/trac-nghiem/' trên GitHub Pages. */
export const BASE = import.meta.env.BASE_URL;

/** Link tuyệt đối tới 1 trang trong web, vd. siteUrl('f/abc') → https://…/trac-nghiem/f/abc */
export const siteUrl = (path = '') => `${window.location.origin}${BASE}${path.replace(/^\//, '')}`;
