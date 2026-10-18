/** "vừa xong", "5 phút trước", "3 giờ trước", "Hôm qua", "4 ngày trước", quá 1 tuần thì hiện ngày. */
export function timeAgo(t: number) {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return 'vừa xong';
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  const days = Math.floor(s / 86400);
  if (days === 1) return 'hôm qua';
  if (days < 7) return `${days} ngày trước`;
  return new Date(t).toLocaleDateString('vi-VN');
}

/** Ngày giờ đầy đủ, vd. "14:05, 18/10/2026". */
export const fullDateTime = (t: number) =>
  new Date(t).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
