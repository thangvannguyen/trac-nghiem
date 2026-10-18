import { useEffect, useState } from 'react';
import type { Timestamp } from 'firebase/firestore';
import { fullDateTime, timeAgo } from '../lib/time';

/** Thời gian tương đối, tự cập nhật mỗi phút; rê chuột để xem ngày giờ đầy đủ. */
export default function TimeAgo({ at, prefix = '' }: { at?: Timestamp | null; prefix?: string }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);
  if (!at) return null;
  const ms = at.toMillis();
  return (
    <time dateTime={new Date(ms).toISOString()} title={fullDateTime(ms)}>
      {prefix}
      {timeAgo(ms)}
    </time>
  );
}
