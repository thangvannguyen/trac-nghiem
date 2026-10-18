import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../lib/analytics';

/** Ghi lượt xem trang khi chuyển trang (lượt đầu tiên Analytics đã tự ghi lúc tải web). */
export default function RouteTracker() {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    trackPageView(pathname);
  }, [pathname]);
  return null;
}
